import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
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
  personAddOutline,
  eyeOutline,
  eyeOffOutline,
  briefcaseOutline,
  businessOutline,
  personOutline,
  mailOutline,
  alertCircleOutline,
  arrowForwardOutline
} from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, UserRole } from '../../../core/interfaces';

@Component({
  selector: 'app-register',
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
    IonInput,
    IonCheckbox
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form and state
  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  // Expose UserRole to template
  UserRole = UserRole;

  constructor() {
    this.registerIcons();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private registerIcons(): void {
    addIcons({
      personAddOutline,
      eyeOutline,
      eyeOffOutline,
      briefcaseOutline,
      businessOutline,
      personOutline,
      mailOutline,
      alertCircleOutline,
      arrowForwardOutline
    });
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      role: ['', [Validators.required]],
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator for password matching
  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Form submission
  async onSubmit(): Promise<void> {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const formValue = this.registerForm.value;

        const registerData: RegisterRequest = {
          email: formValue.email,
          password: formValue.password,
          displayName: formValue.displayName,
          role: formValue.role as UserRole
        };

        const result = await this.authService.register(registerData);

        if (result.success) {
          // Registration successful, user will be redirected by auth service
        } else {
          this.errorMessage = result.error || 'Error al crear la cuenta';
        }
      } catch (error: any) {
        this.errorMessage = error.message || 'Error inesperado';
        console.error('Registration error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Role selection
  selectRole(role: 'client' | 'freelancer'): void {
    const userRole = role === 'client' ? UserRole.CLIENT : UserRole.FREELANCER;
    this.registerForm.get('role')?.setValue(userRole);
  }

  // Password visibility toggles
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Update password values for native inputs
  updatePasswordValue(event: any): void {
    const value = event.target.value;
    this.registerForm.get('password')?.setValue(value);
    this.registerForm.get('password')?.markAsTouched();
  }

  updateConfirmPasswordValue(event: any): void {
    const value = event.target.value;
    this.registerForm.get('confirmPassword')?.setValue(value);
    this.registerForm.get('confirmPassword')?.markAsTouched();
  }

  // Password strength methods
  getPasswordStrengthPercentage(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;

    return strength;
  }

  getPasswordStrengthClass(): string {
    const percentage = this.getPasswordStrengthPercentage();
    if (percentage < 50) return 'weak';
    if (percentage < 100) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const percentage = this.getPasswordStrengthPercentage();
    if (percentage < 50) return 'Débil';
    if (percentage < 100) return 'Media';
    return 'Fuerte';
  }

  // Terms and privacy methods
  openTerms(event: Event): void {
    event.preventDefault();
    // TODO: Open terms modal or navigate to terms page
    console.log('Opening terms and conditions...');
  }

  openPrivacy(event: Event): void {
    event.preventDefault();
    // TODO: Open privacy modal or navigate to privacy page
    console.log('Opening privacy policy...');
  }

  // Form validation helpers
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
        const requiredLength = field.errors['minlength'].requiredLength;
        if (fieldName === 'displayName') {
          return `El nombre debe tener al menos ${requiredLength} caracteres`;
        }
        if (fieldName === 'password') {
          return `La contraseña debe tener al menos ${requiredLength} caracteres`;
        }
      }
      if (field.errors['requiredTrue']) {
        return 'Debes aceptar los términos y condiciones';
      }
    }

    // Check for password mismatch
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }
}