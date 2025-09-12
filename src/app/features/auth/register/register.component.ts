import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonToast,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, eyeOutline, eyeOffOutline, briefcaseOutline, businessOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { RegisterRequest, UserRole } from '../../../core/interfaces';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonToast,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonLabel,
    FormFieldComponent,
    LoadingComponent
  ],
  template: `
    <ion-content class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <ion-grid>
          <ion-row class="justify-center">
            <ion-col size="12" size-md="8" size-lg="6">
              <!-- Logo and Title -->
              <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gradient mb-2">FreelancePro</h1>
                <p class="text-gray-600">Crea tu cuenta y comienza a trabajar</p>
              </div>

              <!-- Register Form -->
              <ion-card class="shadow-large">
                <ion-card-header class="text-center">
                  <ion-card-title class="text-2xl font-semibold">Crear Cuenta</ion-card-title>
                </ion-card-header>

                <ion-card-content>
                  @if (isLoading) {
                    <app-loading message="Creando cuenta..."></app-loading>
                  } @else {
                    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                      <!-- User Type Selection -->
                      <div class="mb-6">
                        <label class="form-label">¿Qué tipo de cuenta deseas crear?</label>
                        <ion-radio-group formControlName="role" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <ion-item class="role-option" [class.selected]="registerForm.get('role')?.value === UserRole.CLIENT">
                            <ion-radio slot="start" [value]="UserRole.CLIENT"></ion-radio>
                            <ion-label class="ml-3">
                              <div class="flex items-center">
                                <ion-icon name="business-outline" class="text-2xl text-primary-600 mr-3"></ion-icon>
                                <div>
                                  <h3 class="font-semibold">Cliente</h3>
                                  <p class="text-sm text-gray-600">Contrata freelancers para tus proyectos</p>
                                </div>
                              </div>
                            </ion-label>
                          </ion-item>

                          <ion-item class="role-option" [class.selected]="registerForm.get('role')?.value === UserRole.FREELANCER">
                            <ion-radio slot="start" [value]="UserRole.FREELANCER"></ion-radio>
                            <ion-label class="ml-3">
                              <div class="flex items-center">
                                <ion-icon name="briefcase-outline" class="text-2xl text-primary-600 mr-3"></ion-icon>
                                <div>
                                  <h3 class="font-semibold">Freelancer</h3>
                                  <p class="text-sm text-gray-600">Ofrece tus servicios profesionales</p>
                                </div>
                              </div>
                            </ion-label>
                          </ion-item>
                        </ion-radio-group>
                        @if (isFieldInvalid('role')) {
                          <p class="text-sm text-red-600 mt-1">Selecciona el tipo de cuenta</p>
                        }
                      </div>

                      <!-- Personal Information -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Display Name -->
                        <app-form-field
                          label="Nombre completo"
                          type="text"
                          placeholder="Tu nombre completo"
                          formControlName="displayName"
                          [hasError]="isFieldInvalid('displayName')"
                          [errorMessage]="getFieldErrorMessage('displayName')">
                        </app-form-field>

                        <!-- Email -->
                        <app-form-field
                          label="Correo electrónico"
                          type="email"
                          placeholder="tu@email.com"
                          formControlName="email"
                          [hasError]="isFieldInvalid('email')"
                          [errorMessage]="getFieldErrorMessage('email')">
                        </app-form-field>
                      </div>

                      <!-- Password Fields -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Password -->
                        <div class="relative">
                          <app-form-field
                            label="Contraseña"
                            [type]="showPassword ? 'text' : 'password'"
                            placeholder="Mínimo 6 caracteres"
                            formControlName="password"
                            [hasError]="isFieldInvalid('password')"
                            [errorMessage]="getFieldErrorMessage('password')">
                          </app-form-field>
                          
                          <button
                            type="button"
                            class="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                            (click)="togglePasswordVisibility()">
                            <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                          </button>
                        </div>

                        <!-- Confirm Password -->
                        <div class="relative">
                          <app-form-field
                            label="Confirmar contraseña"
                            [type]="showConfirmPassword ? 'text' : 'password'"
                            placeholder="Repite tu contraseña"
                            formControlName="confirmPassword"
                            [hasError]="isFieldInvalid('confirmPassword')"
                            [errorMessage]="getFieldErrorMessage('confirmPassword')">
                          </app-form-field>
                          
                          <button
                            type="button"
                            class="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                            (click)="toggleConfirmPasswordVisibility()">
                            <ion-icon [name]="showConfirmPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                          </button>
                        </div>
                      </div>

                      <!-- Terms and Conditions -->
                      <div class="mb-6">
                        <label class="flex items-start">
                          <input 
                            type="checkbox" 
                            formControlName="agreeToTerms"
                            class="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500">
                          <span class="ml-3 text-sm text-gray-600">
                            Acepto los 
                            <a routerLink="/terms" class="text-primary-600 hover:text-primary-500">términos y condiciones</a>
                            y la 
                            <a routerLink="/privacy-policy" class="text-primary-600 hover:text-primary-500">política de privacidad</a>
                          </span>
                        </label>
                        @if (isFieldInvalid('agreeToTerms')) {
                          <p class="text-sm text-red-600 mt-1">Debes aceptar los términos y condiciones</p>
                        }
                      </div>

                      <!-- Submit Button -->
                      <ion-button 
                        type="submit" 
                        expand="block" 
                        [disabled]="registerForm.invalid || isLoading"
                        class="mb-4">
                        @if (isLoading) {
                          <ion-spinner name="crescent" class="mr-2"></ion-spinner>
                        } @else {
                          <ion-icon name="person-add-outline" slot="start"></ion-icon>
                        }
                        Crear Cuenta
                      </ion-button>

                      <!-- Login Link -->
                      <div class="text-center">
                        <p class="text-sm text-gray-600">
                          ¿Ya tienes una cuenta? 
                          <a routerLink="/auth/login" class="text-primary-600 hover:text-primary-500 font-medium">
                            Inicia sesión aquí
                          </a>
                        </p>
                      </div>
                    </form>
                  }
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
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
        duration="5000"
        color="success"
        position="bottom"
        (didDismiss)="successMessage = ''">
      </ion-toast>
    </ion-content>
  `,
  styles: [`
    .text-gradient {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

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

    ion-card {
      border-radius: 1rem;
      overflow: hidden;
    }

    ion-button {
      --border-radius: 0.75rem;
      font-weight: 500;
    }

    .relative {
      position: relative;
    }

    .absolute {
      position: absolute;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';

  // Expose UserRole enum to template
  UserRole = UserRole;

  constructor() {
    addIcons({
      personAddOutline,
      eyeOutline,
      eyeOffOutline,
      briefcaseOutline,
      businessOutline
    });
  }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  // Custom validator for password confirmation
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const registerData: RegisterRequest = {
          email: this.registerForm.value.email,
          password: this.registerForm.value.password,
          displayName: this.registerForm.value.displayName,
          role: this.registerForm.value.role
        };

        const result = await this.authService.register(registerData);

        if (result.success) {
          this.successMessage = result.message || 'Cuenta creada exitosamente. Revisa tu correo para verificar tu cuenta.';
          // User will be redirected by the auth service after a short delay
          setTimeout(() => {
            // The auth service will handle the redirection based on user role
          }, 2000);
        } else {
          this.errorMessage = result.error || 'Error al crear la cuenta';
        }
      } catch (error: any) {
        this.errorMessage = error.message || 'Error inesperado';
      } finally {
        this.isLoading = false;
      }
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Ingresa un correo electrónico válido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
      if (field.errors['requiredTrue']) {
        return 'Debes aceptar los términos y condiciones';
      }
    }

    return '';
  }
}