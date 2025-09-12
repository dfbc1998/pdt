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
import { mailOutline, arrowBackOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { FormFieldComponent } from '../../../shared/components/form-field/form-field.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-forgot-password',
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
                <p class="text-gray-600">Recupera tu contraseña</p>
              </div>

              <!-- Reset Password Form -->
              <ion-card class="shadow-large">
                <ion-card-header class="text-center">
                  <ion-card-title class="text-2xl font-semibold">Recuperar Contraseña</ion-card-title>
                </ion-card-header>

                <ion-card-content>
                  @if (isLoading) {
                    <app-loading message="Enviando correo..."></app-loading>
                  } @else if (emailSent) {
                    <!-- Success Message -->
                    <div class="text-center">
                      <ion-icon name="mail-outline" class="text-6xl text-success-600 mb-4"></ion-icon>
                      <h3 class="text-xl font-semibold mb-2">¡Correo Enviado!</h3>
                      <p class="text-gray-600 mb-6">
                        Hemos enviado las instrucciones para recuperar tu contraseña a tu correo electrónico.
                      </p>
                      <ion-button routerLink="/auth/login" fill="solid">
                        <ion-icon name="arrow-back-outline" slot="start"></ion-icon>
                        Volver al Login
                      </ion-button>
                    </div>
                  } @else {
                    <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
                      <p class="text-sm text-gray-600 mb-6 text-center">
                        Ingresa tu correo electrónico y te enviaremos las instrucciones para recuperar tu contraseña.
                      </p>

                      <!-- Email Field -->
                      <app-form-field
                        label="Correo electrónico"
                        type="email"
                        placeholder="tu@email.com"
                        formControlName="email"
                        [hasError]="isFieldInvalid('email')"
                        [errorMessage]="getFieldErrorMessage('email')">
                      </app-form-field>

                      <!-- Submit Button -->
                      <ion-button 
                        type="submit" 
                        expand="block" 
                        [disabled]="resetForm.invalid || isLoading"
                        class="mb-4">
                        @if (isLoading) {
                          <ion-spinner name="crescent" class="mr-2"></ion-spinner>
                        } @else {
                          <ion-icon name="mail-outline" slot="start"></ion-icon>
                        }
                        Enviar Instrucciones
                      </ion-button>

                      <!-- Back to Login Link -->
                      <div class="text-center">
                        <p class="text-sm text-gray-600">
                          ¿Recordaste tu contraseña? 
                          <a routerLink="/auth/login" class="text-primary-600 hover:text-primary-500 font-medium">
                            Volver al login
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

    ion-card {
      border-radius: 1rem;
      overflow: hidden;
    }

    ion-button {
      --border-radius: 0.75rem;
      font-weight: 500;
    }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  resetForm!: FormGroup;
  isLoading = false;
  emailSent = false;
  errorMessage = '';

  constructor() {
    addIcons({
      mailOutline,
      arrowBackOutline
    });
  }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const result = await this.authService.resetPassword(this.resetForm.value.email);

        if (result.success) {
          this.emailSent = true;
        } else {
          this.errorMessage = result.error || 'Error al enviar el correo de recuperación';
        }
      } catch (error: any) {
        this.errorMessage = error.message || 'Error inesperado';
      } finally {
        this.isLoading = false;
      }
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.resetForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Ingresa un correo electrónico válido';
      }
    }

    return '';
  }
}