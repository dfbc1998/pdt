// src/app/features/proposals/my-proposals/my-proposals.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-my-proposals',
  standalone: true,
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, HeaderComponent],
  template: `
    <app-header title="Mis Propuestas"></app-header>
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Mis Propuestas</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Propuestas que he enviado - En desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class MyProposalsComponent { }

