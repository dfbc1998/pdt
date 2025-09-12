// src/app/shared/components/header/header.component.ts
import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  settingsOutline,
  logOutOutline,
  notificationsOutline,
  menuOutline
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
    IonMenuButton
  ],
  template: `
    <ion-header class="bg-white shadow-sm">
      <ion-toolbar class="px-4">
        @if (showMenuButton) {
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
          <ion-button fill="clear" (click)="goToNotifications()">
            <ion-icon name="notifications-outline" size="large"></ion-icon>
          </ion-button>

          <!-- User Menu -->
          @if (currentUser$ | async; as user) {
            <ion-button id="user-popover" fill="clear" class="flex items-center space-x-2">
              <ion-avatar class="w-8 h-8">
                @if (user.photoURL) {
                  <img [src]="user.photoURL" [alt]="user.displayName">
                } @else {
                  <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                    {{ getInitials(user.displayName || user.email) }}
                  </div>
                }
              </ion-avatar>
              <span class="hidden md:block text-sm font-medium">{{ user.displayName || user.email }}</span>
            </ion-button>

            <ion-popover trigger="user-popover" [dismissOnSelect]="true">
              <ng-template>
                <ion-list>
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
  `]
})
export class HeaderComponent {
  @Input() title = 'FreelancePro';
  @Input() showMenuButton = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$: Observable<User | null> = this.authService.currentUser$;

  constructor() {
    addIcons({
      personOutline,
      settingsOutline,
      logOutOutline,
      notificationsOutline,
      menuOutline
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

