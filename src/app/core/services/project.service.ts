import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit } from '@angular/fire/firestore';
import { Project, ProjectStatus, ApiResponse, Milestone, MilestoneStatus } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private readonly COLLECTION_NAME = 'projects';
    private readonly MILESTONES_SUBCOLLECTION = 'milestones';

    constructor() { }

    // Create a new project
    async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Project>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser || !this.authService.isClient) {
                return {
                    success: false,
                    error: 'Only clients can create projects'
                };
            }

            const projectToCreate = {
                ...projectData,
                clientId: currentUser.uid,
                proposalCount: 0,
                viewCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const projectRef = await addDoc(collection(this.firestore, this.COLLECTION_NAME), projectToCreate);

            const createdProject: Project = {
                id: projectRef.id,
                ...projectToCreate
            };

            return {
                success: true,
                data: createdProject,
                message: 'Project created successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create project'
            };
        }
    }

    // Get project by ID
    async getProjectById(projectId: string): Promise<ApiResponse<Project>> {
        try {
            const projectRef = doc(this.firestore, this.COLLECTION_NAME, projectId);
            const projectSnap = await getDoc(projectRef);

            if (!projectSnap.exists()) {
                return {
                    success: false,
                    error: 'Project not found'
                };
            }

            const projectData = projectSnap.data();
            const project: Project = {
                id: projectSnap.id,
                ...projectData,
                createdAt: projectData['createdAt']?.toDate() || new Date(),
                updatedAt: projectData['updatedAt']?.toDate() || new Date(),
                applicationDeadline: projectData['applicationDeadline']?.toDate(),
                startDate: projectData['startDate']?.toDate(),
                endDate: projectData['endDate']?.toDate()
            } as Project;

            // Increment view count if user is different from owner
            const currentUser = this.authService.currentUser;
            if (currentUser && currentUser.uid !== project.clientId) {
                await this.incrementViewCount(projectId);
            }

            return {
                success: true,
                data: project
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get project'
            };
        }
    }

    // Update an existing project
    async updateProject(projectId: string, updates: Partial<Project>): Promise<ApiResponse<Project>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Check if user owns the project
            const project = await this.getProjectById(projectId);
            if (!project.success || !project.data) {
                return {
                    success: false,
                    error: 'Project not found'
                };
            }

            if (project.data.clientId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only update your own projects'
                };
            }

            const projectRef = doc(this.firestore, this.COLLECTION_NAME, projectId);
            const updateData = {
                ...updates,
                updatedAt: new Date()
            };

            await updateDoc(projectRef, updateData);

            const updatedProject: Project = {
                ...project.data,
                ...updateData
            };

            return {
                success: true,
                data: updatedProject,
                message: 'Project updated successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update project'
            };
        }
    }

    // Delete a project
    async deleteProject(projectId: string): Promise<ApiResponse<void>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            const project = await this.getProjectById(projectId);
            if (!project.success || !project.data) {
                return {
                    success: false,
                    error: 'Project not found'
                };
            }

            if (project.data.clientId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only delete your own projects'
                };
            }

            if ([ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED].includes(project.data.status)) {
                return {
                    success: false,
                    error: 'Cannot delete projects that are in progress or completed'
                };
            }

            const projectRef = doc(this.firestore, this.COLLECTION_NAME, projectId);
            await deleteDoc(projectRef);

            return {
                success: true,
                message: 'Project deleted successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to delete project'
            };
        }
    }

    // Get projects by client
    async getProjectsByClient(clientId: string): Promise<ApiResponse<Project[]>> {
        try {
            const projectsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('clientId', '==', clientId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(projectsQuery);
            const projects: Project[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data['createdAt']?.toDate() || new Date(),
                    updatedAt: data['updatedAt']?.toDate() || new Date(),
                    applicationDeadline: data['applicationDeadline']?.toDate(),
                    startDate: data['startDate']?.toDate(),
                    endDate: data['endDate']?.toDate()
                } as Project;
            });

            return {
                success: true,
                data: projects
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get client projects'
            };
        }
    }

    // Get all published projects
    async getPublishedProjects(limitCount: number = 20): Promise<ApiResponse<Project[]>> {
        try {
            const projectsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('status', '==', ProjectStatus.PUBLISHED),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(projectsQuery);
            const projects: Project[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data['createdAt']?.toDate() || new Date(),
                    updatedAt: data['updatedAt']?.toDate() || new Date(),
                    applicationDeadline: data['applicationDeadline']?.toDate(),
                    startDate: data['startDate']?.toDate(),
                    endDate: data['endDate']?.toDate()
                } as Project;
            });

            return {
                success: true,
                data: projects
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get published projects'
            };
        }
    }

    // Assign freelancer to project
    async assignFreelancer(projectId: string, freelancerId: string): Promise<ApiResponse<Project>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser || !this.authService.isClient) {
                return {
                    success: false,
                    error: 'Only clients can assign freelancers'
                };
            }

            const updates = {
                assignedFreelancerId: freelancerId,
                status: ProjectStatus.IN_PROGRESS,
                startDate: new Date(),
                updatedAt: new Date()
            };

            return await this.updateProject(projectId, updates);
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to assign freelancer'
            };
        }
    }

    // Update project status
    async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<ApiResponse<Project>> {
        try {
            const updates: Partial<Project> = {
                status,
                updatedAt: new Date()
            };

            if (status === ProjectStatus.COMPLETED) {
                updates.endDate = new Date();
            }

            return await this.updateProject(projectId, updates);
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update project status'
            };
        }
    }

    // Get featured projects
    async getFeaturedProjects(limitCount: number = 6): Promise<ApiResponse<Project[]>> {
        try {
            const projectsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('isFeatured', '==', true),
                where('status', '==', ProjectStatus.PUBLISHED),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(projectsQuery);
            const projects: Project[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data['createdAt']?.toDate() || new Date(),
                    updatedAt: data['updatedAt']?.toDate() || new Date(),
                    applicationDeadline: data['applicationDeadline']?.toDate(),
                    startDate: data['startDate']?.toDate(),
                    endDate: data['endDate']?.toDate()
                } as Project;
            });

            return {
                success: true,
                data: projects
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get featured projects'
            };
        }
    }

    // Milestone management
    async getMilestones(projectId: string): Promise<ApiResponse<Milestone[]>> {
        try {
            const milestonesQuery = query(
                collection(this.firestore, this.COLLECTION_NAME, projectId, this.MILESTONES_SUBCOLLECTION),
                orderBy('order', 'asc')
            );

            const querySnapshot = await getDocs(milestonesQuery);
            const milestones: Milestone[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dueDate: doc.data()['dueDate']?.toDate()
            } as Milestone));

            return {
                success: true,
                data: milestones
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get milestones'
            };
        }
    }

    async updateMilestone(projectId: string, milestoneId: string, updates: Partial<Milestone>): Promise<ApiResponse<Milestone>> {
        try {
            const milestoneRef = doc(this.firestore, this.COLLECTION_NAME, projectId, this.MILESTONES_SUBCOLLECTION, milestoneId);

            const updateData = {
                ...updates,
                updatedAt: new Date()
            };

            await updateDoc(milestoneRef, updateData);

            return {
                success: true,
                data: { id: milestoneId, ...updates } as Milestone,
                message: 'Milestone updated successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update milestone'
            };
        }
    }

    // Private helper methods
    private async incrementViewCount(projectId: string): Promise<void> {
        try {
            const projectRef = doc(this.firestore, this.COLLECTION_NAME, projectId);
            const projectSnap = await getDoc(projectRef);
            const currentViews = projectSnap.data()?.['viewCount'] || 0;

            await updateDoc(projectRef, {
                viewCount: currentViews + 1
            });
        } catch (error) {
            console.error('Failed to increment view count:', error);
        }
    }

    // Search projects by skills
    async searchProjectsBySkills(skills: string[], limitCount: number = 20): Promise<ApiResponse<Project[]>> {
        try {
            const projectsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('status', '==', ProjectStatus.PUBLISHED),
                where('requiredSkills', 'array-contains-any', skills),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(projectsQuery);
            const projects: Project[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data['createdAt']?.toDate() || new Date(),
                    updatedAt: data['updatedAt']?.toDate() || new Date(),
                    applicationDeadline: data['applicationDeadline']?.toDate(),
                    startDate: data['startDate']?.toDate(),
                    endDate: data['endDate']?.toDate()
                } as Project;
            });

            return {
                success: true,
                data: projects
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to search projects'
            };
        }
    }

    // Agregar este método temporal al ProjectService mientras se crea el índice

    // Get projects by client (versión temporal sin orderBy para evitar el índice)
    async getProjectsByClientTemp(clientId: string): Promise<ApiResponse<Project[]>> {
        try {
            console.log('Using temporary method without index requirement');

            const projectsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('clientId', '==', clientId)
                // Temporalmente removemos orderBy para evitar el índice
            );

            const querySnapshot = await getDocs(projectsQuery);
            let projects: Project[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data['createdAt']?.toDate() || new Date(),
                    updatedAt: data['updatedAt']?.toDate() || new Date(),
                    applicationDeadline: data['applicationDeadline']?.toDate(),
                    startDate: data['startDate']?.toDate(),
                    endDate: data['endDate']?.toDate()
                } as Project;
            });

            // Ordenamos manualmente en el cliente
            projects = projects.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            console.log(`Found ${projects.length} projects for client ${clientId}`);

            return {
                success: true,
                data: projects
            };
        } catch (error: any) {
            console.error('Error in getProjectsByClientTemp:', error);
            return {
                success: false,
                error: error.message || 'Failed to get client projects'
            };
        }
    }
}