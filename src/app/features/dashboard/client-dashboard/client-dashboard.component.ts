// src/app/features/dashboard/client-dashboard/client-dashboard.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonBadge,
  IonList,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  folderOutline,
  peopleOutline,
  statsChartOutline,
  addOutline,
  eyeOutline,
  chatbubbleOutline,
  timeOutline,
  checkmarkCircleOutline,
  pauseCircleOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { User, Project, ProjectStatus } from '../../../core/interfaces';
import { Observable, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonBadge,
    IonList,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoadingSubject.asObservable();

  stats = {
    totalProjects: 0,
    draftProjects: 0,
    publishedProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalFreelancers: 0
  };

  recentProjects: Project[] = [];
  allProjects: Project[] = [];

  constructor() {
    addIcons({
      businessOutline,
      folderOutline,
      peopleOutline,
      statsChartOutline,
      addOutline,
      eyeOutline,
      chatbubbleOutline,
      timeOutline,
      checkmarkCircleOutline,
      pauseCircleOutline
    });
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        console.error('No authenticated user found');
        await this.showErrorToast('Usuario no autenticado');
        this.router.navigate(['/auth/login']);
        return;
      }

      // Verify user is a client
      if (!this.authService.isClient) {
        console.error('User is not a client');
        await this.showErrorToast('Acceso denegado: Solo clientes pueden acceder a esta página');
        this.router.navigate(['/dashboard']);
        return;
      }

      console.log('Loading projects for client:', currentUser.uid);

      // Load user's projects (using temporary method to avoid index requirement)
      let projectsResponse;
      try {
        // Try the regular method first
        projectsResponse = await this.projectService.getProjectsByClient(currentUser.uid);
      } catch (indexError) {
        console.log('Index required, falling back to temporary method');
        // If index error, use temporary method
        projectsResponse = await (this.projectService as any).getProjectsByClientTemp?.(currentUser.uid) ||
          { success: false, error: 'Temporary method not available' };
      }

      if (projectsResponse.success && projectsResponse.data) {
        this.allProjects = projectsResponse.data;
        console.log('Projects loaded successfully:', this.allProjects.length, 'projects');

        // Calculate stats
        this.calculateStats(this.allProjects);

        // Get recent projects (last 5)
        this.recentProjects = this.allProjects.slice(0, 5);

        console.log('Dashboard stats:', this.stats);
      } else {
        console.error('Error loading projects:', projectsResponse.error);
        await this.showErrorToast(projectsResponse.error || 'Error al cargar proyectos');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      await this.showErrorToast('Error al cargar el dashboard');
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  private calculateStats(projects: Project[]) {
    this.stats = {
      totalProjects: projects.length,
      draftProjects: projects.filter(p => p.status === ProjectStatus.DRAFT).length,
      publishedProjects: projects.filter(p => p.status === ProjectStatus.PUBLISHED).length,
      activeProjects: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
      completedProjects: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
      totalFreelancers: new Set(projects.filter(p => p.assignedFreelancerId).map(p => p.assignedFreelancerId)).size
    };
  }

  createProject(): void {
    this.router.navigate(['/projects/create']);
  }

  viewProjects(): void {
    this.router.navigate(['/projects']);
  }

  viewMessages(): void {
    this.router.navigate(['/messages']);
  }

  viewProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  viewAllProjects(): void {
    this.router.navigate(['/projects']);
  }

  editProject(projectId: string): void {
    this.router.navigate(['/projects', projectId, 'edit']);
  }

  getStatusColor(status: ProjectStatus): string {
    const colors: { [key in ProjectStatus]: string } = {
      [ProjectStatus.DRAFT]: 'medium',
      [ProjectStatus.PUBLISHED]: 'primary',
      [ProjectStatus.IN_PROGRESS]: 'warning',
      [ProjectStatus.UNDER_REVIEW]: 'tertiary',
      [ProjectStatus.COMPLETED]: 'success',
      [ProjectStatus.CANCELLED]: 'danger',
      [ProjectStatus.PAUSED]: 'dark'
    };
    return colors[status] || 'medium';
  }

  getStatusText(status: ProjectStatus): string {
    const labels: { [key in ProjectStatus]: string } = {
      [ProjectStatus.DRAFT]: 'Borrador',
      [ProjectStatus.PUBLISHED]: 'Publicado',
      [ProjectStatus.IN_PROGRESS]: 'En Progreso',
      [ProjectStatus.UNDER_REVIEW]: 'En Revisión',
      [ProjectStatus.COMPLETED]: 'Completado',
      [ProjectStatus.CANCELLED]: 'Cancelado',
      [ProjectStatus.PAUSED]: 'Pausado'
    };
    return labels[status] || status;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-CL');
  }

  getBudgetText(project: Project): string {
    const { budget } = project;
    switch (budget.type) {
      case 'fixed':
        return `$${budget.amount?.toLocaleString()} ${budget.currency}`;
      case 'hourly':
        return `$${budget.amount?.toLocaleString()}/hora ${budget.currency}`;
      case 'range':
        return `$${budget.minAmount?.toLocaleString()} - $${budget.maxAmount?.toLocaleString()} ${budget.currency}`;
      default:
        return 'No especificado';
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  async refreshData() {
    this.isLoadingSubject.next(true);
    await this.loadDashboardData();
  }
}