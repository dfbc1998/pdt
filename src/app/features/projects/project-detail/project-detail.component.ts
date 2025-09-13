// src/app/features/projects/project-detail/project-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButton,
  IonIcon,
  IonChip,
  IonBadge,
  IonAlert,
  IonList,
  IonItem,
  IonItemDivider,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonProgressBar,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import {
  trash,
  calendar,
  cash,
  person,
  document,
  checkmarkCircle,
  timeOutline,
  locationOutline,
  businessOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { Project, ProjectStatus, Milestone, MilestoneStatus } from '../../../core/interfaces';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButton,
    IonIcon,
    IonChip,
    IonBadge,
    IonAlert,
    IonList,
    IonItem,
    IonItemDivider,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonSpinner,
    IonProgressBar,
    HeaderComponent
  ],
  templateUrl: './project-detail.component.html'
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  // Expose enums to template
  ProjectStatus = ProjectStatus;

  project: Project | null = null;
  currentSegment: string = 'details';
  isLoading = true;
  isDeleting = false;
  isUpdatingStatus = false;

  // Alert configurations
  deleteAlertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel'
    },
    {
      text: 'Eliminar',
      role: 'destructive',
      handler: () => this.deleteProject()
    }
  ];

  statusChangeAlertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel'
    },
    {
      text: 'Confirmar',
      handler: () => this.confirmStatusChange()
    }
  ];

  constructor() {
    addIcons({
      trash,
      calendar,
      cash,
      person,
      document,
      checkmarkCircle,
      timeOutline,
      locationOutline,
      businessOutline
    });
  }

  ngOnInit() {
    this.loadProject();
  }

  async loadProject() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) {
      this.router.navigate(['/projects']);
      return;
    }

    this.isLoading = true;
    try {
      const response = await this.projectService.getProjectById(projectId);
      if (response.success && response.data) {
        this.project = response.data;
      } else {
        await this.showErrorToast('Proyecto no encontrado');
        this.router.navigate(['/projects']);
      }
    } catch (error) {
      await this.showErrorToast('Error al cargar el proyecto');
      this.router.navigate(['/projects']);
    } finally {
      this.isLoading = false;
    }
  }

  onSegmentChange(event: any) {
    this.currentSegment = event.detail.value;
  }

  get isProjectOwner(): boolean {
    return this.authService.currentUser?.uid === this.project?.clientId;
  }

  get canEditProject(): boolean {
    return this.isProjectOwner && this.project?.status === ProjectStatus.DRAFT;
  }

  editProject() {
    if (this.project) {
      this.router.navigate(['/projects', this.project.id, 'edit']);
    }
  }

  async confirmDeleteProject() {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.',
      buttons: this.deleteAlertButtons
    });
    await alert.present();
  }

  async deleteProject() {
    if (!this.project) return;

    this.isDeleting = true;
    try {
      const response = await this.projectService.deleteProject(this.project.id);
      if (response.success) {
        await this.showSuccessToast('Proyecto eliminado exitosamente');
        this.router.navigate(['/projects']);
      } else {
        await this.showErrorToast(response.error || 'Error al eliminar el proyecto');
      }
    } catch (error) {
      await this.showErrorToast('Error al eliminar el proyecto');
    } finally {
      this.isDeleting = false;
    }
  }

  async changeProjectStatus(status: ProjectStatus) {
    if (!this.project) return;

    const alert = await this.alertController.create({
      header: 'Cambiar estado',
      message: `¿Confirmas cambiar el estado del proyecto a "${this.getStatusLabel(status)}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => this.updateProjectStatus(status)
        }
      ]
    });
    await alert.present();
  }

  async updateProjectStatus(status: ProjectStatus) {
    if (!this.project) return;

    this.isUpdatingStatus = true;
    try {
      const response = await this.projectService.updateProjectStatus(this.project.id, status);
      if (response.success && response.data) {
        this.project = response.data;
        await this.showSuccessToast('Estado actualizado exitosamente');
      } else {
        await this.showErrorToast(response.error || 'Error al actualizar el estado');
      }
    } catch (error) {
      await this.showErrorToast('Error al actualizar el estado');
    } finally {
      this.isUpdatingStatus = false;
    }
  }

  confirmStatusChange() {
    // Esta función se puede usar si necesitas lógica adicional antes de cambiar el estado
  }

  getStatusLabel(status: ProjectStatus): string {
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

  getMilestoneStatusColor(status: MilestoneStatus): string {
    const colors: { [key in MilestoneStatus]: string } = {
      [MilestoneStatus.PENDING]: 'medium',
      [MilestoneStatus.IN_PROGRESS]: 'warning',
      [MilestoneStatus.UNDER_REVIEW]: 'tertiary',
      [MilestoneStatus.COMPLETED]: 'success',
      [MilestoneStatus.OVERDUE]: 'danger'
    };
    return colors[status] || 'medium';
  }

  getBudgetText(): string {
    if (!this.project?.budget) return '';

    const { budget } = this.project;
    switch (budget.type) {
      case 'fixed':
        return `$${budget.amount?.toLocaleString()} ${budget.currency}`;
      case 'hourly':
        return `$${budget.amount?.toLocaleString()}/hora ${budget.currency}`;
      case 'range':
        return `$${budget.minAmount?.toLocaleString()} - $${budget.maxAmount?.toLocaleString()} ${budget.currency}`;
      default:
        return 'Presupuesto no especificado';
    }
  }

  getTimelineText(): string {
    if (!this.project?.timeline) return '';

    const { timeline } = this.project;
    if (timeline.type === 'flexible') {
      return 'Flexible';
    }

    const unit = timeline.type === 'days' ? 'días' :
      timeline.type === 'weeks' ? 'semanas' : 'meses';
    return `${timeline.duration} ${unit}`;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'No especificada';
    return new Date(date).toLocaleDateString('es-CL');
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
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
}