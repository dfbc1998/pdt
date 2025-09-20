// src/app/shared/components/header/header.component.ts - REEMPLAZAR COMPLETO
import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonMenuButton,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  notificationsOutline,
  settingsOutline,
  helpCircleOutline,
  logOutOutline,
  chevronDownOutline,
  personCircleOutline,
  searchOutline,
  menuOutline
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
    IonMenuButton,
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonBadge
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Input properties - TODAS las propiedades que los componentes necesitan
  @Input() title = 'FreeWork';
  @Input() showBackButton = false;
  @Input() showMenu = true;
  @Input() showNotifications = true;
  @Input() showUserMenu = true;
  @Input() showSearchButton = false;
  @Input() transparent = false;
  @Input() customColor = '';

  // Output events - TODOS los eventos que los componentes necesitan
  @Output() onBackClick = new EventEmitter<void>();
  @Output() onNotificationClick = new EventEmitter<void>();
  @Output() onMenuClick = new EventEmitter<void>();
  @Output() onSearchClick = new EventEmitter<void>();
  @Output() backClick = new EventEmitter<void>(); // Alias para compatibilidad

  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private navController = inject(NavController);
  public router = inject(Router);

  currentUser: User | null = null;
  isUserMenuOpen = false;
  notificationCount = 0;

  constructor() {
    addIcons({
      arrowBackOutline,
      notificationsOutline,
      settingsOutline,
      helpCircleOutline,
      logOutOutline,
      chevronDownOutline,
      personCircleOutline,
      searchOutline,
      menuOutline
    });
  }

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  // Métodos de navegación y acciones
  onBack(): void {
    // Emitir ambos eventos para compatibilidad
    this.onBackClick.emit();
    this.backClick.emit();

    // Si nadie está escuchando los eventos, usar navegación por defecto
    if (this.onBackClick.observers.length === 0 && this.backClick.observers.length === 0) {
      this.navController.back();
    }
  }

  onNotification(): void {
    this.onNotificationClick.emit();
  }

  onMenu(): void {
    this.onMenuClick.emit();
  }

  onSearch(): void {
    this.onSearchClick.emit();
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