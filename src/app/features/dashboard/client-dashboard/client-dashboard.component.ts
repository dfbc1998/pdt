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
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  folderOutline,
  peopleOutline,
  statsChartOutline,
  addOutline,
  eyeOutline,
  chatbubbleOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { User, Project, DashboardStats } from '../../../core/interfaces';
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
    IonLabel,
    HeaderComponent,
    LoadingComponent
  ],
  template: `
    <app-header title="Dashboard Cliente"></app-header>
    
    <ion-content class="ion-padding">
      <div class="container mx-auto">
        @if (isLoading$ | async) {
          <app-loading message="Cargando dashboard..."></app-loading>
        } @else {
          <!-- Welcome Section -->
          @if (currentUser$ | async; as user) {
            <div class="mb-6">
              <h1 class="text-2xl font-bold text-gray-800 mb-2">
                ¡Bienvenido de nuevo, {{ user.displayName || 'Cliente' }}!
              </h1>
              <p class="text-gray-600">Aquí tienes un resumen de tus proyectos y actividad.</p>
            </div>
          }

          <!-- Quick Stats -->
          <ion-grid class="mb-6">
            <ion-row>
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="folder-outline" class="text-4xl text-primary-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ stats.totalProjects || 0 }}</h3>
                    <p class="text-sm text-gray-600">Proyectos Totales</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="stats-chart-outline" class="text-4xl text-success-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ stats.activeProjects || 0 }}</h3>
                    <p class="text-sm text-gray-600">Proyectos Activos</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="people-outline" class="text-4xl text-warning-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ stats.totalFreelancers || 0 }}</h3>
                    <p class="text-sm text-gray-600">Freelancers Contratados</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="business-outline" class="text-4xl text-secondary-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ stats.completedProjects || 0 }}</h3>
                    <p class="text-sm text-gray-600">Proyectos Completados</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
            </ion-row>
          </ion-grid>

          <!-- Quick Actions -->
          <ion-card class="mb-6">
            <ion-card-header>
              <ion-card-title>Acciones Rápidas</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-grid>
                <ion-row>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" (click)="createProject()" class="action-button">
                      <ion-icon name="add-outline" slot="start"></ion-icon>
                      Crear Proyecto
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" fill="outline" (click)="viewProjects()" class="action-button">
                      <ion-icon name="eye-outline" slot="start"></ion-icon>
                      Ver Mis Proyectos
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="4">
                    <ion-button expand="block" fill="outline" (click)="viewMessages()" class="action-button">
                      <ion-icon name="chatbubble-outline" slot="start"></ion-icon>
                      Mensajes
                    </ion-button>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>

          <!-- Recent Projects -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Proyectos Recientes</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (recentProjects.length > 0) {
                <div class="space-y-2">
                  @for (project of recentProjects; track project.id) {
                    <ion-item button (click)="viewProject(project.id)" class="project-item">
                      <ion-label>
                        <h3 class="font-semibold">{{ project.title }}</h3>
                        <p class="text-sm text-gray-600">{{ project.description | slice:0:100 }}...</p>
                        <div class="flex items-center mt-2">
                          <span class="badge" [class]="getBadgeClass(project.status)">
                            {{ getStatusText(project.status) }}
                          </span>
                          <span class="text-xs text-gray-500 ml-2">
                            {{ project.createdAt | date:'short' }}
                          </span>
                        </div>
                      </ion-label>
                    </ion-item>
                  }
                </div>
                
                <div class="text-center mt-4">
                  <ion-button fill="clear" (click)="viewAllProjects()">
                    Ver todos los proyectos
                  </ion-button>
                </div>
              } @else {
                <div class="text-center py-8">
                  <ion-icon name="folder-outline" class="text-6xl text-gray-300 mb-4"></ion-icon>
                  <h3 class="text-lg font-semibold text-gray-600 mb-2">No tienes proyectos aún</h3>
                  <p class="text-gray-500 mb-4">Crea tu primer proyecto para comenzar a trabajar con freelancers</p>
                  <ion-button (click)="createProject()">
                    <ion-icon name="add-outline" slot="start"></ion-icon>
                    Crear Primer Proyecto
                  </ion-button>
                </div>
              }
            </ion-card-content>
          </ion-card>
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

    .project-item {
      --background: white;
      --border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .project-item:hover {
      --background: #f9fafb;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge-draft {
      background-color: #f3f4f6;
      color: #374151;
    }

    .badge-published {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .badge-in-progress {
      background-color: #fef3c7;
      color: #d97706;
    }

    .badge-completed {
      background-color: #dcfce7;
      color: #166534;
    }

    .space-y-2 > * + * {
      margin-top: 0.5rem;
    }
  `]
})
export class ClientDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoadingSubject.asObservable();

  stats = {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalFreelancers: 0
  };

  recentProjects: Project[] = [];

  constructor() {
    addIcons({
      businessOutline,
      folderOutline,
      peopleOutline,
      statsChartOutline,
      addOutline,
      eyeOutline,
      chatbubbleOutline
    });
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      const currentUser = this.authService.currentUser;
      if (!currentUser) return;

      // Load user's projects
      const projectsResponse = await this.projectService.getProjectsByClient(currentUser.uid);
      if (projectsResponse.success && projectsResponse.data) {
        const projects = projectsResponse.data;

        // Calculate stats
        this.stats = {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'in_progress').length,
          completedProjects: projects.filter(p => p.status === 'completed').length,
          totalFreelancers: new Set(projects.filter(p => p.assignedFreelancerId).map(p => p.assignedFreelancerId)).size
        };

        // Get recent projects (last 5)
        this.recentProjects = projects.slice(0, 5);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoadingSubject.next(false);
    }
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

  getBadgeClass(status: string): string {
    switch (status) {
      case 'draft': return 'badge-draft';
      case 'published': return 'badge-published';
      case 'in_progress': return 'badge-in-progress';
      case 'completed': return 'badge-completed';
      default: return 'badge-draft';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'published': return 'Publicado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return 'Borrador';
    }
  }
}