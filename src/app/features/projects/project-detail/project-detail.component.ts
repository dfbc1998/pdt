// src/app/features/projects/project-detail/project-detail.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonChip,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonAvatar,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonToast,
  IonActionSheet,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonText,
  IonNote,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  createOutline,
  shareOutline,
  trashOutline,
  eyeOutline,
  timeOutline,
  walletOutline,
  peopleOutline,
  locationOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  starOutline,
  chatbubbleOutline,
  documentTextOutline,
  flagOutline,
  addOutline,
  refreshOutline,
  ellipsisHorizontalOutline,
  calendarOutline,
  linkOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ProjectService } from '../../../core/services/project.service';
import { ProposalService } from '../../../core/services/proposal.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Project,
  Proposal,
  ProjectStatus,
  ProposalStatus,
  BudgetType,
  TimelineType,
  ApiResponse,
  User
} from '../../../core/interfaces';
import { Subject, takeUntil, forkJoin } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonChip,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonAvatar,
    IonProgressBar,
    IonSegment,
    IonSegmentButton,
    IonAlert,
    IonToast,
    IonActionSheet,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonText,
    IonNote,
    IonRefresher,
    IonRefresherContent,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private proposalService = inject(ProposalService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Expose enums to template
  ProjectStatus = ProjectStatus;

  // Data
  project: Project | null = null;
  proposals: Proposal[] = [];
  currentUser: User | null = null;

  // State
  isLoading = true;
  isLoadingProposals = false;
  currentSegment = 'overview';

  // Alerts and Actions
  showDeleteAlert = false;
  showStatusChangeAlert = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  showActionSheet = false;

  // UI State
  selectedProposals: string[] = [];

  // Action sheet buttons
  actionSheetButtons = [
    {
      text: 'Editar Proyecto',
      icon: 'create-outline',
      handler: () => this.editProject()
    },
    {
      text: 'Compartir Proyecto',
      icon: 'share-outline',
      handler: () => this.shareProject()
    },
    {
      text: 'Cambiar Estado',
      icon: 'flag-outline',
      handler: () => this.showStatusChangeAlert = true
    },
    {
      text: 'Eliminar Proyecto',
      icon: 'trash-outline',
      role: 'destructive',
      handler: () => this.showDeleteAlert = true
    },
    {
      text: 'Cancelar',
      role: 'cancel'
    }
  ];

  constructor() {
    addIcons({
      arrowBackOutline,
      createOutline,
      shareOutline,
      trashOutline,
      eyeOutline,
      timeOutline,
      walletOutline,
      peopleOutline,
      locationOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      starOutline,
      chatbubbleOutline,
      documentTextOutline,
      flagOutline,
      addOutline,
      refreshOutline,
      ellipsisHorizontalOutline,
      calendarOutline,
      linkOutline
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.loadProjectData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadProjectData(): Promise<void> {
    try {
      const projectId = this.route.snapshot.params['id'];
      if (!projectId) {
        this.router.navigate(['/projects']);
        return;
      }

      this.isLoading = true;

      // Load project and proposals in parallel
      const [projectResponse, proposalsResponse] = await Promise.all([
        this.projectService.getProjectById(projectId),
        this.loadProposals(projectId)
      ]);

      if (projectResponse.success && projectResponse.data) {
        this.project = projectResponse.data;

        // Check if user has permission to view this project
        if (!this.canViewProject()) {
          this.router.navigate(['/projects']);
          return;
        }
      } else {
        this.toastMessage = 'Proyecto no encontrado';
        this.showErrorToast = true;
        this.router.navigate(['/projects']);
        return;
      }

    } catch (error) {
      console.error('Error loading project:', error);
      this.toastMessage = 'Error al cargar el proyecto';
      this.showErrorToast = true;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadProposals(projectId: string): Promise<void> {
    try {
      this.isLoadingProposals = true;
      // Note: This method would need to be implemented in ProposalService
      // const response = await this.proposalService.getProposalsByProject(projectId);
      // if (response.success && response.data) {
      //   this.proposals = response.data;
      // }

      // For now, we'll simulate loading proposals
      this.proposals = [];
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      this.isLoadingProposals = false;
    }
  }

  // Permission checks
  private canViewProject(): boolean {
    if (!this.project || !this.currentUser) return false;

    // Project owner can view
    if (this.project.clientId === this.currentUser.uid) return true;

    // Assigned freelancer can view
    if (this.project.assignedFreelancerId === this.currentUser.uid) return true;

    // Admin can view
    if (this.currentUser.role === 'admin') return true;

    // Public projects can be viewed by freelancers
    if (this.project.visibility === 'public' && this.currentUser.role === 'freelancer') return true;

    return false;
  }

  canEditProject(): boolean {
    if (!this.project || !this.currentUser) return false;
    return this.project.clientId === this.currentUser.uid;
  }

  canDeleteProject(): boolean {
    if (!this.project || !this.currentUser) return false;
    return this.project.clientId === this.currentUser.uid || this.currentUser.role === 'admin';
  }

  // Actions
  async refreshData(event?: any): Promise<void> {
    await this.loadProjectData();
    if (event) {
      event.target.complete();
    }
  }

  editProject(): void {
    if (this.project) {
      this.router.navigate(['/projects', this.project.id, 'edit']);
    }
  }

  shareProject(): void {
    if (this.project) {
      const url = `${window.location.origin}/projects/${this.project.id}`;
      if (navigator.share) {
        navigator.share({
          title: this.project.title,
          text: this.project.description,
          url: url
        });
      } else {
        navigator.clipboard.writeText(url).then(() => {
          this.toastMessage = 'Enlace copiado al portapapeles';
          this.showSuccessToast = true;
        });
      }
    }
  }

  async deleteProject(): Promise<void> {
    if (!this.project) return;

    try {
      const response = await this.projectService.deleteProject(this.project.id);
      if (response.success) {
        this.toastMessage = 'Proyecto eliminado exitosamente';
        this.showSuccessToast = true;
        setTimeout(() => {
          this.router.navigate(['/projects']);
        }, 1500);
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      this.toastMessage = error.message || 'Error al eliminar el proyecto';
      this.showErrorToast = true;
    }
  }

  async changeProjectStatus(status: ProjectStatus): Promise<void> {
    if (!this.project) return;

    try {
      const response = await this.projectService.updateProjectStatus(this.project.id, status);
      if (response.success) {
        this.project.status = status;
        this.toastMessage = 'Estado actualizado exitosamente';
        this.showSuccessToast = true;
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      this.toastMessage = error.message || 'Error al cambiar el estado';
      this.showErrorToast = true;
    }
  }

  // Proposal actions
  async acceptProposal(proposalId: string): Promise<void> {
    try {
      // Implementation would go here
      this.toastMessage = 'Propuesta aceptada';
      this.showSuccessToast = true;
    } catch (error: any) {
      this.toastMessage = 'Error al aceptar la propuesta';
      this.showErrorToast = true;
    }
  }

  async rejectProposal(proposalId: string): Promise<void> {
    try {
      // Implementation would go here
      this.toastMessage = 'Propuesta rechazada';
      this.showSuccessToast = true;
    } catch (error: any) {
      this.toastMessage = 'Error al rechazar la propuesta';
      this.showErrorToast = true;
    }
  }

  async shortlistProposal(proposalId: string): Promise<void> {
    try {
      // Implementation would go here
      this.toastMessage = 'Propuesta agregada a lista corta';
      this.showSuccessToast = true;
    } catch (error: any) {
      this.toastMessage = 'Error al agregar a lista corta';
      this.showErrorToast = true;
    }
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/projects']);
  }

  viewProposal(proposalId: string): void {
    this.router.navigate(['/proposals', proposalId]);
  }

  chatWithFreelancer(freelancerId: string): void {
    this.router.navigate(['/messages', this.project?.id]);
  }

  // UI Helpers
  onSegmentChange(event: any): void {
    this.currentSegment = event.detail.value;
  }

  toggleProposalSelection(proposalId: string): void {
    const index = this.selectedProposals.indexOf(proposalId);
    if (index > -1) {
      this.selectedProposals.splice(index, 1);
    } else {
      this.selectedProposals.push(proposalId);
    }
  }

  // Utility methods
  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'medium';
      case 'published': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'paused': return 'medium';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'published': return 'Publicado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'paused': return 'Pausado';
      default: return status;
    }
  }

  getProposalStatusColor(status: string): string {
    switch (status) {
      case 'submitted': return 'primary';
      case 'shortlisted': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'withdrawn': return 'medium';
      default: return 'medium';
    }
  }

  getProposalStatusText(status: string): string {
    switch (status) {
      case 'submitted': return 'Enviada';
      case 'shortlisted': return 'En Lista Corta';
      case 'accepted': return 'Aceptada';
      case 'rejected': return 'Rechazada';
      case 'withdrawn': return 'Retirada';
      default: return status;
    }
  }

  formatBudget(): string {
    if (!this.project?.budget) return 'No especificado';

    const { type, amount, minAmount, maxAmount, currency } = this.project.budget;

    switch (type) {
      case BudgetType.FIXED:
        return `$${amount} ${currency} (Fijo)`;
      case BudgetType.HOURLY:
        return `$${amount}/${currency} por hora`;
      case BudgetType.RANGE:
        return `$${minAmount} - $${maxAmount} ${currency}`;
      default:
        return 'No especificado';
    }
  }

  formatTimeline(): string {
    if (!this.project?.timeline) return 'No especificado';

    const { duration, type, isFlexible } = this.project.timeline;
    const flexible = isFlexible ? ' (Flexible)' : '';

    if (!duration) return `${type}${flexible}`;

    switch (type) {
      case TimelineType.DAYS:
        return `${duration} día${duration > 1 ? 's' : ''}${flexible}`;
      case TimelineType.WEEKS:
        return `${duration} semana${duration > 1 ? 's' : ''}${flexible}`;
      case TimelineType.MONTHS:
        return `${duration} mes${duration > 1 ? 'es' : ''}${flexible}`;
      default:
        return `${duration} ${type}${flexible}`;
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 2592000) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;

    return this.formatDate(date);
  }
}