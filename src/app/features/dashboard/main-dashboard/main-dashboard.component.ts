import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Ionic Components
import {
  IonContent,
  IonButton,
  IonIcon,
  NavController,
  ToastController
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  refreshOutline,
  briefcaseOutline,
  peopleOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline,
  compassOutline,
  checkmarkCircleOutline,
  pulseOutline,
  trophyOutline,
  chevronForwardOutline,
  informationCircleOutline,
  addCircleOutline,
  searchOutline,
  documentTextOutline,
  analyticsOutline,
  mailOutline,
  personOutline
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import {
  User,
  UserRole,
} from '../../../core/interfaces';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorClass: string;
  route: string;
}

interface QuickStats {
  projects: number;
  users: number;
  activity: number;
  success: number;
}

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.scss']
})
export class MainDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private navController = inject(NavController);
  private toastController = inject(ToastController);
  private router = inject(Router);

  // Observables
  currentUser$: Observable<User | null> = this.authService.currentUser$;

  // Component State
  currentUser: User | null = null;
  currentUserRole: string = '';
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Dashboard Data
  quickStats: QuickStats = {
    projects: 0,
    users: 0,
    activity: 0,
    success: 95
  };

  dailyTip = 'Completa tu perfil para recibir mejores oportunidades y aumentar tu credibilidad en la plataforma.';

  constructor() {
    this.registerIcons();
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
      alertCircleOutline,
      refreshOutline,
      briefcaseOutline,
      peopleOutline,
      settingsOutline,
      shieldCheckmarkOutline,
      arrowForwardOutline,
      compassOutline,
      checkmarkCircleOutline,
      pulseOutline,
      trophyOutline,
      chevronForwardOutline,
      informationCircleOutline,
      addCircleOutline,
      searchOutline,
      documentTextOutline,
      analyticsOutline,
      mailOutline,
      personOutline
    });
  }

  private initializeComponent(): void {
    // Subscribe to current user
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.currentUserRole = user.role;
          this.loadDashboardData();
        } else {
          this.handleAuthError();
        }
      });
  }

  private async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      this.hasError = false;

      // Simulate loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // Load quick stats based on user role
      await this.loadQuickStats();

      this.isLoading = false;

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        if (!this.hasError) {
          this.goToDashboard();
        }
      }, 3000);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.handleError('Error al cargar los datos del dashboard');
    }
  }

  private async loadQuickStats(): Promise<void> {
    try {
      // Mock data - replace with actual service calls
      this.quickStats = {
        projects: this.currentUserRole === UserRole.CLIENT ? 5 : 12,
        users: this.currentUserRole === UserRole.CLIENT ? 150 : 45,
        activity: Math.floor(Math.random() * 20) + 10,
        success: 95
      };

      // Set dynamic daily tip
      this.setDailyTip();
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  }

  private setDailyTip(): void {
    const tips = {
      [UserRole.CLIENT]: [
        'Un proyecto bien detallado recibe 3x más propuestas de calidad.',
        'Responde rápidamente a los freelancers para mantener el interés.',
        'Define hitos claros para proyectos grandes - facilita el seguimiento.',
        'Revisa el portafolio de los freelancers antes de contratarlos.'
      ],
      [UserRole.FREELANCER]: [
        'Las propuestas personalizadas tienen 5x más probabilidad de éxito.',
        'Mantén tu perfil actualizado con proyectos recientes.',
        'Responde a mensajes en menos de 2 horas para mejores oportunidades.',
        'Especialízate en 2-3 áreas para destacar como experto.'
      ],
      [UserRole.ADMIN]: [
        'Revisa regularmente los reportes de actividad de la plataforma.',
        'Mantén una comunicación proactiva con usuarios activos.',
        'Monitorea las métricas de calidad para mantener estándares altos.',
        'Actualiza las políticas de la plataforma según feedback de usuarios.'
      ]
    };

    const roleTips = tips[this.currentUserRole as UserRole] || tips[UserRole.CLIENT];
    const randomIndex = Math.floor(Math.random() * roleTips.length);
    this.dailyTip = roleTips[randomIndex];
  }

  private handleAuthError(): void {
    this.handleError('No se pudo cargar la información del usuario');
  }

  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
  }

  // UI Helper Methods
  getRoleIcon(role: string): string {
    const roleIcons: { [key: string]: string } = {
      [UserRole.CLIENT]: 'briefcase-outline',
      [UserRole.FREELANCER]: 'person-outline',
      [UserRole.ADMIN]: 'shield-checkmark-outline'
    };
    return roleIcons[role] || 'person-outline';
  }

  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      [UserRole.CLIENT]: 'Cliente',
      [UserRole.FREELANCER]: 'Freelancer',
      [UserRole.ADMIN]: 'Administrador'
    };
    return roleLabels[role] || 'Usuario';
  }

  getDashboardIcon(role: string): string {
    const dashboardIcons: { [key: string]: string } = {
      [UserRole.CLIENT]: 'briefcase-outline',
      [UserRole.FREELANCER]: 'person-outline',
      [UserRole.ADMIN]: 'analytics-outline'
    };
    return dashboardIcons[role] || 'briefcase-outline';
  }

  getDashboardTitle(role: string): string {
    const titles: { [key: string]: string } = {
      [UserRole.CLIENT]: 'Dashboard de Cliente',
      [UserRole.FREELANCER]: 'Dashboard de Freelancer',
      [UserRole.ADMIN]: 'Panel de Administración'
    };
    return titles[role] || 'Dashboard';
  }

  getDashboardDescription(role: string): string {
    const descriptions: { [key: string]: string } = {
      [UserRole.CLIENT]: 'Gestiona tus proyectos, encuentra freelancers talentosos y supervisa el progreso de tus trabajos.',
      [UserRole.FREELANCER]: 'Descubre oportunidades increíbles, gestiona tus propuestas y construye tu reputación profesional.',
      [UserRole.ADMIN]: 'Supervisa la plataforma completa, gestiona usuarios y mantén la calidad del servicio.'
    };
    return descriptions[role] || 'Accede a todas las funcionalidades de tu cuenta.';
  }

  getDashboardFeatures(role: string): string[] {
    const features: { [key: string]: string[] } = {
      [UserRole.CLIENT]: [
        'Crear y gestionar proyectos',
        'Evaluar propuestas de freelancers',
        'Chat directo con profesionales',
        'Seguimiento de hitos y pagos'
      ],
      [UserRole.FREELANCER]: [
        'Buscar proyectos relevantes',
        'Enviar propuestas personalizadas',
        'Gestionar trabajos activos',
        'Construir tu portafolio'
      ],
      [UserRole.ADMIN]: [
        'Gestionar usuarios y roles',
        'Supervisar actividad de la plataforma',
        'Reportes y analíticas avanzadas',
        'Configuración del sistema'
      ]
    };
    return features[role] || ['Funcionalidades básicas'];
  }

  getQuickActions(role: string): QuickAction[] {
    const actions: { [key: string]: QuickAction[] } = {
      [UserRole.CLIENT]: [
        {
          id: 'create-project',
          title: 'Crear Proyecto',
          description: 'Publica un nuevo proyecto y recibe propuestas',
          icon: 'add-circle-outline',
          colorClass: 'action-primary',
          route: '/projects/create'
        },
        {
          id: 'browse-freelancers',
          title: 'Buscar Freelancers',
          description: 'Encuentra profesionales para tus proyectos',
          icon: 'search-outline',
          colorClass: 'action-success',
          route: '/freelancers'
        },
        {
          id: 'view-proposals',
          title: 'Ver Propuestas',
          description: 'Revisa las propuestas recibidas',
          icon: 'document-text-outline',
          colorClass: 'action-warning',
          route: '/proposals'
        },
        {
          id: 'messages',
          title: 'Mensajes',
          description: 'Comunícate con freelancers',
          icon: 'mail-outline',
          colorClass: 'action-purple',
          route: '/messages'
        }
      ],
      [UserRole.FREELANCER]: [
        {
          id: 'browse-projects',
          title: 'Explorar Proyectos',
          description: 'Encuentra oportunidades perfectas para ti',
          icon: 'search-outline',
          colorClass: 'action-primary',
          route: '/projects'
        },
        {
          id: 'my-proposals',
          title: 'Mis Propuestas',
          description: 'Gestiona tus propuestas enviadas',
          icon: 'document-text-outline',
          colorClass: 'action-success',
          route: '/proposals/my-proposals'
        },
        {
          id: 'update-profile',
          title: 'Actualizar Perfil',
          description: 'Mejora tu perfil profesional',
          icon: 'person-outline',
          colorClass: 'action-warning',
          route: '/profile/edit'
        },
        {
          id: 'messages',
          title: 'Mensajes',
          description: 'Comunícate con clientes',
          icon: 'mail-outline',
          colorClass: 'action-purple',
          route: '/messages'
        }
      ],
      [UserRole.ADMIN]: [
        {
          id: 'user-management',
          title: 'Gestionar Usuarios',
          description: 'Administrar cuentas y perfiles',
          icon: 'people-outline',
          colorClass: 'action-primary',
          route: '/admin/users'
        },
        {
          id: 'platform-stats',
          title: 'Estadísticas',
          description: 'Ver métricas de la plataforma',
          icon: 'analytics-outline',
          colorClass: 'action-success',
          route: '/admin/stats'
        },
        {
          id: 'system-settings',
          title: 'Configuración',
          description: 'Ajustes del sistema',
          icon: 'settings-outline',
          colorClass: 'action-warning',
          route: '/admin/settings'
        },
        {
          id: 'support',
          title: 'Soporte',
          description: 'Gestionar tickets de soporte',
          icon: 'mail-outline',
          colorClass: 'action-purple',
          route: '/admin/support'
        }
      ]
    };
    return actions[role] || [];
  }

  // Navigation Methods
  async goToDashboard(): Promise<void> {
    const dashboardRoutes: { [key: string]: string } = {
      [UserRole.CLIENT]: '/dashboard/client',
      [UserRole.FREELANCER]: '/dashboard/freelancer',
      [UserRole.ADMIN]: '/dashboard/admin'
    };

    const route = dashboardRoutes[this.currentUserRole] || '/dashboard/client';
    await this.navController.navigateRoot(route);
  }

  async exploreFeatures(): Promise<void> {
    // Navigate to a features overview page or help section
    const exploreRoutes: { [key: string]: string } = {
      [UserRole.CLIENT]: '/help/client-guide',
      [UserRole.FREELANCER]: '/help/freelancer-guide',
      [UserRole.ADMIN]: '/help/admin-guide'
    };

    const route = exploreRoutes[this.currentUserRole] || '/help';
    await this.navController.navigateForward(route);
  }

  async executeQuickAction(action: QuickAction): Promise<void> {
    try {
      await this.navController.navigateForward(action.route);
      await this.showSuccessToast(`Navegando a ${action.title}`);
    } catch (error) {
      console.error('Error executing quick action:', error);
      await this.showErrorToast('Error al navegar');
    }
  }

  // Error Handling & Retry
  async retryLoad(): Promise<void> {
    this.hasError = false;
    this.errorMessage = '';
    await this.loadDashboardData();
  }

  // Toast Messages
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Actualizaciones necesarias para src/app/features/dashboard/main-dashboard/main-dashboard.component.ts
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // Cambiar el método getDashboardSubtitle para usar FreeWork
  getDashboardSubtitle(role: string): string {
    const descriptions: { [key: string]: string } = {
      [UserRole.CLIENT]: 'Publica proyectos, encuentra talento excepcional y gestiona tu trabajo en FreeWork.',
      [UserRole.FREELANCER]: 'Descubre oportunidades increíbles, gestiona tus propuestas y construye tu reputación profesional en FreeWork.',
      [UserRole.ADMIN]: 'Supervisa la plataforma FreeWork completa, gestiona usuarios y mantén la calidad del servicio.'
    };
    return descriptions[role] || 'Accede a todas las funcionalidades de tu cuenta en FreeWork.';
  }

  // También actualizar cualquier mensaje de bienvenida
  getWelcomeMessage(user: User): string {
    const timeOfDay = this.getTimeOfDay();
    return `¡${timeOfDay}, ${user.displayName || 'Usuario'}! Bienvenido a FreeWork.`;
  }
}