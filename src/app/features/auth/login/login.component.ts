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
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { LoginRequest } from '../../../core/interfaces';

@Component({
  selector: 'app-login',
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
    FormFieldComponent,
    LoadingComponent
  ],
  template: `
    <ion-content class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <ion-grid>
          <ion-row class="justify-center">
            <ion-col size="12" size-md="6" size-lg="4">
              <!-- Logo and Title -->
              <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gradient mb-2">FreelancePro</h1>
                <p class="text-gray-600">Inicia sesión en tu cuenta</p>
              </div>

              <!-- Login Form -->
              <ion-card class="shadow-large">
                <ion-card-header class="text-center">
                  <ion-card-title class="text-2xl font-semibold">Iniciar Sesión</ion-card-title>
                </ion-card-header>

                <ion-card-content>
                  @if (isLoading) {
                    <app-loading message="Iniciando sesión..."></app-loading>
                  } @else {
                    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                      <!-- Email Field -->
                      <app-form-field
                        label="Correo electrónico"
                        type="email"
                        placeholder="tu@email.com"
                        formControlName="email"
                        [hasError]="isFieldInvalid('email')"
                        [errorMessage]="getFieldErrorMessage('email')">
                      </app-form-field>

                      <!-- Password Field -->
                      <div class="relative">
                        <app-form-field
                          label="Contraseña"
                          [type]="showPassword ? 'text' : 'password'"
                          placeholder="Tu contraseña"
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

                      <!-- Remember Me / Forgot Password -->
                      <div class="flex items-center justify-between mb-6">
                        <label class="flex items-center">
                          <input 
                            type="checkbox" 
                            formControlName="rememberMe"
                            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500">
                          <span class="ml-2 text-sm text-gray-600">Recordarme</span>
                        </label>
                        <a routerLink="/auth/forgot-password" class="text-sm text-primary-600 hover:text-primary-500">
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>

                      <!-- Submit Button -->
                      <ion-button 
                        type="submit" 
                        expand="block" 
                        [disabled]="loginForm.invalid || isLoading"
                        class="mb-4">
                        @if (isLoading) {
                          <ion-spinner name="crescent" class="mr-2"></ion-spinner>
                        } @else {
                          <ion-icon name="log-in-outline" slot="start"></ion-icon>
                        }
                        Iniciar Sesión
                      </ion-button>

                      <!-- Register Link -->
                      <div class="text-center">
                        <p class="text-sm text-gray-600">
                          ¿No tienes una cuenta? 
                          <a routerLink="/auth/register" class="text-primary-600 hover:text-primary-500 font-medium">
                            Regístrate aquí
                          </a>
                        </p>
                      </div>
                    </form>
                  }
                </ion-card-content>
              </ion-card>

              <!-- Demo Accounts -->
              <ion-card class="mt-4 shadow-medium">
                <ion-card-header>
                  <ion-card-title class="text-lg">Cuentas de Demostración</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="space-y-2">
                    <ion-button
                      fill="outline"
                      expand="block"
                      size="small"
                      (click)="loginAsDemo('client')">
                      Iniciar como Cliente Demo
                    </ion-button>
                    <ion-button
                      fill="outline"
                      expand="block"
                      size="small"
                      (click)="loginAsDemo('freelancer')">
                      Iniciar como Freelancer Demo
                    </ion-button>
                  </div>
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

    .shadow-medium {
      box-shadow: 0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';

  constructor() {
    addIcons({
      logInOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const loginData: LoginRequest = {
          email: this.loginForm.value.email,
          password: this.loginForm.value.password
        };

        const result = await this.authService.login(loginData);

        if (result.success) {
          // Check if user needs recovery (has null data but success = true)
          if (!result.data) {
            console.log('User needs account recovery');
            this.router.navigate(['/auth/user-recovery']);
          }
          // else: Success - user will be redirected by the auth service or auth guard
        } else {
          this.errorMessage = result.error || 'Error al iniciar sesión';
        }
      } catch (error: any) {
        this.errorMessage = error.message || 'Error inesperado';
      } finally {
        this.isLoading = false;
      }
    }
  }

  async loginAsDemo(userType: 'client' | 'freelancer'): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const demoCredentials = {
        client: {
          email: 'client.demo@freelancepro.com',
          password: 'demo123456'
        },
        freelancer: {
          email: 'freelancer.demo@freelancepro.com',
          password: 'demo123456'
        }
      };

      const credentials = demoCredentials[userType];
      const result = await this.authService.login(credentials);

      if (!result.success) {
        this.errorMessage = result.error || 'Error al iniciar sesión con cuenta demo';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Error inesperado';
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

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
    }

    return '';
  }
}