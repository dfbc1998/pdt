// src/app/shared/components/header/header.component.ts
import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
  IonLabel,
  IonPopover,
  IonList,
  IonItem,
  IonMenuButton,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  settingsOutline,
  logOutOutline,
  notificationsOutline,
  menuOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonAvatar,
    IonLabel,
    IonPopover,
    IonList,
    IonItem,
    IonMenuButton,
    IonBackButton
  ],
  template: `
    <ion-header class="bg-white shadow-sm">
      <ion-toolbar class="px-4">
        <!-- Back Button -->
        @if (showBackButton) {
          <ion-buttons slot="start">
            <ion-button (click)="goBack()" fill="clear">
              <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        } @else if (showMenuButton) {
          <ion-buttons slot="start">
            <ion-menu-button>
              <ion-icon name="menu-outline"></ion-icon>
            </ion-menu-button>
          </ion-buttons>
        }
        
        <ion-title class="text-2xl font-bold text-gradient">
          {{ title }}
        </ion-title>

        <ion-buttons slot="end">
          <!-- Notifications -->
          <ion-button fill="clear" id="notifications-trigger">
            <ion-icon name="notifications-outline" slot="icon-only"></ion-icon>
          </ion-button>
          
          <!-- User Menu -->
          @if (currentUser$ | async; as user) {
            <ion-button fill="clear" id="user-menu-trigger" class="ml-2">
              @if (user.photoURL) {
                <ion-avatar slot="icon-only" class="w-8 h-8">
                  <img [src]="user.photoURL" [alt]="user.displayName || 'Usuario'">
                </ion-avatar>
              } @else {
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {{ getInitials(user.displayName || user.email || 'U') }}
                </div>
              }
            </ion-button>

            <ion-popover trigger="user-menu-trigger" triggerAction="click">
              <ng-template>
                <ion-list class="min-w-48">
                  <ion-item class="border-b border-gray-100 pb-2 mb-2">
                    <div>
                      <h3 class="font-semibold">{{ user.displayName || 'Usuario' }}</h3>
                      <p class="text-sm text-gray-500">{{ user.email }}</p>
                    </div>
                  </ion-item>
                  
                  <ion-item button (click)="goToProfile()">
                    <ion-icon name="person-outline" slot="start"></ion-icon>
                    <ion-label>Mi Perfil</ion-label>
                  </ion-item>
                  
                  <ion-item button (click)="goToSettings()">
                    <ion-icon name="settings-outline" slot="start"></ion-icon>
                    <ion-label>Configuración</ion-label>
                  </ion-item>
                  
                  <ion-item button (click)="logout()" color="danger">
                    <ion-icon name="log-out-outline" slot="start"></ion-icon>
                    <ion-label>Cerrar Sesión</ion-label>
                  </ion-item>
                </ion-list>
              </ng-template>
            </ion-popover>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    ion-toolbar {
      --background: white;
      --color: #1f2937;
    }
    
    .text-gradient {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    ion-button {
      --color: #374151;
    }
    
    ion-button:hover {
      --color: #3b82f6;
    }
  `]
})
export class HeaderComponent {
  @Input() title = 'FreelancePro';
  @Input() showMenuButton = false;
  @Input() showBackButton = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);

  currentUser$: Observable<User | null> = this.authService.currentUser$;

  constructor() {
    addIcons({
      personOutline,
      settingsOutline,
      logOutOutline,
      notificationsOutline,
      menuOutline,
      arrowBackOutline
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  goBack() {
    this.location.back();
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }

  async logout() {
    await this.authService.logout();
  }
}