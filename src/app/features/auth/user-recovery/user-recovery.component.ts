import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refreshOutline,
  businessOutline,
  briefcaseOutline,
  checkmarkOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  logOutOutline
} from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/interfaces';

@Component({
  selector: 'app-user-recovery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonLabel
  ],
  templateUrl: './user-recovery.component.html',
  styleUrls: ['./user-recovery.component.scss']
})
export class UserRecoveryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form and state
  recoveryForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Expose UserRole enum to template
  UserRole = UserRole;

  constructor() {
    this.registerIcons();
  }

  ngOnInit(): void {
    this.initializeForm();
    this.checkAuthState();
  }

  private registerIcons(): void {
    addIcons({
      refreshOutline,
      businessOutline,
      briefcaseOutline,
      checkmarkOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      logOutOutline
    });
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
        // If user exists with complete data, redirect to dashboard
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

        // Recreate the user document using the method from AuthService
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
        console.error('User recovery error:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Role selection
  selectRole(role: UserRole): void {
    this.recoveryForm.get('role')?.setValue(role);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.recoveryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.recoveryForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) {
        return 'Debes seleccionar tu tipo de cuenta';
      }
    }

    return '';
  }
}