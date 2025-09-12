// src/app/features/settings/settings-main/settings-main.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-settings-main',
  standalone: true,
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, HeaderComponent],
  template: `
    <app-header title="Configuración"></app-header>
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Configuración</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Panel de configuración principal - En desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class SettingsMainComponent { }

