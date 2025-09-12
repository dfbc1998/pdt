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
  briefcaseOutline,
  documentTextOutline,
  starOutline,
  trendingUpOutline,
  searchOutline,
  eyeOutline,
  chatbubbleOutline,
  personOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AuthService } from '../../../core/services/auth.service';
import { ProposalService } from '../../../core/services/proposal.service';
import { User, Proposal } from '../../../core/interfaces';
import { Observable, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-freelancer-dashboard',
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
    <app-header title="Dashboard Freelancer"></app-header>
    
    <ion-content class="ion-padding">
      <div class="container mx-auto">
        @if (isLoading$ | async) {
          <app-loading message="Cargando dashboard..."></app-loading>
        } @else {
          <!-- Welcome Section -->
          @if (currentUser$ | async; as user) {
            <div class="mb-6">
              <h1 class="text-2xl font-bold text-gray-800 mb-2">
                ¡Hola, {{ user.displayName || 'Freelancer' }}!
              </h1>
              <p class="text-gray-600">Encuentra nuevos proyectos y gestiona tus propuestas.</p>
            </div>
          }

          <!-- Quick Stats -->
          <ion-grid class="mb-6">
            <ion-row>
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="document-text-outline" class="text-4xl text-primary-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ stats.totalProposals || 0 }}</h3>
                    <p class="text-sm text-gray-600">Propuestas Enviadas</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="briefcase-outline" class="text-4xl text-success-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ stats.activeProjects || 0 }}</h3>
                    <p class="text-sm text-gray-600">Proyectos Activos</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="star-outline" class="text-4xl text-warning-600 mb-2"></ion-icon>
                    <h3 class="text-2xl font-bold text-gray-800">{{ stats.successRate || 0 }}%</h3>
                    <p class="text-sm text-gray-600">Tasa de Éxito</p>
                  </ion-card-content>
                </ion-card>
              </ion-col>
              
              <ion-col size="12" size-md="3" size-lg="3">
                <ion-card class="stats-card">
                  <ion-card-content class="text-center">
                    <ion-icon name="trending-up-outline" class="text-4xl text-secondary-600 mb-2"></ion-icon>
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
                  <ion-col size="12" size-md="3">
                    <ion-button expand="block" (click)="browseProjects()" class="action-button">
                      <ion-icon name="search-outline" slot="start"></ion-icon>
                      Buscar Proyectos
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="3">
                    <ion-button expand="block" fill="outline" (click)="viewMyProposals()" class="action-button">
                      <ion-icon name="eye-outline" slot="start"></ion-icon>
                      Mis Propuestas
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="3">
                    <ion-button expand="block" fill="outline" (click)="viewMessages()" class="action-button">
                      <ion-icon name="chatbubble-outline" slot="start"></ion-icon>
                      Mensajes
                    </ion-button>
                  </ion-col>
                  <ion-col size="12" size-md="3">
                    <ion-button expand="block" fill="outline" (click)="editProfile()" class="action-button">
                      <ion-icon name="person-outline" slot="start"></ion-icon>
                      Editar Perfil
                    </ion-button>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>

          <!-- Recent Proposals -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Propuestas Recientes</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (recentProposals.length > 0) {
                <div class="space-y-2">
                  @for (proposal of recentProposals; track proposal.id) {
                    <ion-item button (click)="viewProposal(proposal.id)" class="proposal-item">
                      <ion-label>
                        <h3 class="font-semibold">Propuesta para proyecto</h3>
                        <p class="text-sm text-gray-600">{{ proposal.coverLetter | slice:0:100 }}...</p>
                        <div class="flex items-center mt-2">
                          <span class="badge" [class]="getProposalBadgeClass(proposal.status)">
                            {{ getProposalStatusText(proposal.status) }}
                          </span>
                          <span class="text-xs text-gray-500 ml-2">
                            {{ proposal.submittedAt | date:'short' }}
                          </span>
                        </div>
                      </ion-label>
                    </ion-item>
                  }
                </div>
                
                <div class="text-center mt-4">
                  <ion-button fill="clear" (click)="viewAllProposals()">
                    Ver todas las propuestas
                  </ion-button>
                </div>
              } @else {
                <div class="text-center py-8">
                  <ion-icon name="document-text-outline" class="text-6xl text-gray-300 mb-4"></ion-icon>
                  <h3 class="text-lg font-semibold text-gray-600 mb-2">No has enviado propuestas aún</h3>
                  <p class="text-gray-500 mb-4">Busca proyectos interesantes y envía tu primera propuesta</p>
                  <ion-button (click)="browseProjects()">
                    <ion-icon name="search-outline" slot="start"></ion-icon>
                    Buscar Proyectos
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

    .proposal-item {
      --background: white;
      --border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .proposal-item:hover {
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

    .badge-submitted {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .badge-shortlisted {
      background-color: #fef3c7;
      color: #d97706;
    }

    .badge-accepted {
      background-color: #dcfce7;
      color: #166534;
    }

    .badge-rejected {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .badge-withdrawn {
      background-color: #f3f4f6;
      color: #374151;
    }

    .space-y-2 > * + * {
      margin-top: 0.5rem;
    }
  `]
})
export class FreelancerDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private proposalService = inject(ProposalService);
  private router = inject(Router);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoadingSubject.asObservable();

  stats = {
    totalProposals: 0,
    activeProjects: 0,
    completedProjects: 0,
    successRate: 0
  };

  recentProposals: Proposal[] = [];

  constructor() {
    addIcons({
      briefcaseOutline,
      documentTextOutline,
      starOutline,
      trendingUpOutline,
      searchOutline,
      eyeOutline,
      chatbubbleOutline,
      personOutline
    });
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      const currentUser = this.authService.currentUser;
      if (!currentUser) return;

      // Load user's proposals
      const proposalsResponse = await this.proposalService.getProposalsByFreelancer(currentUser.uid);
      if (proposalsResponse.success && proposalsResponse.data) {
        const proposals = proposalsResponse.data;

        // Calculate stats
        const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
        this.stats = {
          totalProposals: proposals.length,
          activeProjects: proposals.filter(p => p.status === 'accepted').length,
          completedProjects: 0, // This would need to come from project status
          successRate: proposals.length > 0 ? Math.round((acceptedProposals / proposals.length) * 100) : 0
        };

        // Get recent proposals (last 5)
        this.recentProposals = proposals.slice(0, 5);
      }

      // Get proposal statistics
      const statsResponse = await this.proposalService.getFreelancerProposalStats(currentUser.uid);
      if (statsResponse.success && statsResponse.data) {
        this.stats.successRate = statsResponse.data.successRate;
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  browseProjects(): void {
    this.router.navigate(['/projects']);
  }

  viewMyProposals(): void {
    this.router.navigate(['/proposals']);
  }

  viewMessages(): void {
    this.router.navigate(['/messages']);
  }

  editProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  viewProposal(proposalId: string): void {
    this.router.navigate(['/proposals', proposalId]);
  }

  viewAllProposals(): void {
    this.router.navigate(['/proposals']);
  }

  getProposalBadgeClass(status: string): string {
    switch (status) {
      case 'submitted': return 'badge-submitted';
      case 'shortlisted': return 'badge-shortlisted';
      case 'accepted': return 'badge-accepted';
      case 'rejected': return 'badge-rejected';
      case 'withdrawn': return 'badge-withdrawn';
      default: return 'badge-submitted';
    }
  }

  getProposalStatusText(status: string): string {
    switch (status) {
      case 'submitted': return 'Enviada';
      case 'shortlisted': return 'Preseleccionada';
      case 'accepted': return 'Aceptada';
      case 'rejected': return 'Rechazada';
      case 'withdrawn': return 'Retirada';
      default: return 'Enviada';
    }
  }
}