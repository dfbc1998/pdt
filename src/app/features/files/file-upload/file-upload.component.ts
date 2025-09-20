import { Component, Input, Output, EventEmitter, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonList,
  IonChip,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentOutline,
  imageOutline,
  videocamOutline,
  musicalNotesOutline,
  archiveOutline,
  closeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  folderOutline, refreshOutline, informationCircleOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { FileUpload, FileCategory, User } from '../../../core/interfaces';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: FileUpload;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonProgressBar,
    IonList,
    IonChip,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner
  ],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @Input() defaultCategory: FileCategory = FileCategory.DOCUMENT;
  @Input() allowedTypes: string[] = [];
  @Input() maxFileSize: number = 50 * 1024 * 1024; // 50MB
  @Input() maxFiles: number = 10;
  @Input() projectId?: string;
  @Input() proposalId?: string;
  @Input() messageId?: string;

  @Output() onUploadComplete = new EventEmitter<FileUpload[]>();
  @Output() onUploadError = new EventEmitter<string>();

  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  private storageService = inject(StorageService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private router = inject(Router);

  currentUser: User | null = null;
  selectedCategory: FileCategory = FileCategory.DOCUMENT;
  uploadQueue: UploadProgress[] = [];
  isUploading = false;
  isDragOver = false;

  // Available categories
  fileCategories = [
    { value: FileCategory.DOCUMENT, label: 'Documento', icon: 'document-outline' },
    { value: FileCategory.PROJECT_ATTACHMENT, label: 'Adjunto de Proyecto', icon: 'folder-outline' },
    { value: FileCategory.PROPOSAL_ATTACHMENT, label: 'Adjunto de Propuesta', icon: 'document-outline' },
    { value: FileCategory.MESSAGE_ATTACHMENT, label: 'Adjunto de Mensaje', icon: 'document-outline' },
    { value: FileCategory.PORTFOLIO_IMAGE, label: 'Imagen de Portafolio', icon: 'image-outline' },
    { value: FileCategory.PROFILE_PHOTO, label: 'Foto de Perfil', icon: 'image-outline' },
    { value: FileCategory.OTHER, label: 'Otros', icon: 'document-outline' }
  ];

  // File type icons
  fileTypeIcons: { [key: string]: string } = {
    'application/pdf': 'document-outline',
    'application/msword': 'document-outline',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document-outline',
    'application/vnd.ms-excel': 'document-outline',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document-outline',
    'image/jpeg': 'image-outline',
    'image/png': 'image-outline',
    'image/gif': 'image-outline',
    'image/webp': 'image-outline',
    'video/mp4': 'videocam-outline',
    'video/webm': 'videocam-outline',
    'audio/mp3': 'musical-notes-outline',
    'audio/wav': 'musical-notes-outline',
    'application/zip': 'archive-outline',
    'application/x-zip-compressed': 'archive-outline'
  };

  constructor() {
    addIcons({ folderOutline, cloudUploadOutline, documentOutline, closeOutline, checkmarkCircleOutline, refreshOutline, informationCircleOutline, imageOutline, videocamOutline, musicalNotesOutline, archiveOutline, alertCircleOutline });
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUser;
    this.selectedCategory = this.defaultCategory;

    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }
  }

  // Helper methods for template
  hasCompletedOrErrorFiles(): boolean {
    return this.uploadQueue.some(item => item.status === 'completed' || item.status === 'error');
  }

  getCompletedFilesCount(): number {
    return this.uploadQueue.filter(item => item.status === 'completed').length;
  }

  getTotalProgress(): number {
    if (this.uploadQueue.length === 0) return 0;
    const totalProgress = this.uploadQueue.reduce((acc, item) => acc + item.progress, 0);
    return totalProgress / (this.uploadQueue.length * 100);
  }

  hasFailedFiles(): boolean {
    return this.uploadQueue.some(item => item.status === 'error');
  }

  // File selection methods
  onFileInputChange(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
    // Clear the input
    event.target.value = '';
  }

  openFilePicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  // Drag and drop methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  // File handling
  private handleFiles(files: File[]): void {
    if (this.uploadQueue.length + files.length > this.maxFiles) {
      this.showErrorToast(`No puedes subir más de ${this.maxFiles} archivos a la vez`);
      return;
    }

    const validFiles = files.filter(file => this.validateFile(file));

    for (const file of validFiles) {
      this.uploadQueue.push({
        file,
        progress: 0,
        status: 'pending'
      });
    }
  }

  private validateFile(file: File): boolean {
    // Check file size
    if (file.size > this.maxFileSize) {
      this.showErrorToast(`El archivo ${file.name} es demasiado grande. Máximo ${this.formatFileSize(this.maxFileSize)}`);
      return false;
    }

    // Check file type if restrictions are set
    if (this.allowedTypes.length > 0 && !this.allowedTypes.includes(file.type)) {
      this.showErrorToast(`El tipo de archivo ${file.type} no está permitido`);
      return false;
    }

    return true;
  }

  // Upload methods
  async startUpload(): Promise<void> {
    if (this.uploadQueue.length === 0 || this.isUploading) return;

    this.isUploading = true;
    const completedFiles: FileUpload[] = [];

    try {
      for (let i = 0; i < this.uploadQueue.length; i++) {
        const uploadItem = this.uploadQueue[i];
        uploadItem.status = 'uploading';

        try {
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            if (uploadItem.progress < 90) {
              uploadItem.progress += Math.random() * 20;
            }
          }, 200);

          const result = await this.storageService.uploadFile(
            uploadItem.file,
            this.selectedCategory,
            {
              projectId: this.projectId,
              proposalId: this.proposalId,
              messageId: this.messageId
            }
          );

          clearInterval(progressInterval);

          if (result.success && result.data) {
            uploadItem.progress = 100;
            uploadItem.status = 'completed';
            uploadItem.result = result.data;
            completedFiles.push(result.data);
          } else {
            uploadItem.status = 'error';
            uploadItem.error = result.error || 'Error desconocido';
          }
        } catch (error: any) {
          uploadItem.status = 'error';
          uploadItem.error = error.message || 'Error de subida';
        }
      }

      // Show results
      const successful = this.uploadQueue.filter(item => item.status === 'completed').length;
      const failed = this.uploadQueue.filter(item => item.status === 'error').length;

      if (successful > 0) {
        this.showSuccessToast(`${successful} archivo(s) subido(s) exitosamente`);
        this.onUploadComplete.emit(completedFiles);
      }

      if (failed > 0) {
        this.showErrorToast(`${failed} archivo(s) fallaron en la subida`);
      }

    } catch (error: any) {
      this.showErrorToast('Error durante la subida: ' + error.message);
      this.onUploadError.emit(error.message);
    } finally {
      this.isUploading = false;
    }
  }

  // Queue management
  removeFromQueue(index: number): void {
    if (!this.isUploading) {
      this.uploadQueue.splice(index, 1);
    }
  }

  clearQueue(): void {
    if (!this.isUploading) {
      this.uploadQueue = [];
    }
  }

  clearCompleted(): void {
    this.uploadQueue = this.uploadQueue.filter(item =>
      item.status !== 'completed' && item.status !== 'error'
    );
  }

  // Retry failed uploads
  async retryFailed(): Promise<void> {
    const failedItems = this.uploadQueue.filter(item => item.status === 'error');
    for (const item of failedItems) {
      item.status = 'pending';
      item.progress = 0;
      item.error = undefined;
    }
    await this.startUpload();
  }

  // Utility methods
  getFileIcon(file: File): string {
    return this.fileTypeIcons[file.type] || 'document-outline';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'checkmark-circle-outline';
      case 'error':
        return 'alert-circle-outline';
      default:
        return 'document-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'danger';
      case 'uploading':
        return 'primary';
      default:
        return 'medium';
    }
  }

  // Toast methods
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  // Navigation
  goToFileManager(): void {
    this.router.navigate(['/files']);
  }
}