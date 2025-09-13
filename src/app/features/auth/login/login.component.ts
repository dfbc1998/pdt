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
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, eyeOutline, eyeOffOutline, briefcaseOutline, mailOutline, alertCircleOutline, businessOutline, personOutline, arrowForwardOutline } from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/interfaces';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonLabel, IonItem,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: `login.component.html`,
  styleUrls: [`login.component.scss`]
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
    addIcons({ briefcaseOutline, mailOutline, alertCircleOutline, logInOutline, businessOutline, personOutline, arrowForwardOutline, eyeOutline, eyeOffOutline });
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
          email: 'cliente@test.com',
          password: 'password123'
        },
        freelancer: {
          email: 'freelancer@test.com',
          password: 'password123'
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