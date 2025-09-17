import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
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
  IonChip,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonText,
  IonNote,
  IonSpinner,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  eyeOutline,
  createOutline,
  trashOutline,
  timeOutline,
  cashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  starOutline,
  refreshOutline,
  addOutline,
  searchOutline,
  briefcaseOutline,
  trendingUpOutline,
  chatbubbleOutline,
  calendarOutline,
  informationCircleOutline, checkmarkOutline
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { ProposalService } from '../../../core/services/proposal.service';
import { ProjectService } from '../../../core/services/project.service';
import {
  User,
  Proposal,
  Project,
  ProposalStatus,
  ApiResponse
} from '../../../core/interfaces';

interface ProposalWithProject extends Proposal {
  project?: Project;
}

@Component({
  selector: 'app-my-proposals',
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
    IonChip,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonText,
    IonNote,
    IonSpinner,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './my-proposals.component.html',
  styleUrls: ['./my-proposals.component.scss']
})
export class MyProposalsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private proposalService = inject(ProposalService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  // Component State
  currentUser: User | null = null;
  proposals: ProposalWithProject[] = [];
  filteredProposals: ProposalWithProject[] = [];
  isLoading = true;
  isRefreshing = false;
  selectedFilter: string = 'all';
  searchTerm = '';

  // Statistics
  stats = {
    total: 0,
    submitted: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    successRate: 0
  };

  constructor() {
    addIcons({ documentTextOutline, checkmarkCircleOutline, starOutline, trendingUpOutline, searchOutline, calendarOutline, cashOutline, timeOutline, checkmarkOutline, chatbubbleOutline, eyeOutline, createOutline, trashOutline, briefcaseOutline, closeCircleOutline, refreshOutline, addOutline, informationCircleOutline });
  }

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadProposals();
        } else {
          this.router.navigate(['/auth/login']);
        }
      });
  }

  private async loadProposals(): Promise<void> {
    if (!this.currentUser) return;

    try {
      this.isLoading = true;
      console.log('📋 [MyProposals] Loading proposals for freelancer:', this.currentUser.uid);

      const response: ApiResponse<Proposal[]> = await this.proposalService.getProposalsByFreelancer(this.currentUser.uid);

      if (response.success && response.data) {
        console.log('✅ [MyProposals] Proposals loaded:', response.data.length);

        // Load project details for each proposal
        const proposalsWithProjects = await Promise.all(
          response.data.map(async (proposal) => {
            try {
              const projectResponse = await this.projectService.getProjectById(proposal.projectId);
              return {
                ...proposal,
                project: projectResponse.success ? projectResponse.data : undefined
              } as ProposalWithProject;
            } catch (error) {
              console.error('Error loading project for proposal:', proposal.id, error);
              return {
                ...proposal,
                project: undefined
              } as ProposalWithProject;
            }
          })
        );

        this.proposals = proposalsWithProjects.sort((a, b) =>
          b.submittedAt.getTime() - a.submittedAt.getTime()
        );

        this.calculateStats();
        this.applyFilters();
      } else {
        console.error('❌ [MyProposals] Error loading proposals:', response.error);
        await this.showToast('Error al cargar las propuestas', 'danger');
      }
    } catch (error) {
      console.error('💥 [MyProposals] Unexpected error loading proposals:', error);
      await this.showToast('Error inesperado al cargar las propuestas', 'danger');
    } finally {
      this.isLoading = false;
      this.isRefreshing = false;
    }
  }

  private calculateStats(): void {
    this.stats = {
      total: this.proposals.length,
      submitted: this.getProposalsByStatus(ProposalStatus.SUBMITTED).length,
      shortlisted: this.getProposalsByStatus(ProposalStatus.SHORTLISTED).length,
      accepted: this.getProposalsByStatus(ProposalStatus.ACCEPTED).length,
      rejected: this.getProposalsByStatus(ProposalStatus.REJECTED).length,
      withdrawn: this.getProposalsByStatus(ProposalStatus.WITHDRAWN).length,
      successRate: this.proposals.length > 0 ?
        Math.round((this.getProposalsByStatus(ProposalStatus.ACCEPTED).length / this.proposals.length) * 100) : 0
    };
  }

  private getProposalsByStatus(status: ProposalStatus): ProposalWithProject[] {
    return this.proposals.filter(proposal => proposal.status === status);
  }

  // Filter and Search Methods
  onSegmentChange(event: any): void {
    this.selectedFilter = event.detail.value;
    this.applyFilters();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value.toLowerCase();
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.proposals];

    // Apply status filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === this.selectedFilter);
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(proposal =>
        proposal.project?.title.toLowerCase().includes(this.searchTerm) ||
        proposal.coverLetter.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredProposals = filtered;
  }

  // Navigation Methods
  browseProjects(): void {
    this.router.navigate(['/projects']);
  }

  viewProposal(proposalId: string): void {
    this.router.navigate(['/proposals', proposalId]);
  }

  editProposal(proposalId: string): void {
    // Only allow editing if status is SUBMITTED
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (proposal && proposal.status === ProposalStatus.SUBMITTED) {
      this.router.navigate(['/proposals', proposalId, 'edit']);
    } else {
      this.showToast('Solo puedes editar propuestas que aún no han sido respondidas', 'warning');
    }
  }

  goToProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  // Proposal Actions
  async withdrawProposal(proposal: ProposalWithProject): Promise<void> {
    if (proposal.status !== ProposalStatus.SUBMITTED && proposal.status !== ProposalStatus.SHORTLISTED) {
      await this.showToast('Solo puedes retirar propuestas pendientes o preseleccionadas', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Retirar Propuesta',
      message: `¿Estás seguro de que quieres retirar tu propuesta para "${proposal.project?.title}"? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Retirar',
          role: 'confirm',
          handler: () => {
            this.executeWithdraw(proposal.id);
          }
        }
      ]
    });

    await alert.present();
  }

  private async executeWithdraw(proposalId: string): Promise<void> {
    try {
      const response = await this.proposalService.updateProposalStatus(
        proposalId,
        ProposalStatus.WITHDRAWN
      );

      if (response.success) {
        await this.showToast('Propuesta retirada exitosamente', 'success');
        await this.loadProposals();
      } else {
        await this.showToast(response.error || 'Error al retirar la propuesta', 'danger');
      }
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      await this.showToast('Error inesperado al retirar la propuesta', 'danger');
    }
  }

  // Refresh
  async handleRefresh(event: any): Promise<void> {
    this.isRefreshing = true;
    await this.loadProposals();
    event.target.complete();
  }

  // Utility Methods
  getStatusLabel(status: string): string {
    switch (status) {
      case ProposalStatus.SUBMITTED: return 'Pendiente';
      case ProposalStatus.SHORTLISTED: return 'Pre-seleccionada';
      case ProposalStatus.ACCEPTED: return 'Seleccionada';
      case ProposalStatus.REJECTED: return 'Rechazada';
      case ProposalStatus.WITHDRAWN: return 'Retirada';
      default: return 'Desconocido';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case ProposalStatus.SUBMITTED: return 'status-submitted';
      case ProposalStatus.SHORTLISTED: return 'status-shortlisted';
      case ProposalStatus.ACCEPTED: return 'status-accepted';
      case ProposalStatus.REJECTED: return 'status-rejected';
      case ProposalStatus.WITHDRAWN: return 'status-withdrawn';
      default: return 'status-submitted';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case ProposalStatus.SUBMITTED: return 'time';
      case ProposalStatus.SHORTLISTED: return 'star';
      case ProposalStatus.ACCEPTED: return 'checkmark-circle';
      case ProposalStatus.REJECTED: return 'close-circle';
      case ProposalStatus.WITHDRAWN: return 'remove-circle';
      default: return 'document-text';
    }
  }

  getFilterCount(status: string): number {
    if (status === 'all') return this.proposals.length;
    return this.getProposalsByStatus(status as ProposalStatus).length;
  }

  canWithdraw(proposal: ProposalWithProject): boolean {
    return proposal.status === ProposalStatus.SUBMITTED || proposal.status === ProposalStatus.SHORTLISTED;
  }

  canEdit(proposal: ProposalWithProject): boolean {
    return proposal.status === ProposalStatus.SUBMITTED;
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `hace ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `hace ${days}d`;
    }
  }

  // Toast Methods
  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }
}