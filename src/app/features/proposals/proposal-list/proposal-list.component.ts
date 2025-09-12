// src/app/features/proposals/proposal-list/proposal-list.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-proposal-list',
  standalone: true,
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, HeaderComponent],
  template: `
    <app-header title="Propuestas"></app-header>
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Lista de Propuestas</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Propuestas recibidas para el proyecto - En desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class ProposalListComponent { }

