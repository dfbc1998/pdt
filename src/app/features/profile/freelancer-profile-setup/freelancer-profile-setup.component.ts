// src/app/features/profile/freelancer-profile-setup/freelancer-profile-setup.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-freelancer-profile-setup',
  standalone: true,
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, HeaderComponent],
  template: `
    <app-header title="Configurar Perfil"></app-header>
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Configurar Perfil de Freelancer</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Formulario de configuración inicial para freelancers - En desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class FreelancerProfileSetupComponent { }

