// src/app/shared/components/header/header.component.ts
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  notificationsOutline,
  searchOutline,
  menuOutline,
  personOutline,
  settingsOutline,
  logOutOutline,
  helpCircleOutline,
  chevronDownOutline
} from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/interfaces';

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
    IonBadge,
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() showBackButton: boolean = false;
  @Input() showSearchButton: boolean = false;
  @Input() showNotifications: boolean = true;
  @Input() showUserMenu: boolean = true;
  @Input() transparent: boolean = false;
  @Input() customColor: string = '';

  @Output() onBackClick = new EventEmitter<void>();
  @Output() onSearchClick = new EventEmitter<void>();
  @Output() onNotificationClick = new EventEmitter<void>();
  @Output() onMenuClick = new EventEmitter<void>();

  private authService = inject(AuthService);
  private navController = inject(NavController);
  public router = inject(Router);

  currentUser: User | null = null;
  notificationCount = 3; // Mock notification count
  isUserMenuOpen = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      notificationsOutline,
      searchOutline,
      menuOutline,
      personOutline,
      settingsOutline,
      logOutOutline,
      helpCircleOutline,
      chevronDownOutline
    });

    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onBack(): void {
    if (this.onBackClick.observers.length > 0) {
      this.onBackClick.emit();
    } else {
      this.navController.back();
    }
  }

  onSearch(): void {
    this.onSearchClick.emit();
  }

  onNotifications(): void {
    this.onNotificationClick.emit();
  }

  onMenu(): void {
    this.onMenuClick.emit();
  }

  getUserInitials(): string {
    if (!this.currentUser?.displayName) return 'U';

    return this.currentUser.displayName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getUserName(): string {
    return this.currentUser?.displayName || 'Usuario';
  }

  getUserRole(): string {
    const roleLabels: { [key: string]: string } = {
      'client': 'Cliente',
      'freelancer': 'Freelancer',
      'admin': 'Administrador'
    };

    return roleLabels[this.currentUser?.role || ''] || 'Usuario';
  }

  async goToProfile(): Promise<void> {
    this.isUserMenuOpen = false;
    await this.router.navigate(['/profile']);
  }

  async goToSettings(): Promise<void> {
    this.isUserMenuOpen = false;
    await this.router.navigate(['/settings']);
  }

  async goToHelp(): Promise<void> {
    this.isUserMenuOpen = false;
    await this.router.navigate(['/help']);
  }

  async logout(): Promise<void> {
    this.isUserMenuOpen = false;

    try {
      await this.authService.logout();
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }
}