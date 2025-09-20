// src/app/shared/components/dashboard-redirect/dashboard-redirect.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';

// Ionic Components
import {
    IonContent,
    IonCard,
    IonCardContent,
    IonSpinner,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel,
    ToastController
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
    layersOutline,
    shieldCheckmarkOutline,
    personOutline,
    arrowForwardOutline,
    checkmark,
    bulbOutline,
    alertCircleOutline,
    warningOutline,
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
        IonCard,
        IonCardContent,
        IonSpinner,
        IonButton,
        IonIcon,
        IonChip,
        IonLabel
    ],
    templateUrl: './dashboard-redirect.component.html',
    styleUrls: ['./dashboard-redirect.component.scss']
})
export class DashboardRedirectComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private authService = inject(AuthService);
    private router = inject(Router);
    private toastController = inject(ToastController);

    // Component state
    isLoading = true;
    hasError = false;
    errorMessage = '';
    loadingMessage = 'Verificando credenciales...';
    step = 1;
    maxRetries = 3;
    currentRetry = 0;

    // Loading tips
    tips: string[] = [
        'Conecta con freelancers talentosos de todo el mundo',
        'Gestiona tus proyectos de forma eficiente y profesional',
        'Construye tu reputación con cada proyecto completado',
        'Accede a herramientas avanzadas de colaboración',
        'Recibe pagos seguros a través de nuestra plataforma'
    ];
    currentTip = '';
    private tipInterval?: any;

    constructor() {
        this.registerIcons();
        this.setRandomTip();
        this.startTipRotation();
    }

    ngOnInit(): void {
        console.log('🚀 DashboardRedirectComponent initialized');
        this.startRedirectProcess();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearTipInterval();
    }

    private registerIcons(): void {
        addIcons({
            layersOutline,
            shieldCheckmarkOutline,
            personOutline,
            arrowForwardOutline,
            checkmark,
            bulbOutline,
            alertCircleOutline,
            warningOutline,
            refreshOutline,
            homeOutline,
            logOutOutline
        });
    }

    private setRandomTip(): void {
        const randomIndex = Math.floor(Math.random() * this.tips.length);
        this.currentTip = this.tips[randomIndex];
    }

    private startTipRotation(): void {
        this.tipInterval = setInterval(() => {
            this.setRandomTip();
        }, 3000); // Change tip every 3 seconds
    }

    private clearTipInterval(): void {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
            this.tipInterval = null;
        }
    }

    private async startRedirectProcess(): Promise<void> {
        try {
            this.resetState();

            // Step 1: Wait for auth to be ready
            this.updateProgress(1, 'Verificando autenticación...');
            await this.waitForAuthReady();

            // Small delay for UX
            await this.delay(800);

            // Step 2: Get user and validate
            this.updateProgress(2, 'Cargando información de usuario...');
            const user = await this.getCurrentUser();

            if (!user) {
                throw new Error('No se encontró información del usuario');
            }

            if (!user.role) {
                throw new Error('El usuario no tiene un rol asignado');
            }

            // Small delay for UX
            await this.delay(800);

            // Step 3: Redirect to appropriate dashboard
            this.updateProgress(3, 'Redirigiendo al dashboard...');
            await this.delay(500); // Brief pause before redirect
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

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private waitForAuthReady(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout esperando autenticación'));
            }, 15000); // 15 second timeout

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
            }, 10000); // 10 second timeout

            this.authService.currentUser$
                .pipe(
                    take(1),
                    takeUntil(this.destroy$)
                )
                .subscribe({
                    next: (user) => {
                        clearTimeout(timeout);
                        console.log('👤 Current user:', user ? `${user.email} (${user.role})` : 'null');
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

        // Clear tip rotation before redirect
        this.clearTipInterval();

        // Use navigateByUrl for more reliable navigation
        const navigationSuccess = await this.router.navigateByUrl(targetRoute);

        if (!navigationSuccess) {
            throw new Error('Falló la navegación al dashboard');
        }
    }

    private handleRedirectError(error: any): void {
        this.isLoading = false;
        this.hasError = true;
        this.clearTipInterval(); // Stop tip rotation on error

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
            this.startTipRotation(); // Restart tip rotation
            await this.startRedirectProcess();
        } else {
            this.errorMessage = 'Se agotaron los intentos de redirección';
            await this.showToast('Se agotaron los intentos de redirección', 'danger');
        }
    }

    async goToMain(): Promise<void> {
        try {
            console.log('🏠 Navigating to main dashboard');
            await this.router.navigateByUrl('/dashboard');
        } catch (error) {
            console.error('Error navigating to main:', error);
            // If even this fails, try to go to login
            await this.router.navigateByUrl('/auth/login');
            await this.showToast('Redirigido al login', 'warning');
        }
    }

    async logout(): Promise<void> {
        try {
            console.log('🚪 Logging out user');
            await this.authService.logout();
            await this.showToast('Sesión cerrada exitosamente', 'success');
        } catch (error) {
            console.error('Error during logout:', error);
            // Force navigation to login even if logout fails
            await this.router.navigateByUrl('/auth/login');
            await this.showToast('Sesión cerrada', 'warning');
        }
    }

    private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            position: 'bottom',
            color,
            buttons: [
                {
                    text: 'Cerrar',
                    role: 'cancel'
                }
            ]
        });
        await toast.present();
    }
}