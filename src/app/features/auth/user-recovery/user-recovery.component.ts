import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonToast,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, businessOutline, briefcaseOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/interfaces';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-user-recovery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonToast,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonLabel,
    LoadingComponent
  ],
  template: `
    <ion-content class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <ion-card class="w-full max-w-md shadow-large">
          <ion-card-header class="text-center">
            <ion-card-title class="text-2xl font-semibold">Completar Configuración</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            @if (isLoading) {
              <app-loading message="Configurando cuenta..."></app-loading>
            } @else {
              <div class="text-center mb-6">
                <ion-icon name="refresh-outline" class="text-6xl text-primary-600 mb-4"></ion-icon>
                <p class="text-gray-600 mb-4">
                  Tu cuenta necesita configuración adicional. Por favor selecciona tu tipo de usuario:
                </p>
              </div>

              <form [formGroup]="recoveryForm" (ngSubmit)="onSubmit()">
                <!-- User Type Selection -->
                <div class="mb-6">
                  <label class="form-label">Tipo de cuenta:</label>
                  <ion-radio-group formControlName="role" class="space-y-3 mt-2">
                    <ion-item class="role-option" [class.selected]="recoveryForm.get('role')?.value === UserRole.CLIENT">
                      <ion-radio slot="start" [value]="UserRole.CLIENT"></ion-radio>
                      <ion-label class="ml-3">
                        <div class="flex items-center">
                          <ion-icon name="business-outline" class="text-2xl text-primary-600 mr-3"></ion-icon>
                          <div>
                            <h3 class="font-semibold">Cliente</h3>
                            <p class="text-sm text-gray-600">Contrato freelancers para mis proyectos</p>
                          </div>
                        </div>
                      </ion-label>
                    </ion-item>

                    <ion-item class="role-option" [class.selected]="recoveryForm.get('role')?.value === UserRole.FREELANCER">
                      <ion-radio slot="start" [value]="UserRole.FREELANCER"></ion-radio>
                      <ion-label class="ml-3">
                        <div class="flex items-center">
                          <ion-icon name="briefcase-outline" class="text-2xl text-primary-600 mr-3"></ion-icon>
                          <div>
                            <h3 class="font-semibold">Freelancer</h3>
                            <p class="text-sm text-gray-600">Ofrezco mis servicios profesionales</p>
                          </div>
                        </div>
                      </ion-label>
                    </ion-item>
                  </ion-radio-group>
                  @if (isFieldInvalid('role')) {
                    <p class="text-sm text-red-600 mt-1">Selecciona el tipo de cuenta</p>
                  }
                </div>

                <!-- Submit Button -->
                <ion-button 
                  type="submit" 
                  expand="block" 
                  [disabled]="recoveryForm.invalid || isLoading"
                  class="mb-4">
                  Completar Configuración
                </ion-button>

                <!-- Logout Option -->
                <div class="text-center">
                  <ion-button fill="clear" (click)="logout()">
                    Cerrar Sesión y Empezar de Nuevo
                  </ion-button>
                </div>
              </form>
            }
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Toast for errors -->
      <ion-toast
        [isOpen]="!!errorMessage"
        [message]="errorMessage"
        duration="5000"
        color="danger"
        position="bottom"
        (didDismiss)="errorMessage = ''">
      </ion-toast>

      <!-- Success Toast -->
      <ion-toast
        [isOpen]="!!successMessage"
        [message]="successMessage"
        duration="3000"
        color="success"
        position="bottom"
        (didDismiss)="successMessage = ''">
      </ion-toast>
    </ion-content>
  `,
  styles: [`
    .shadow-large {
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .role-option {
      --background: white;
      --border-radius: 0.75rem;
      --border-color: #e5e7eb;
      --border-width: 2px;
      --border-style: solid;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 0.5rem;
    }

    .role-option:hover {
      --border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .role-option.selected {
      --border-color: #3b82f6;
      --background: #eff6ff;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }

    .space-y-3 > * + * {
      margin-top: 0.75rem;
    }
  `]
})
export class UserRecoveryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  recoveryForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Expose UserRole enum to template
  UserRole = UserRole;

  constructor() {
    addIcons({
      refreshOutline,
      businessOutline,
      briefcaseOutline
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.checkAuthState();
  }

  private initializeForm(): void {
    this.recoveryForm = this.fb.group({
      role: ['', [Validators.required]]
    });
  }

  private checkAuthState(): void {
    // Verify user is authenticated but missing document
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // If user exists, redirect to dashboard
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.recoveryForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const firebaseUser = this.authService.getCurrentFirebaseUser();
        if (!firebaseUser) {
          throw new Error('No authenticated user found');
        }

        const selectedRole = this.recoveryForm.value.role as UserRole;

        // Recreate the user document
        const result = await this.authService.recreateUserDocument(selectedRole);

        if (result.success) {
          this.successMessage = 'Configuración completada exitosamente';

          // Redirect after a short delay
          setTimeout(() => {
            if (selectedRole === UserRole.CLIENT) {
              this.router.navigate(['/profile/client/setup']);
            } else if (selectedRole === UserRole.FREELANCER) {
              this.router.navigate(['/profile/freelancer/setup']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }, 2000);
        } else {
          this.errorMessage = result.error || 'Error al completar la configuración';
        }
      } catch (error: any) {
        this.errorMessage = error.message || 'Error inesperado';
      } finally {
        this.isLoading = false;
      }
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.recoveryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}