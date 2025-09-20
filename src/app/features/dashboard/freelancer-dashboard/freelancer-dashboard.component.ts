import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Ionic Components
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  ToastController, IonAvatar
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  briefcaseOutline,
  documentTextOutline,
  starOutline,
  trendingUpOutline,
  searchOutline,
  eyeOutline,
  chatbubbleOutline,
  personOutline,
  cashOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  sendOutline,
  addOutline,
  refreshOutline,
  statsChartOutline,
  calendarOutline,
  folderOutline,
  heartOutline,
  layersOutline
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { ProposalService } from '../../../core/services/proposal.service';
import { ProjectService } from '../../../core/services/project.service';
import {
  User,
  Proposal,
  Project,
  ProposalStatus,
  ProjectStatus,
  DashboardStats,
  ProposalWithProject,
  ApiResponse
} from '../../../core/interfaces';



@Component({
  selector: 'app-freelancer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonBadge,
    IonChip,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    HeaderComponent
  ],
  templateUrl: './freelancer-dashboard.component.html',
  styleUrls: ['./freelancer-dashboard.component.scss']
})
export class FreelancerDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private proposalService = inject(ProposalService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  // Observable states
  currentUser$: Observable<User | null> = this.authService.currentUser$;
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoadingSubject.asObservable();

  // Component data
  currentUser: User | null = null;
  stats: DashboardStats = {
    totalProposals: 0,
    acceptedProposals: 0,
    pendingProposals: 0,
    rejectedProposals: 0,
    activeProjects: 0,
    completedProjects: 0,
    successRate: 0,
    avgResponseTime: 2.5
  };

  recentProposals: ProposalWithProject[] = [];
  availableProjects: Project[] = [];
  tips: string[] = [
    'Las propuestas personalizadas tienen 5x más probabilidad de éxito.',
    'Mantén tu perfil actualizado con proyectos recientes.',
    'Responde a mensajes en menos de 2 horas para mejores oportunidades.',
    'Especialízate en 2-3 áreas para destacar como experto.'
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
      briefcaseOutline,
      documentTextOutline,
      starOutline,
      trendingUpOutline,
      searchOutline,
      eyeOutline,
      chatbubbleOutline,
      personOutline,
      cashOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      sendOutline,
      addOutline,
      refreshOutline,
      statsChartOutline,
      calendarOutline,
      folderOutline,
      heartOutline,
      layersOutline
    });
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
    if (!this.currentUser) return;

    try {
      this.isLoadingSubject.next(true);
      console.log('🔄 Loading freelancer dashboard data...');

      // Load proposals and projects in parallel
      await Promise.all([
        this.loadProposals(),
        this.loadAvailableProjects()
      ]);

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      await this.showToast('Error al cargar datos del dashboard', 'danger');
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  private async loadProposals(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const response: ApiResponse<Proposal[]> = await this.proposalService.getProposalsByFreelancer(this.currentUser.uid);

      if (response.success && response.data) {
        const proposals = response.data;
        console.log('✅ Proposals loaded:', proposals.length);

        // Load project details for recent proposals
        const recentProposalsWithProjects = await Promise.all(
          proposals.slice(0, 5).map(async (proposal) => {
            try {
              const projectResponse = await this.projectService.getProjectById(proposal.projectId);
              return {
                ...proposal,
                project: projectResponse.success ? projectResponse.data : undefined
              } as ProposalWithProject;
            } catch (error) {
              console.warn('Failed to load project for proposal:', proposal.id);
              return proposal as ProposalWithProject;
            }
          })
        );

        this.recentProposals = recentProposalsWithProjects;
        this.calculateStats(proposals);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    }
  }

  private async loadAvailableProjects(): Promise<void> {
    try {
      // Use temporary method if main method fails due to index
      let response: ApiResponse<Project[]>;

      try {
        response = await this.projectService.getPublishedProjects();
      } catch (indexError) {
        console.log('Index required, using temporary method');
        // Fallback to temporary method if it exists
        const tempMethod = (this.projectService as any).getPublishedProjectsTemp;
        if (tempMethod) {
          response = await tempMethod.call(this.projectService);
        } else {
          // If no temporary method, create empty response
          response = { success: true, data: [] };
        }
      }

      if (response.success && response.data) {
        // Show only first 3 projects as recommendations
        this.availableProjects = response.data.slice(0, 3);
        console.log('✅ Available projects loaded:', this.availableProjects.length);
      }
    } catch (error) {
      console.error('Error loading available projects:', error);
      this.availableProjects = [];
    }
  }

  private calculateStats(proposals: Proposal[]): void {
    const total = proposals.length;
    const accepted = proposals.filter(p => p.status === ProposalStatus.ACCEPTED).length;
    const pending = proposals.filter(p => p.status === ProposalStatus.SUBMITTED).length;
    const rejected = proposals.filter(p => p.status === ProposalStatus.REJECTED).length;

    this.stats = {
      totalProposals: total,
      acceptedProposals: accepted,
      pendingProposals: pending,
      rejectedProposals: rejected,
      activeProjects: accepted, // Simplified: accepted proposals = active projects
      completedProjects: 0, // Would need project status to calculate
      successRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      avgResponseTime: 2.5 // Static for now
    };

    console.log('📊 Stats calculated:', this.stats);
  }

  private setDailyTip(): void {
    const randomIndex = Math.floor(Math.random() * this.tips.length);
    this.dailyTip = this.tips[randomIndex];
  }

  // Event handlers
  async onRefresh(event: any): Promise<void> {
    await this.loadDashboardData();
    event.target.complete();
  }

  // Navigation methods
  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  navigateToMyProposals(): void {
    this.router.navigate(['/proposals']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  navigateToMessages(): void {
    this.router.navigate(['/messages']);
  }

  viewProposal(proposalId: string): void {
    this.router.navigate(['/proposals', proposalId]);
  }

  viewProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  createProposal(projectId: string): void {
    this.router.navigate(['/proposals/create', projectId]);
  }

  // Helper methods
  getProposalStatusColor(status: ProposalStatus): string {
    const colors: { [key in ProposalStatus]: string } = {
      [ProposalStatus.SUBMITTED]: 'primary',
      [ProposalStatus.SHORTLISTED]: 'warning',
      [ProposalStatus.ACCEPTED]: 'success',
      [ProposalStatus.REJECTED]: 'danger',
      [ProposalStatus.WITHDRAWN]: 'medium'
    };
    return colors[status] || 'medium';
  }

  getProposalStatusLabel(status: ProposalStatus): string {
    const labels: { [key in ProposalStatus]: string } = {
      [ProposalStatus.SUBMITTED]: 'Enviada',
      [ProposalStatus.SHORTLISTED]: 'Preseleccionada',
      [ProposalStatus.ACCEPTED]: 'Aceptada',
      [ProposalStatus.REJECTED]: 'Rechazada',
      [ProposalStatus.WITHDRAWN]: 'Retirada'
    };
    return labels[status] || status;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      return diffInHours === 0 ? 'Hace unos minutos' : `Hace ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else {
      return date.toLocaleDateString('es-ES');
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}