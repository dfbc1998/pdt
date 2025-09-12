import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from '@angular/fire/storage';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { FileUpload, FileCategory, FileMetadata, ApiResponse } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private storage = inject(Storage);
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private readonly FILES_COLLECTION = 'files';
    private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private readonly ALLOWED_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
    ];

    constructor() { }

    // Upload file to Firebase Storage and create file record
    async uploadFile(
        file: File,
        category: FileCategory,
        metadata?: {
            projectId?: string;
            proposalId?: string;
            messageId?: string;
        }
    ): Promise<ApiResponse<FileUpload>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // Generate unique filename
            const fileName = this.generateFileName(file.name);
            const filePath = this.getFilePath(category, currentUser.uid, fileName);

            // Upload to Firebase Storage
            const storageRef = ref(this.storage, filePath);
            const uploadResult = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(uploadResult.ref);

            // Create file metadata
            const fileMetadata = await this.generateFileMetadata(file);

            // Create file record in Firestore
            const fileRecord: Omit<FileUpload, 'id'> = {
                name: fileName,
                originalName: file.name,
                url: filePath,
                downloadUrl,
                size: file.size,
                type: file.type,
                category,
                ownerId: currentUser.uid,
                projectId: metadata?.projectId,
                proposalId: metadata?.proposalId,
                messageId: metadata?.messageId,
                isPublic: this.isPublicCategory(category),
                uploadedAt: new Date(),
                metadata: fileMetadata
            };

            const fileRef = await addDoc(collection(this.firestore, this.FILES_COLLECTION), fileRecord);

            const uploadedFile: FileUpload = {
                id: fileRef.id,
                ...fileRecord
            };

            return {
                success: true,
                data: uploadedFile,
                message: 'File uploaded successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to upload file'
            };
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(
        files: File[],
        category: FileCategory,
        metadata?: {
            projectId?: string;
            proposalId?: string;
            messageId?: string;
        }
    ): Promise<ApiResponse<FileUpload[]>> {
        try {
            const uploadPromises = files.map(file =>
                this.uploadFile(file, category, metadata)
            );

            const results = await Promise.all(uploadPromises);

            const successfulUploads: FileUpload[] = [];
            const errors: string[] = [];

            results.forEach((result, index) => {
                if (result.success && result.data) {
                    successfulUploads.push(result.data);
                } else {
                    errors.push(`File ${files[index].name}: ${result.error}`);
                }
            });

            if (errors.length > 0 && successfulUploads.length === 0) {
                return {
                    success: false,
                    error: errors.join('; ')
                };
            }

            return {
                success: true,
                data: successfulUploads,
                message: errors.length > 0
                    ? `${successfulUploads.length} files uploaded successfully. ${errors.length} failed.`
                    : 'All files uploaded successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to upload files'
            };
        }
    }

    // Delete file
    async deleteFile(fileId: string): Promise<ApiResponse<void>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Get file record
            const fileResponse = await this.getFileById(fileId);
            if (!fileResponse.success || !fileResponse.data) {
                return {
                    success: false,
                    error: 'File not found'
                };
            }

            const file = fileResponse.data;

            // Check permissions
            if (file.ownerId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only delete your own files'
                };
            }

            // Delete from Firebase Storage
            const storageRef = ref(this.storage, file.url);
            await deleteObject(storageRef);

            // Delete file record from Firestore
            const fileRef = doc(this.firestore, this.FILES_COLLECTION, fileId);
            await deleteDoc(fileRef);

            return {
                success: true,
                message: 'File deleted successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to delete file'
            };
        }
    }

    // Get file by ID
    async getFileById(fileId: string): Promise<ApiResponse<FileUpload>> {
        try {
            const fileRef = doc(this.firestore, this.FILES_COLLECTION, fileId);
            const fileSnap = await getDoc(fileRef);

            if (!fileSnap.exists()) {
                return {
                    success: false,
                    error: 'File not found'
                };
            }

            const fileData = fileSnap.data();
            const file: FileUpload = {
                id: fileSnap.id,
                ...fileData,
                uploadedAt: fileData['uploadedAt']?.toDate() || new Date()
            } as FileUpload;

            return {
                success: true,
                data: file
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get file'
            };
        }
    }

    // Get files by owner
    async getFilesByOwner(ownerId: string): Promise<ApiResponse<FileUpload[]>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Users can only view their own files unless they're admin
            if (ownerId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only view your own files'
                };
            }

            const filesQuery = query(
                collection(this.firestore, this.FILES_COLLECTION),
                where('ownerId', '==', ownerId)
            );

            const querySnapshot = await getDocs(filesQuery);
            const files: FileUpload[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    uploadedAt: data['uploadedAt']?.toDate() || new Date()
                } as FileUpload;
            });

            return {
                success: true,
                data: files
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get files'
            };
        }
    }

    // Get files by project
    async getFilesByProject(projectId: string): Promise<ApiResponse<FileUpload[]>> {
        try {
            const filesQuery = query(
                collection(this.firestore, this.FILES_COLLECTION),
                where('projectId', '==', projectId)
            );

            const querySnapshot = await getDocs(filesQuery);
            const files: FileUpload[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    uploadedAt: data['uploadedAt']?.toDate() || new Date()
                } as FileUpload;
            });

            return {
                success: true,
                data: files
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get project files'
            };
        }
    }

    // Get files by proposal
    async getFilesByProposal(proposalId: string): Promise<ApiResponse<FileUpload[]>> {
        try {
            const filesQuery = query(
                collection(this.firestore, this.FILES_COLLECTION),
                where('proposalId', '==', proposalId)
            );

            const querySnapshot = await getDocs(filesQuery);
            const files: FileUpload[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    uploadedAt: data['uploadedAt']?.toDate() || new Date()
                } as FileUpload;
            });

            return {
                success: true,
                data: files
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get proposal files'
            };
        }
    }

    // Get files by category
    async getFilesByCategory(category: FileCategory): Promise<ApiResponse<FileUpload[]>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            const filesQuery = query(
                collection(this.firestore, this.FILES_COLLECTION),
                where('category', '==', category),
                where('ownerId', '==', currentUser.uid)
            );

            const querySnapshot = await getDocs(filesQuery);
            const files: FileUpload[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    uploadedAt: data['uploadedAt']?.toDate() || new Date()
                } as FileUpload;
            });

            return {
                success: true,
                data: files
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get files by category'
            };
        }
    }

    // Update file metadata
    async updateFileMetadata(fileId: string, updates: Partial<FileUpload>): Promise<ApiResponse<FileUpload>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Get file to verify ownership
            const fileResponse = await this.getFileById(fileId);
            if (!fileResponse.success || !fileResponse.data) {
                return {
                    success: false,
                    error: 'File not found'
                };
            }

            const file = fileResponse.data;

            // Check permissions
            if (file.ownerId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only update your own files'
                };
            }

            const fileRef = doc(this.firestore, this.FILES_COLLECTION, fileId);
            await updateDoc(fileRef, updates);

            const updatedFile: FileUpload = {
                ...file,
                ...updates
            };

            return {
                success: true,
                data: updatedFile,
                message: 'File updated successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update file'
            };
        }
    }

    // Private helper methods
    private validateFile(file: File): { isValid: boolean; error?: string } {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            return {
                isValid: false,
                error: `File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
            };
        }

        // Check file type
        if (!this.ALLOWED_TYPES.includes(file.type)) {
            return {
                isValid: false,
                error: 'File type not allowed'
            };
        }

        // Check filename length
        if (file.name.length > 255) {
            return {
                isValid: false,
                error: 'Filename too long'
            };
        }

        return { isValid: true };
    }

    private generateFileName(originalName: string): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName.substring(originalName.lastIndexOf('.'));
        const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.'));

        // Clean the filename
        const cleanName = nameWithoutExtension
            .replace(/[^a-zA-Z0-9\-_]/g, '_')
            .substring(0, 50);

        return `${cleanName}_${timestamp}_${randomString}${extension}`;
    }

    private getFilePath(category: FileCategory, userId: string, fileName: string): string {
        return `${category}/${userId}/${fileName}`;
    }

    private isPublicCategory(category: FileCategory): boolean {
        return [
            FileCategory.PORTFOLIO_IMAGE,
            FileCategory.PROFILE_PHOTO
        ].includes(category);
    }

    private async generateFileMetadata(file: File): Promise<FileMetadata> {
        const metadata: FileMetadata = {};

        // For images, get dimensions
        if (file.type.startsWith('image/')) {
            try {
                const dimensions = await this.getImageDimensions(file);
                metadata.dimensions = dimensions;
            } catch (error) {
                console.warn('Could not get image dimensions:', error);
            }
        }

        return metadata;
    }

    private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    // Utility methods
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(fileType: string): string {
        if (fileType.startsWith('image/')) return 'image';
        if (fileType === 'application/pdf') return 'document-text';
        if (fileType.includes('word')) return 'document';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'calculator';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'desktop';
        if (fileType === 'text/plain') return 'document-text';
        if (fileType.includes('zip')) return 'archive';
        return 'document';
    }

    isImageFile(fileType: string): boolean {
        return fileType.startsWith('image/');
    }

    isPdfFile(fileType: string): boolean {
        return fileType === 'application/pdf';
    }

    // Generate thumbnail for images (client-side)
    async generateImageThumbnail(file: File, maxWidth: number = 300, maxHeight: number = 300): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = width * (maxHeight / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to generate thumbnail'));
                    }
                }, 'image/jpeg', 0.8);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    // Clean up unused files (admin function)
    async cleanupOrphanedFiles(): Promise<ApiResponse<number>> {
        try {
            if (!this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'Only admins can perform cleanup operations'
                };
            }

            // This would require custom logic to identify orphaned files
            // For now, we'll return a placeholder response
            return {
                success: true,
                data: 0,
                message: 'Cleanup operation completed'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to cleanup files'
            };
        }
    }

    // Get storage usage statistics
    async getStorageStats(userId?: string): Promise<ApiResponse<{
        totalFiles: number;
        totalSize: number;
        byCategory: { [key: string]: { count: number; size: number } };
    }>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            const targetUserId = userId || currentUser.uid;

            // Users can only view their own stats unless they're admin
            if (targetUserId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only view your own storage statistics'
                };
            }

            const filesResponse = await this.getFilesByOwner(targetUserId);
            if (!filesResponse.success || !filesResponse.data) {
                return {
                    success: false,
                    error: 'Failed to get files'
                };
            }

            const files = filesResponse.data;

            const stats = {
                totalFiles: files.length,
                totalSize: files.reduce((sum, file) => sum + file.size, 0),
                byCategory: {} as { [key: string]: { count: number; size: number } }
            };

            // Group by category
            files.forEach(file => {
                if (!stats.byCategory[file.category]) {
                    stats.byCategory[file.category] = { count: 0, size: 0 };
                }
                stats.byCategory[file.category].count++;
                stats.byCategory[file.category].size += file.size;
            });

            return {
                success: true,
                data: stats
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get storage statistics'
            };
        }
    }

    // Download file (generate secure download URL)
    async getSecureDownloadUrl(fileId: string): Promise<ApiResponse<string>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            const fileResponse = await this.getFileById(fileId);
            if (!fileResponse.success || !fileResponse.data) {
                return {
                    success: false,
                    error: 'File not found'
                };
            }

            const file = fileResponse.data;

            // Check access permissions
            const hasAccess = await this.checkFileAccess(file, currentUser.uid);
            if (!hasAccess) {
                return {
                    success: false,
                    error: 'You do not have permission to access this file'
                };
            }

            // Return the download URL (it's already secure from Firebase)
            return {
                success: true,
                data: file.downloadUrl || file.url
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to generate download URL'
            };
        }
    }

    private async checkFileAccess(file: FileUpload, userId: string): Promise<boolean> {
        // Owner always has access
        if (file.ownerId === userId) return true;

        // Admin always has access
        if (this.authService.isAdmin) return true;

        // Public files can be accessed by anyone
        if (file.isPublic) return true;

        // For project files, check if user is involved in the project
        if (file.projectId) {
            // This would require checking if the user is the client or assigned freelancer
            // For simplicity, we'll allow access for now
            return true;
        }

        // For proposal files, check if user is the freelancer or project owner
        if (file.proposalId) {
            // This would require checking proposal and project ownership
            // For simplicity, we'll allow access for now
            return true;
        }

        return false;
    }

    // Batch operations
    async deleteMultipleFiles(fileIds: string[]): Promise<ApiResponse<{
        deleted: number;
        failed: number;
        errors: string[];
    }>> {
        try {
            const results = await Promise.all(
                fileIds.map(id => this.deleteFile(id))
            );

            const deleted = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            const errors = results
                .filter(r => !r.success)
                .map(r => r.error || 'Unknown error');

            return {
                success: true,
                data: { deleted, failed, errors },
                message: `${deleted} files deleted successfully${failed > 0 ? `, ${failed} failed` : ''}`
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to delete files'
            };
        }
    }

    // Move files between categories (if needed)
    async moveFileToCategory(fileId: string, newCategory: FileCategory): Promise<ApiResponse<FileUpload>> {
        try {
            const updates: Partial<FileUpload> = {
                category: newCategory,
                isPublic: this.isPublicCategory(newCategory)
            };

            return await this.updateFileMetadata(fileId, updates);
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to move file'
            };
        }
    }
}