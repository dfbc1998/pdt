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
  IonLabel,
  IonList
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
  analyticsOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/interfaces';
import { Observable, BehaviorSubject } from 'rxjs';

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
    HeaderComponent,
    LoadingComponent
  ],
  template: `
    <app-header title="Panel de Administración"></app-header>
    
    <ion-content class="ion-padding">
      <div class="container mx-auto">
        @if (isLoading$ | async) {
          <app-loading message="Cargando panel de administración..."></app-loading>
        } @else {
          <!-- Welcome Section -->
          @if (currentUser$ | async; as user) {
            <div class="mb-6">
              <h1 class="text-2xl font-bold text-gray-800 mb-2">
                Panel de Administración
              </h1>
              <p class="text-gray-600">Gestión completa de la plataforma FreelancePro.</p>
            </div>
          }

          <!-- System Stats -->
          <ion-grid class="mb-6">
            <ion-row>
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="people-outline" class="text-4xl text-primary-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ adminStats.totalUsers || 0 }}</h3>
                    <p class="text-sm text-gray-600">Usuarios Totales</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="folder-outline" class="text-4xl text-success-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ adminStats.totalProjects || 0 }}</h3>
                    <p class="text-sm text-gray-600">Proyectos Totales</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="document-text-outline" class="text-4xl text-warning-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ adminStats.totalProposals || 0 }}</h3>
                    <p class="text-sm text-gray-600">Propuestas Totales</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="stats-chart-outline" class="text-4xl text-secondary-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ adminStats.activeProjects || 0 }}</h3>
                    <p class="text-sm text-gray-600">Proyectos Activos</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

          <!-- Admin Actions -->
          <ion-card class="mb-6">
            <ion-card-header>
              <ion-card-title>Acciones de Administración</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-grid>
                <ion-row>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" (click)="manageUsers()" class="action-button">
                      <ion-icon name="people-outline" slot="start"></ion-icon>
                      Gestionar Usuarios
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" fill="outline" (click)="manageProjects()" class="action-button">
                      <ion-icon name="folder-outline" slot="start"></ion-icon>
                      Gestionar Proyectos
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" fill="outline" (click)="viewReports()" class="action-button">
                      <ion-icon name="analytics-outline" slot="start"></ion-icon>
                      Reportes y Análisis
                    </ion-button>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" fill="outline" (click)="manageVerifications()" class="action-button">
                      <ion-icon name="shield-checkmark-outline" slot="start"></ion-icon>
                      Verificaciones
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" fill="outline" (click)="systemSettings()" class="action-button">
                      <ion-icon name="settings-outline" slot="start"></ion-icon>
                      Configuración Sistema
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" fill="outline" color="warning" (click)="viewAlerts()" class="action-button">
                      <ion-icon name="warning-outline" slot="start"></ion-icon>
                      Alertas del Sistema
                    </ion-button>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>

          <!-- Recent Activity -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Actividad Reciente del Sistema</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (recentActivity.length > 0) {
                <ion-list>
                  @for (activity of recentActivity; track activity.id) {
                    <ion-item>
                      <ion-icon [name]="getActivityIcon(activity.type)" slot="start" 
                               [color]="getActivityColor(activity.type)"></ion-icon>
                      <ion-label>
                        <h3>{{ activity.description }}</h3>
                        <p class="text-sm text-gray-600">{{ activity.date | date:'medium' }}</p>
                      </ion-label>
                    </ion-item>
                  }
                </ion-list>
              } @else {
                <div class="text-center py-8">
                  <ion-icon name="analytics-outline" class="text-6xl text-gray-300 mb-4"></ion-icon>
                  <h3 class="text-lg font-semibold text-gray-600 mb-2">Sistema funcionando correctamente</h3>
                  <p class="text-gray-500">No hay actividades recientes que reportar</p>
                </div>
              }
            </ion-card-content>
          </ion-card>

          <!-- Quick Stats Cards -->
          <ion-grid class="mt-6">
            <ion-row>
              <ion-col size="12" size-md="6">
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>Usuarios por Tipo</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span>Clientes:</span>
                        <span class="font-semibold">{{ adminStats.clientsCount || 0 }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Freelancers:</span>
                        <span class="font-semibold">{{ adminStats.freelancersCount || 0 }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Administradores:</span>
                        <span class="font-semibold">{{ adminStats.adminsCount || 0 }}</span>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>

              <ion-col size="12" size-md="6">
                <ion-card>
                  <ion-card-header>
                    <ion-card-title>Estado de Proyectos</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span>Publicados:</span>
                        <span class="font-semibold">{{ adminStats.publishedProjects || 0 }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>En Progreso:</span>
                        <span class="font-semibold">{{ adminStats.activeProjects || 0 }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Completados:</span>
                        <span class="font-semibold">{{ adminStats.completedProjects || 0 }}</span>
                      </div>
                    </div>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }

    .stats-card {
      border-radius: 1rem;
      transition: transform 0.2s ease;
    }

    .stats-card:hover {
      transform: translateY(-2px);
    }

    .action-button {
      --border-radius: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .space-y-2 > * + * {
      margin-top: 0.5rem;
    }

    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoadingSubject.asObservable();

  adminStats = {
    totalUsers: 150,
    totalProjects: 45,
    totalProposals: 234,
    activeProjects: 12,
    clientsCount: 89,
    freelancersCount: 60,
    adminsCount: 1,
    publishedProjects: 28,
    completedProjects: 15
  };

  recentActivity = [
    {
      id: 1,
      type: 'user_registered',
      description: 'Nuevo freelancer registrado: María García',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: 'project_created',
      description: 'Nuevo proyecto publicado: Desarrollo de App Móvil',
      date: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: 3,
      type: 'proposal_accepted',
      description: 'Propuesta aceptada para proyecto de Diseño Web',
      date: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];

  constructor() {
    addIcons({
      peopleOutline,
      folderOutline,
      documentTextOutline,
      settingsOutline,
      statsChartOutline,
      shieldCheckmarkOutline,
      warningOutline,
      analyticsOutline
    });
  }

  ngOnInit() {
    this.loadAdminDashboard();
  }

  private async loadAdminDashboard(): Promise<void> {
    try {
      // Simulate loading admin statistics
      // In a real app, this would call admin services
      setTimeout(() => {
        this.isLoadingSubject.next(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      this.isLoadingSubject.next(false);
    }
  }

  manageUsers(): void {
    // Navigate to user management
    console.log('Manage users - En desarrollo');
  }

  manageProjects(): void {
    // Navigate to project management
    this.router.navigate(['/projects']);
  }

  viewReports(): void {
    // Navigate to reports
    console.log('View reports - En desarrollo');
  }

  manageVerifications(): void {
    // Navigate to verification management
    console.log('Manage verifications - En desarrollo');
  }

  systemSettings(): void {
    // Navigate to system settings
    this.router.navigate(['/settings']);
  }

  viewAlerts(): void {
    // Navigate to system alerts
    console.log('View alerts - En desarrollo');
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'user_registered': return 'people-outline';
      case 'project_created': return 'folder-outline';
      case 'proposal_accepted': return 'document-text-outline';
      default: return 'analytics-outline';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'user_registered': return 'success';
      case 'project_created': return 'primary';
      case 'proposal_accepted': return 'warning';
      default: return 'medium';
    }
  }
}