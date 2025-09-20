// src/app/features/dashboard/client-dashboard/client-dashboard.component.ts - VERSIÓN COMPLETA
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Ionic Components
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
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';

// Iconicons
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
  pauseCircleOutline,
  refreshOutline,
  briefcaseOutline,
  documentTextOutline,
  pulseOutline,
  megaphoneOutline,
  addCircleOutline,
  bulbOutline,
  chevronForwardOutline,
  createOutline
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { User, Project, ProjectStatus } from '../../../core/interfaces';

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
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  // Observable states
  currentUser$: Observable<User | null> = this.authService.currentUser$;
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoadingSubject.asObservable();

  // Component data
  currentUser: User | null = null;
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

  // Daily tips for clients
  tips: string[] = [
    'Un proyecto bien detallado recibe 3x más propuestas de calidad.',
    'Responde rápidamente a los freelancers para mantener el interés.',
    'Define hitos claros para proyectos grandes - facilita el seguimiento.',
    'Revisa el portafolio de los freelancers antes de contratarlos.',
    'Establece un presupuesto realista para atraer freelancers experimentados.',
    'Comunica expectativas claras desde el inicio del proyecto.',
    'Proporciona feedback constructivo durante el desarrollo.'
  ];
  dailyTip: string = '';

  constructor() {
    this.registerIcons();
    this.setDailyTip();
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private registerIcons(): void {
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
      pauseCircleOutline,
      refreshOutline,
      briefcaseOutline,
      documentTextOutline,
      pulseOutline,
      megaphoneOutline,
      addCircleOutline,
      bulbOutline,
      chevronForwardOutline,
      createOutline
    });
  }

  private setDailyTip(): void {
    const randomIndex = Math.floor(Math.random() * this.tips.length);
    this.dailyTip = this.tips[randomIndex];
  }

  private initializeComponent(): void {
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData();
        } else {
          this.router.navigate(['/auth/login']);
        }
      });
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

  private calculateStats(projects: Project[]): void {
    this.stats = {
      totalProjects: projects.length,
      draftProjects: projects.filter(p => p.status === ProjectStatus.DRAFT).length,
      publishedProjects: projects.filter(p => p.status === ProjectStatus.PUBLISHED).length,
      activeProjects: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
      completedProjects: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
      totalFreelancers: new Set(projects.filter(p => p.assignedFreelancerId).map(p => p.assignedFreelancerId)).size
    };
  }

  // ===== EVENT HANDLERS ===== //

  async onRefresh(event: any): Promise<void> {
    await this.loadDashboardData();
    event.target.complete();
  }

  async refreshData(): Promise<void> {
    this.isLoadingSubject.next(true);
    await this.loadDashboardData();
  }

  // ===== NAVIGATION METHODS ===== //

  createProject(): void {
    this.router.navigate(['/projects/create']);
  }

  viewProjects(): void {
    this.router.navigate(['/projects']);
  }

  viewMessages(): void {
    this.router.navigate(['/messages']);
  }

  viewFreelancers(): void {
    this.router.navigate(['/freelancers']);
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

  // ===== HELPER METHODS ===== //

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

  // ===== TOAST METHODS ===== //

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }
}