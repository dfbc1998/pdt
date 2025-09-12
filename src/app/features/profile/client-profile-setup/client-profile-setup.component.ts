import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonAlert,
  IonToast,
  IonSpinner,
  IonChip,
  IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  locationOutline,
  phonePortraitOutline,
  mailOutline,
  globeOutline,
  documentTextOutline,
  peopleOutline,
  checkmarkCircleOutline,
  arrowForwardOutline,
  arrowBackOutline,
  cameraOutline, checkmarkOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ClientProfile,
  CompanySize,
  VerificationStatus,
  ApiResponse
} from '../../../core/interfaces';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-client-profile-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonGrid,
    IonRow,
    IonCol,
    IonProgressBar,
    IonAlert,
    IonToast,
    IonSpinner,
    IonChip,
    IonAvatar,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './client-profile-setup.component.html',
  styleUrls: ['./client-profile-setup.component.scss']
})
export class ClientProfileSetupComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Form and state management
  profileForm!: FormGroup;
  currentStep = 1;
  totalSteps = 3;
  isSubmitting = false;
  isLoading = true;

  // Alerts and toasts
  showExitAlert = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';

  // Alert buttons configuration
  alertButtons = [
    {
      text: 'Continuar Editando',
      role: 'cancel',
      handler: () => {
        this.showExitAlert = false;
      }
    },
    {
      text: 'Salir',
      role: 'confirm',
      handler: () => {
        this.confirmExit();
      }
    }
  ];

  // Company size options
  companySizeOptions = [
    { value: CompanySize.STARTUP, label: 'Startup (1-10 empleados)', description: 'Empresa emergente o en fase inicial' },
    { value: CompanySize.SMALL, label: 'Pequeña (11-50 empleados)', description: 'Empresa pequeña con crecimiento estable' },
    { value: CompanySize.MEDIUM, label: 'Mediana (51-200 empleados)', description: 'Empresa mediana con presencia establecida' },
    { value: CompanySize.LARGE, label: 'Grande (201-1000 empleados)', description: 'Empresa grande con múltiples departamentos' },
    { value: CompanySize.ENTERPRISE, label: 'Corporación (1000+ empleados)', description: 'Corporación multinacional o gran empresa' }
  ];

  // Industry options
  industryOptions = [
    'Tecnología',
    'E-commerce',
    'Servicios Financieros',
    'Salud y Medicina',
    'Educación',
    'Marketing y Publicidad',
    'Consultoría',
    'Inmobiliaria',
    'Manufactura',
    'Retail',
    'Entretenimiento',
    'Alimentaria',
    'Automotriz',
    'Energía',
    'Turismo y Hospitalidad',
    'Construcción',
    'Telecomunicaciones',
    'Agricultura',
    'Logística y Transporte',
    'Seguros',
    'Medios de Comunicación',
    'ONGs y Sin Fines de Lucro',
    'Gobierno',
    'Otra'
  ];

  // Countries/locations for demo
  locationOptions = [
    'Argentina',
    'Chile',
    'Colombia',
    'México',
    'Perú',
    'España',
    'Estados Unidos',
    'Canadá',
    'Brasil',
    'Uruguay',
    'Costa Rica',
    'Panamá',
    'Ecuador',
    'Venezuela',
    'Bolivia',
    'Paraguay',
    'Guatemala',
    'Honduras',
    'El Salvador',
    'Nicaragua',
    'República Dominicana',
    'Puerto Rico',
    'Otro'
  ];

  constructor() {
    addIcons({ businessOutline, checkmarkOutline, checkmarkCircleOutline, globeOutline, locationOutline, phonePortraitOutline, documentTextOutline, mailOutline, peopleOutline, arrowForwardOutline, arrowBackOutline, cameraOutline });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.checkExistingProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async checkExistingProfile(): Promise<void> {
    try {
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Check if profile already exists
      const profileResponse = await this.userService.getClientProfile(currentUser.uid);
      if (profileResponse.success && profileResponse.data) {
        // Profile exists, redirect to dashboard
        this.router.navigate(['/dashboard/client']);
        return;
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Error checking existing profile:', error);
      this.isLoading = false;
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      // Step 1: Company Information
      companyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      industry: ['', Validators.required],
      companySize: ['', Validators.required],
      website: ['', [Validators.pattern(/^https?:\/\/.+\..+/)]],

      // Step 2: Contact & Location
      location: ['', Validators.required],
      phone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],

      // Step 3: Company Description & Goals
      description: ['', [Validators.required, Validators.minLength(100), Validators.maxLength(1000)]],
      projectTypes: [''],
      budgetRange: [''],
      hiringFrequency: ['']
    });
  }

  // Navigation methods
  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
    } else {
      this.markStepAsTouched(this.currentStep);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.isStepValid(this.currentStep)) {
      this.currentStep = step;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.profileForm.get('companyName')?.valid &&
          this.profileForm.get('industry')?.valid &&
          this.profileForm.get('companySize')?.valid);
      case 2:
        return !!this.profileForm.get('location')?.valid;
      case 3:
        return !!this.profileForm.get('description')?.valid;
      default:
        return false;
    }
  }

  private markStepAsTouched(step: number): void {
    switch (step) {
      case 1:
        this.profileForm.get('companyName')?.markAsTouched();
        this.profileForm.get('industry')?.markAsTouched();
        this.profileForm.get('companySize')?.markAsTouched();
        this.profileForm.get('website')?.markAsTouched();
        break;
      case 2:
        this.profileForm.get('location')?.markAsTouched();
        this.profileForm.get('phone')?.markAsTouched();
        break;
      case 3:
        this.profileForm.get('description')?.markAsTouched();
        break;
    }
  }

  // Form submission
  async onSubmit(): Promise<void> {
    if (!this.profileForm.valid) {
      this.markStepAsTouched(this.currentStep);
      this.toastMessage = 'Por favor, completa todos los campos requeridos';
      this.showErrorToast = true;
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.profileForm.value;
      const currentUser = this.authService.currentUser;

      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const profileData: Omit<ClientProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'averageRating' | 'totalProjects' | 'totalSpent' | 'verificationStatus'> = {
        companyName: formValue.companyName,
        industry: formValue.industry,
        companySize: formValue.companySize,
        website: formValue.website || undefined,
        description: formValue.description,
        location: formValue.location,
        phone: formValue.phone || undefined
      };

      const response: ApiResponse<ClientProfile> = await this.userService.createClientProfile(profileData);

      if (response.success && response.data) {
        this.toastMessage = '¡Perfil creado exitosamente! Redirigiendo...';
        this.showSuccessToast = true;

        // Navigate to dashboard after a short delay
        setTimeout(() => {
          this.router.navigate(['/dashboard/client']);
        }, 2000);
      } else {
        throw new Error(response.error || 'Error al crear el perfil');
      }
    } catch (error: any) {
      console.error('Error creating profile:', error);
      this.toastMessage = error.message || 'Error al crear el perfil';
      this.showErrorToast = true;
    } finally {
      this.isSubmitting = false;
    }
  }

  // Exit confirmation
  onExit(): void {
    if (this.profileForm.dirty) {
      this.showExitAlert = true;
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  confirmExit(): void {
    this.router.navigate(['/dashboard']);
  }

  // Utility methods
  getStepTitle(step: number): string {
    switch (step) {
      case 1: return 'Información de la Empresa';
      case 2: return 'Contacto y Ubicación';
      case 3: return 'Descripción y Objetivos';
      default: return '';
    }
  }

  getStepIcon(step: number): string {
    switch (step) {
      case 1: return 'business-outline';
      case 2: return 'location-outline';
      case 3: return 'document-text-outline';
      default: return '';
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getCompletionPercentage(): number {
    const requiredFields = [
      'companyName',
      'industry',
      'companySize',
      'location',
      'description'
    ];

    const optionalFields = [
      'website',
      'phone'
    ];

    let completed = 0;

    // Count required fields
    requiredFields.forEach(field => {
      if (this.profileForm.get(field)?.valid) {
        completed++;
      }
    });

    // Count optional fields (half weight)
    optionalFields.forEach(field => {
      if (this.profileForm.get(field)?.value && this.profileForm.get(field)?.valid) {
        completed += 0.5;
      }
    });

    const totalFields = requiredFields.length + (optionalFields.length * 0.5);
    return Math.round((completed / totalFields) * 100);
  }

  // Helper methods
  getCompanySizeLabel(size: CompanySize): string {
    const option = this.companySizeOptions.find(opt => opt.value === size);
    return option?.label || '';
  }

  getCompanySizeDescription(size: CompanySize): string {
    const option = this.companySizeOptions.find(opt => opt.value === size);
    return option?.description || '';
  }
}

