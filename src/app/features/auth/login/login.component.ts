// src/app/features/auth/login/login.component.ts - REEMPLAZAR COMPLETO
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonItem,
  IonLabel,
  IonInput,
  IonCheckbox
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logInOutline,
  eyeOutline,
  eyeOffOutline,
  briefcaseOutline,
  mailOutline,
  alertCircleOutline,
  businessOutline,
  personOutline,
  arrowForwardOutline
} from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/interfaces';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    IonLabel,
    IonItem,
    IonInput,
    IonCheckbox,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
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
      briefcaseOutline,
      mailOutline,
      alertCircleOutline,
      logInOutline,
      businessOutline,
      personOutline,
      arrowForwardOutline,
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
    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const loginData = this.loginForm.value;
      console.log('🔐 Attempting login with:', { email: loginData.email });

      const result = await this.authService.login(loginData);

      if (result.success) {
        console.log('✅ Login successful');

        // Check if user needs recovery (has null data but success = true)
        if (!result.data) {
          console.log('🔧 User needs account recovery');
          await this.router.navigate(['/auth/user-recovery']);
        } else {
          console.log('👤 User authenticated successfully, redirecting to dashboard');
          // CAMBIO PRINCIPAL: Ir directamente al dashboard optimizado
          // El nuevo DashboardRedirectComponent se encargará de la redirección automática
          await this.router.navigate(['/dashboard']);
        }
      } else {
        this.errorMessage = result.error || 'Error al iniciar sesión';
        console.error('❌ Login failed:', result.error);
      }
    } catch (error: any) {
      console.error('💥 Login error:', error);
      this.errorMessage = error.message || 'Error inesperado al iniciar sesión';
    } finally {
      this.isLoading = false;
    }
  }

  async loginAsDemo(userType: 'client' | 'freelancer'): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const demoCredentials = {
        client: {
          email: 'cliente@test.com',
          password: 'password123'
        },
        freelancer: {
          email: 'freelancer@test.com',
          password: 'password123'
        }
      };

      const credentials = demoCredentials[userType];
      console.log('🎭 Attempting demo login as:', userType);

      const result = await this.authService.login(credentials);

      if (result.success) {
        console.log('✅ Demo login successful, redirecting to dashboard');
        // CAMBIO: También usar el dashboard optimizado para login demo
        await this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = result.error || 'Error al iniciar sesión con cuenta demo';
        console.error('❌ Demo login failed:', result.error);
      }
    } catch (error: any) {
      console.error('💥 Demo login error:', error);
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

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}