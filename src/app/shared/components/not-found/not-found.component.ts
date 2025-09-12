// src/app/shared/components/not-found/not-found.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon],
  template: `
    <ion-content class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">Página no encontrada</h2>
        <p class="text-gray-600 mb-8">La página que buscas no existe o ha sido movida.</p>
        <ion-button (click)="goHome()" fill="solid">
          <ion-icon name="home-outline" slot="start"></ion-icon>
          Ir al inicio
        </ion-button>
      </div>
    </ion-content>
  `
})
export class NotFoundComponent {
  constructor(private router: Router) {
    addIcons({ homeOutline });
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }
}

