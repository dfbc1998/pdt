import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
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
import { mailOutline, arrowBackOutline, checkmarkCircleOutline, alertCircleOutline, sendOutline } from 'ionicons/icons';

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
    IonButton,
    IonIcon,
    IonSpinner,
    IonItem,
    IonLabel,
    IonInput
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form and state
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  emailSent = false;
  errorMessage = '';

  // Resend functionality
  canResend = false;
  resendCountdown = 0;
  private countdownInterval?: number;

  constructor() {
    this.registerIcons();
    this.initializeForm();
  }

  ngOnInit(): void {
    // Component initialized
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private registerIcons(): void {
    addIcons({
      mailOutline,
      arrowBackOutline,
      sendOutline,
      checkmarkCircleOutline,
      alertCircleOutline
    });
  }

  private initializeForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const email = this.forgotPasswordForm.value.email;

        // Using the resetPassword method from AuthService
        const result = await this.authService.resetPassword(email);

        if (result.success) {
          this.emailSent = true;
          this.startResendCountdown();
        } else {
          this.errorMessage = result.error || 'Error al enviar el correo de recuperación';
        }
      } catch (error: any) {
        this.errorMessage = error.message || 'Error inesperado';
        console.error('Forgot password error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async resendEmail(): Promise<void> {
    if (!this.canResend) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const email = this.forgotPasswordForm.value.email;
      const result = await this.authService.resetPassword(email);

      if (result.success) {
        this.startResendCountdown();
      } else {
        this.errorMessage = result.error || 'Error al reenviar el correo';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Error inesperado';
    } finally {
      this.isLoading = false;
    }
  }

  private startResendCountdown(): void {
    this.canResend = false;
    this.resendCountdown = 60; // 60 seconds

    this.countdownInterval = window.setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        this.canResend = true;
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
      }
    }, 1000);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);

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