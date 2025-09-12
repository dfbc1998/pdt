// src/app/features/settings/notification-settings/notification-settings.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, HeaderComponent],
  template: `
    <app-header title="Notificaciones"></app-header>
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Configuración de Notificaciones</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Preferencias de notificaciones - En desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class NotificationSettingsComponent { }

