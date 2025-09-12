// src/app/features/public/contact/contact.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent],
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Contacto</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Información de contacto - En desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class ContactComponent { }

