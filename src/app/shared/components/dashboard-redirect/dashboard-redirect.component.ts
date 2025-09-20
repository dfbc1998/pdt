// src/app/shared/components/dashboard-redirect/dashboard-redirect.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';

// Ionic Components
import {
    IonContent,
    IonSpinner,
    IonButton,
    IonIcon
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
    refreshOutline,
    homeOutline,
    logOutOutline
} from 'ionicons/icons';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/interfaces';

@Component({
    selector: 'app-dashboard-redirect',
    standalone: true,
    imports: [
        CommonModule,
        IonContent,
        IonSpinner,
        IonButton,
        IonIcon
    ],
    template: `
    <ion-content class="dashboard-redirect-content">
      <div class="redirect-container">
        
        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-section">
          <div class="loading-content">
            <ion-spinner name="crescent" color="primary" class="main-spinner"></ion-spinner>
            <h2 class="loading-title">Preparando tu dashboard...</h2>
            <p class="loading-subtitle">{{ loadingMessage }}</p>
            
            <!-- Progress indicator -->
            <div class="progress-dots">
              <div class="dot" [class.active]="step >= 1"></div>
              <div class="dot" [class.active]="step >= 2"></div>
              <div class="dot" [class.active]="step >= 3"></div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="hasError" class="error-section">
          <div class="error-content">
            <ion-icon name="alert-circle-outline" class="error-icon"></ion-icon>
            <h2 class="error-title">Error de Redirección</h2>
            <p class="error-message">{{ errorMessage }}</p>
            
            <div class="error-actions">
              <ion-button 
                fill="solid" 
                color="primary" 
                (click)="retryRedirect()"
                class="retry-button">
                <ion-icon name="refresh-outline" slot="start"></ion-icon>
                Reintentar
              </ion-button>
              
              <ion-button 
                fill="outline" 
                color="medium" 
                (click)="goToMain()"
                class="home-button">
                <ion-icon name="home-outline" slot="start"></ion-icon>
                Ir a Inicio
              </ion-button>
              
              <ion-button 
                fill="clear" 
                color="danger" 
                (click)="logout()"
                class="logout-button">
                <ion-icon name="log-out-outline" slot="start"></ion-icon>
                Cerrar Sesión
              </ion-button>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  `,
    styles: [`
    .dashboard-redirect-content {
      --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .redirect-container {
      width: 100%;
      max-width: 400px;
      padding: 32px 20px;
      text-align: center;
    }

    /* ===== LOADING STYLES ===== */
    .loading-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .loading-content {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .main-spinner {
      width: 60px;
      height: 60px;
      margin-bottom: 20px;
    }

    .loading-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 8px 0;
    }

    .loading-subtitle {
      font-size: 1rem;
      color: #666;
      margin: 0 0 24px 0;
      line-height: 1.4;
    }

    /* Progress Dots */
    .progress-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #e0e0e0;
      transition: all 0.3s ease;
    }

    .dot.active {
      background: #3880ff;
      transform: scale(1.2);
    }

    /* ===== ERROR STYLES ===== */
    .error-section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .error-content {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      max-width: 100%;
    }

    .error-icon {
      font-size: 3rem;
      color: #ff4444;
      margin-bottom: 16px;
    }

    .error-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 12px 0;
    }

    .error-message {
      font-size: 1rem;
      color: #666;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }

    .error-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .retry-button,
    .home-button,
    .logout-button {
      width: 100%;
      height: 44px;
      font-weight: 500;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 480px) {
      .redirect-container {
        padding: 20px 16px;
      }

      .loading-content,
      .error-content {
        padding: 32px 24px;
      }

      .loading-title,
      .error-title {
        font-size: 1.25rem;
      }

      .loading-subtitle,
      .error-message {
        font-size: 0.9rem;
      }
    }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .loading-content,
    .error-content {
      animation: fadeIn 0.4s ease-out;
    }

    .main-spinner {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
  `]
})
export class DashboardRedirectComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private authService = inject(AuthService);
    private router = inject(Router);

    // Component state
    isLoading = true;
    hasError = false;
    errorMessage = '';
    loadingMessage = 'Verificando credenciales...';
    step = 1;
    maxRetries = 3;
    currentRetry = 0;

    constructor() {
        this.registerIcons();
    }

    ngOnInit(): void {
        console.log('🚀 DashboardRedirectComponent initialized');
        this.startRedirectProcess();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private registerIcons(): void {
        addIcons({
            refreshOutline,
            homeOutline,
            logOutOutline
        });
    }

    private async startRedirectProcess(): Promise<void> {
        try {
            this.resetState();

            // Step 1: Wait for auth to be ready
            this.updateProgress(1, 'Verificando autenticación...');
            await this.waitForAuthReady();

            // Step 2: Get user and validate
            this.updateProgress(2, 'Cargando información de usuario...');
            const user = await this.getCurrentUser();

            if (!user) {
                throw new Error('No se encontró información del usuario');
            }

            if (!user.role) {
                throw new Error('El usuario no tiene un rol asignado');
            }

            // Step 3: Redirect to appropriate dashboard
            this.updateProgress(3, 'Redirigiendo al dashboard...');
            await this.redirectToDashboard(user.role);

        } catch (error) {
            console.error('❌ Error in redirect process:', error);
            this.handleRedirectError(error);
        }
    }

    private resetState(): void {
        this.isLoading = true;
        this.hasError = false;
        this.errorMessage = '';
        this.step = 1;
    }

    private updateProgress(step: number, message: string): void {
        this.step = step;
        this.loadingMessage = message;
        console.log(`📍 Step ${step}: ${message}`);
    }

    private waitForAuthReady(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout esperando autenticación'));
            }, 10000); // 10 second timeout

            this.authService.isLoading$
                .pipe(
                    filter(isLoading => !isLoading),
                    take(1),
                    takeUntil(this.destroy$)
                )
                .subscribe({
                    next: () => {
                        clearTimeout(timeout);
                        resolve();
                    },
                    error: (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    }
                });
        });
    }

    private getCurrentUser(): Promise<any> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout obteniendo usuario'));
            }, 5000); // 5 second timeout

            this.authService.currentUser$
                .pipe(
                    take(1),
                    takeUntil(this.destroy$)
                )
                .subscribe({
                    next: (user) => {
                        clearTimeout(timeout);
                        console.log('👤 Current user:', user);
                        resolve(user);
                    },
                    error: (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    }
                });
        });
    }

    private async redirectToDashboard(role: UserRole): Promise<void> {
        const dashboardRoutes: { [key: string]: string } = {
            [UserRole.CLIENT]: '/dashboard/client',
            [UserRole.FREELANCER]: '/dashboard/freelancer',
            [UserRole.ADMIN]: '/dashboard/admin'
        };

        const targetRoute = dashboardRoutes[role];

        if (!targetRoute) {
            throw new Error(`No se encontró ruta para el rol: ${role}`);
        }

        console.log(`🎯 Redirecting to: ${targetRoute}`);

        // Use navigateByUrl for more reliable navigation
        const navigationSuccess = await this.router.navigateByUrl(targetRoute);

        if (!navigationSuccess) {
            throw new Error('Falló la navegación al dashboard');
        }
    }

    private handleRedirectError(error: any): void {
        this.isLoading = false;
        this.hasError = true;

        if (this.currentRetry < this.maxRetries) {
            this.errorMessage = `Error temporal (intento ${this.currentRetry + 1}/${this.maxRetries}): ${error.message || 'Error desconocido'}`;
        } else {
            this.errorMessage = `Error persistente después de ${this.maxRetries} intentos: ${error.message || 'Error desconocido'}`;
        }

        console.error('🚨 Redirect error details:', {
            error,
            retry: this.currentRetry,
            maxRetries: this.maxRetries
        });
    }

    // Public methods for error handling
    async retryRedirect(): Promise<void> {
        if (this.currentRetry < this.maxRetries) {
            this.currentRetry++;
            console.log(`🔄 Retrying redirect (attempt ${this.currentRetry})`);
            await this.startRedirectProcess();
        } else {
            this.errorMessage = 'Se agotaron los intentos de redirección';
        }
    }

    async goToMain(): Promise<void> {
        try {
            await this.router.navigateByUrl('/dashboard');
        } catch (error) {
            console.error('Error navigating to main:', error);
            // If even this fails, try to go to login
            await this.router.navigateByUrl('/auth/login');
        }
    }

    async logout(): Promise<void> {
        try {
            await this.authService.logout();
            await this.router.navigateByUrl('/auth/login');
        } catch (error) {
            console.error('Error during logout:', error);
            // Force navigation to login even if logout fails
            await this.router.navigateByUrl('/auth/login');
        }
    }
}