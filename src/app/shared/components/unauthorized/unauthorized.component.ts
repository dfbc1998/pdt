// src/app/shared/components/unauthorized/unauthorized.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon],
  template: `
    <ion-content class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <ion-icon name="lock-closed-outline" class="text-6xl text-gray-400 mb-4"></ion-icon>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Acceso denegado</h1>
        <p class="text-gray-600 mb-8">No tienes permisos para acceder a esta página.</p>
        <ion-button (click)="goBack()" fill="solid">
          <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
          Volver
        </ion-button>
      </div>
    </ion-content>
  `
})
export class UnauthorizedComponent {
  constructor(private router: Router) {
    addIcons({ lockClosedOutline, arrowBackOutline });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}