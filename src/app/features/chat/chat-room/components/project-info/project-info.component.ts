// src/app/features/chat/chat-room/components/project-info/project-info.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { briefcaseOutline, openOutline } from 'ionicons/icons';

import { Project, ProjectStatus } from '../../../../../core/interfaces';

@Component({
  selector: 'app-project-info',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon
  ],
  template: `
    <div class="project-info-header" *ngIf="project">
      <div class="project-card">
        <div class="project-icon">
          <ion-icon name="briefcase-outline"></ion-icon>
        </div>
        <div class="project-details">
          <h3>{{ project.title }}</h3>
          <p class="project-meta">
            <span class="status-badge" [ngClass]="getProjectStatusClass()">
              {{ getProjectStatusLabel() }}
            </span>
            <span class="separator">•</span>
            <span class="participant-role">
              Chat con {{ participantName }}
            </span>
          </p>
        </div>
        <div class="project-actions">
          <ion-button 
            fill="clear" 
            size="small" 
            (click)="onProjectClick.emit()">
            <ion-icon name="open-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./project-info.component.scss']
})
export class ProjectInfoComponent {
  @Input() project: Project | null = null;
  @Input() participantName: string = '';
  @Output() onProjectClick = new EventEmitter<void>();

  constructor() {
    addIcons({
      briefcaseOutline,
      openOutline
    });
  }

  getProjectStatusClass(): string {
    if (!this.project) return 'pending';

    switch (this.project.status) {
      case ProjectStatus.IN_PROGRESS:
        return 'active';
      case ProjectStatus.COMPLETED:
        return 'completed';
      default:
        return 'pending';
    }
  }

  getProjectStatusLabel(): string {
    if (!this.project) return 'Desconocido';

    const statusLabels: { [key in ProjectStatus]: string } = {
      [ProjectStatus.DRAFT]: 'Borrador',
      [ProjectStatus.PUBLISHED]: 'Publicado',
      [ProjectStatus.IN_PROGRESS]: 'En Progreso',
      [ProjectStatus.UNDER_REVIEW]: 'En Revisión',
      [ProjectStatus.COMPLETED]: 'Completado',
      [ProjectStatus.CANCELLED]: 'Cancelado',
      [ProjectStatus.PAUSED]: 'Pausado'
    };

    return statusLabels[this.project.status];
  }
}