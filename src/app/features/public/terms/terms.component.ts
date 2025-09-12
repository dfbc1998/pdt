// src/app/features/public/terms/terms.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent],
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Términos y Condiciones</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Términos y condiciones de uso - En desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class TermsComponent { }

