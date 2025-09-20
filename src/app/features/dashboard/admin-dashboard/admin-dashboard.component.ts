import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  IonLabel,
  IonList,
  IonBadge,
  IonProgressBar,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  folderOutline,
  documentTextOutline,
  settingsOutline,
  statsChartOutline,
  shieldCheckmarkOutline,
  warningOutline,
  analyticsOutline,
  cashOutline,
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  trendingUpOutline,
  eyeOutline,
  notificationsOutline,
  mailOutline,
  searchOutline,
  filterOutline, chevronForwardOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import {
  User,
  Project,
  ProjectStatus,
  UserRole,
} from '../../../core/interfaces';

interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalFreelancers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  monthlyRevenue: number;
  newUsersThisMonth: number;
  projectsThisMonth: number;
  successRate: number;
  averageProjectValue: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  userName: string;
  timestamp: Date;
  details?: any;
}

@Component({
  selector: 'app-admin-dashboard',
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
    IonLabel,
    IonList,
    IonBadge,
    IonProgressBar,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoadingSubject.asObservable();

  currentUser: User | null = null;

  stats: AdminStats = {
    totalUsers: 0,
    totalClients: 0,
    totalFreelancers: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    newUsersThisMonth: 0,
    projectsThisMonth: 0,
    successRate: 0,
    averageProjectValue: 0
  };

  systemAlerts: SystemAlert[] = [];
  recentActivity: RecentActivity[] = [];
  recentProjects: Project[] = [];

  constructor() {
    addIcons({ peopleOutline, analyticsOutline, folderOutline, settingsOutline, cashOutline, trendingUpOutline, chevronForwardOutline, statsChartOutline, mailOutline, documentTextOutline, shieldCheckmarkOutline, warningOutline, timeOutline, checkmarkCircleOutline, alertCircleOutline, eyeOutline, notificationsOutline, searchOutline, filterOutline });
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user && user.role === UserRole.ADMIN) {
          this.loadDashboardData();
        }
      });
  }

  private async loadDashboardData(): Promise<void> {
    if (!this.currentUser || this.currentUser.role !== UserRole.ADMIN) return;

    try {
      this.isLoadingSubject.next(true);

      await Promise.all([
        this.loadAdminStats(),
        this.loadSystemAlerts(),
        this.loadRecentActivity(),
        this.loadRecentProjects()
      ]);

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      await this.showErrorToast('Error al cargar el panel de administración');
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  private async loadAdminStats(): Promise<void> {
    // Simular carga de estadísticas del sistema
    // En implementación real, estos datos vendrían de servicios especializados
    this.stats = {
      totalUsers: 1250,
      totalClients: 450,
      totalFreelancers: 800,
      totalProjects: 2100,
      activeProjects: 180,
      completedProjects: 1850,
      totalRevenue: 2500000,
      monthlyRevenue: 185000,
      newUsersThisMonth: 89,
      projectsThisMonth: 156,
      successRate: 87,
      averageProjectValue: 1250
    };
  }

  private async loadSystemAlerts(): Promise<void> {
    // Simular alertas del sistema
    this.systemAlerts = [
      {
        id: '1',
        type: 'warning',
        title: 'Uso de servidor alto',
        message: 'El uso del servidor ha superado el 85% en las últimas 2 horas',
        timestamp: new Date(),
        isRead: false,
        actionRequired: true
      },
      {
        id: '2',
        type: 'info',
        title: 'Nuevos registros',
        message: '15 nuevos usuarios se registraron en las últimas 24 horas',
        timestamp: new Date(Date.now() - 3600000),
        isRead: false,
        actionRequired: false
      },
      {
        id: '3',
        type: 'error',
        title: 'Error en pagos',
        message: '3 transacciones de pago fallaron y requieren revisión',
        timestamp: new Date(Date.now() - 7200000),
        isRead: false,
        actionRequired: true
      }
    ];
  }

  private async loadRecentActivity(): Promise<void> {
    // Simular actividad reciente
    this.recentActivity = [
      {
        id: '1',
        type: 'user_registration',
        description: 'Nuevo usuario registrado como Cliente',
        userName: 'María González',
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'project_completion',
        description: 'Proyecto completado exitosamente',
        userName: 'Carlos Rodríguez',
        timestamp: new Date(Date.now() - 1800000)
      },
      {
        id: '3',
        type: 'dispute_resolved',
        description: 'Disputa resuelta a favor del freelancer',
        userName: 'Ana Martínez',
        timestamp: new Date(Date.now() - 3600000)
      }
    ];
  }

  private async loadRecentProjects(): Promise<void> {
    try {
      const response = await this.projectService.getPublishedProjects();
      if (response.success && response.data) {
        this.recentProjects = response.data.slice(0, 5);
      }
    } catch (error) {
      console.error('Error loading recent projects:', error);
    }
  }

  // Navigation methods
  async manageUsers(): Promise<void> {
    await this.router.navigate(['/admin/users']);
  }

  async viewAnalytics(): Promise<void> {
    await this.router.navigate(['/admin/analytics']);
  }

  async manageProjects(): Promise<void> {
    await this.router.navigate(['/admin/projects']);
  }

  async systemSettings(): Promise<void> {
    await this.router.navigate(['/admin/settings']);
  }

  async viewReports(): Promise<void> {
    await this.router.navigate(['/admin/reports']);
  }

  async manageSupport(): Promise<void> {
    await this.router.navigate(['/admin/support']);
  }

  async viewProject(projectId: string): Promise<void> {
    await this.router.navigate(['/projects', projectId]);
  }

  // Alert management
  async markAlertAsRead(alertId: string): Promise<void> {
    const alert = this.systemAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      await this.showSuccessToast('Alerta marcada como leída');
    }
  }

  async dismissAlert(alertId: string): Promise<void> {
    this.systemAlerts = this.systemAlerts.filter(a => a.id !== alertId);
    await this.showSuccessToast('Alerta descartada');
  }

  async handleAlert(alert: SystemAlert): Promise<void> {
    if (alert.actionRequired) {
      const actionAlert = await this.alertController.create({
        header: 'Acción Requerida',
        message: `¿Deseas tomar acción sobre: ${alert.title}?`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Revisar',
            handler: () => {
              this.handleAlertAction(alert);
            }
          }
        ]
      });
      await actionAlert.present();
    } else {
      await this.markAlertAsRead(alert.id);
    }
  }

  private async handleAlertAction(alert: SystemAlert): Promise<void> {
    // Aquí iría la lógica específica para cada tipo de alerta
    await this.markAlertAsRead(alert.id);
    await this.showSuccessToast('Redirigiendo para manejar la alerta...');
  }

  // Helper methods
  getAlertColor(type: string): string {
    const colors: { [key: string]: string } = {
      'info': 'primary',
      'warning': 'warning',
      'error': 'danger',
      'success': 'success'
    };
    return colors[type] || 'medium';
  }

  getAlertIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'info': 'information-circle-outline',
      'warning': 'warning-outline',
      'error': 'alert-circle-outline',
      'success': 'checkmark-circle-outline'
    };
    return icons[type] || 'information-circle-outline';
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'user_registration': 'person-add-outline',
      'project_completion': 'checkmark-circle-outline',
      'dispute_resolved': 'shield-checkmark-outline',
      'payment_processed': 'cash-outline'
    };
    return icons[type] || 'information-circle-outline';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatDateFull(date: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  }

  getProjectStatusColor(status: ProjectStatus): string {
    const statusColors: { [key: string]: string } = {
      [ProjectStatus.DRAFT]: 'medium',
      [ProjectStatus.PUBLISHED]: 'primary',
      [ProjectStatus.IN_PROGRESS]: 'warning',
      [ProjectStatus.COMPLETED]: 'success',
      [ProjectStatus.CANCELLED]: 'danger',
      [ProjectStatus.PAUSED]: 'medium'
    };
    return statusColors[status] || 'medium';
  }

  getProjectStatusLabel(status: ProjectStatus): string {
    const statusLabels: { [key: string]: string } = {
      [ProjectStatus.DRAFT]: 'Borrador',
      [ProjectStatus.PUBLISHED]: 'Publicado',
      [ProjectStatus.IN_PROGRESS]: 'En Progreso',
      [ProjectStatus.COMPLETED]: 'Completado',
      [ProjectStatus.CANCELLED]: 'Cancelado',
      [ProjectStatus.PAUSED]: 'Pausado'
    };
    return statusLabels[status] || status;
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }
}