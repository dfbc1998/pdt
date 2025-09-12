import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Ionic Components
import {
  IonContent,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonSpinner,
  NavController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  addOutline,
  closeOutline,
  chevronBackOutline,
  chevronForwardOutline,
  linkOutline,
  trashOutline
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import {
  User,
  FreelancerProfile,
  ExperienceLevel,
  Availability
} from '../../../core/interfaces';

interface PortfolioLink {
  url: string;
}

@Component({
  selector: 'app-freelancer-profile-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonContent,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonSpinner,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './freelancer-profile-setup.component.html',
  styleUrls: ['./freelancer-profile-setup.component.scss']
})
export class FreelancerProfileSetupComponent implements OnInit, OnDestroy {
  @ViewChild('skillInput', { static: false }) skillInput!: ElementRef<HTMLIonInputElement>;

  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private navController = inject(NavController);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  // Component State
  currentUser: User | null = null;
  isLoading = true;
  isSubmitting = false;
  currentStep = 1;
  totalSteps = 4;

  // Form
  profileForm!: FormGroup;

  // Skills Management
  selectedSkills: string[] = [];
  suggestedSkills = [
    'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js',
    'Node.js', 'Python', 'Java', 'C#', 'PHP',
    'HTML', 'CSS', 'SASS', 'Tailwind CSS', 'Bootstrap',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase',
    'AWS', 'Azure', 'Docker', 'Git', 'GraphQL',
    'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop',
    'Content Writing', 'SEO', 'Digital Marketing',
    'Data Analysis', 'Machine Learning', 'AI'
  ];

  // Portfolio Links
  portfolioLinks: PortfolioLink[] = [{ url: '' }];

  constructor() {
    this.registerIcons();
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private registerIcons(): void {
    addIcons({
      checkmarkOutline,
      addOutline,
      closeOutline,
      chevronBackOutline,
      chevronForwardOutline,
      linkOutline,
      trashOutline
    });
  }

  private initializeComponent(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.checkExistingProfile();
        }
      });
  }

  private async checkExistingProfile(): Promise<void> {
    try {
      if (!this.currentUser) return;

      const response = await this.userService.getFreelancerProfile(this.currentUser.uid);

      if (response.success && response.data) {
        // User already has a profile, redirect
        await this.showInfoToast('Ya tienes un perfil configurado');
        await this.navController.navigateRoot('/dashboard');
        return;
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Error checking existing profile:', error);
      this.isLoading = false;
    }
  }

  private initializeForm(): void {
    this.profileForm = this.formBuilder.group({
      // Step 1: Basic Information
      professionalTitle: ['', [Validators.required, Validators.minLength(10)]],
      yearsExperience: ['', Validators.required],
      availability: ['', Validators.required],
      bio: ['', [Validators.required, Validators.minLength(100), Validators.maxLength(500)]],

      // Step 2: Skills & Rates
      skills: [''], // This will be managed separately
      hourlyRateMin: ['', [Validators.required, Validators.min(5), Validators.max(200)]],
      hourlyRateMax: ['', [Validators.required, Validators.min(10), Validators.max(500)]],
      languages: [['es']], // Default to Spanish

      // Step 3: Portfolio & Education
      education: [''],
      location: ['', Validators.required]
    }, { validators: this.rateRangeValidator });
  }

  // Custom validator para rango de tarifas
  private rateRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const form = control as FormGroup;
    const min = form.get('hourlyRateMin')?.value;
    const max = form.get('hourlyRateMax')?.value;

    if (min && max && Number(min) >= Number(max)) {
      return { rateRangeInvalid: true };
    }
    return null;
  };

  // Navegación entre pasos
  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
    }
  }

  previousStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.profileForm.get('professionalTitle')?.valid &&
          this.profileForm.get('yearsExperience')?.valid &&
          this.profileForm.get('availability')?.valid &&
          this.profileForm.get('bio')?.valid);
      case 2:
        return !!(this.selectedSkills.length >= 3 &&
          this.profileForm.get('hourlyRateMin')?.valid &&
          this.profileForm.get('hourlyRateMax')?.valid &&
          !this.profileForm.hasError('rateRangeInvalid'));
      case 3:
        return !!this.profileForm.get('location')?.valid;
      case 4:
        return !!(this.profileForm.valid && this.selectedSkills.length >= 3);
      default:
        return false;
    }
  }

  getProgressPercentage(): number {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }

  // Gestión de habilidades
  addSkill(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const inputValue = String(this.skillInput?.nativeElement?.value || '').trim();
    if (!inputValue || this.selectedSkills.includes(inputValue)) {
      return;
    }

    if (this.selectedSkills.length < 15) {
      this.selectedSkills.push(inputValue);
      this.profileForm.get('skills')?.markAsTouched();

      if (this.skillInput?.nativeElement) {
        this.skillInput.nativeElement.value = '';
      }
    }
  }

  addSuggestedSkill(skill: string): void {
    if (!this.selectedSkills.includes(skill) && this.selectedSkills.length < 15) {
      this.selectedSkills.push(skill);
      this.profileForm.get('skills')?.markAsTouched();
    }
  }

  removeSkill(skill: string): void {
    this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
    this.profileForm.get('skills')?.markAsTouched();
  }

  trackBySkill(index: number, skill: string): string {
    return skill;
  }

  // Gestión de enlaces de portafolio
  addPortfolioLink(): void {
    if (this.portfolioLinks.length < 5) {
      this.portfolioLinks.push({ url: '' });
    }
  }

  removePortfolioLink(index: number): void {
    if (this.portfolioLinks.length > 1) {
      this.portfolioLinks.splice(index, 1);
    }
  }

  // Helpers de validación de formulario
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helpers de display
  getExperienceLabel(value: string): string {
    const labels: { [key: string]: string } = {
      'junior': 'Junior (0-2 años)',
      'intermediate': 'Intermedio (3-5 años)',
      'senior': 'Senior (6-10 años)',
      'expert': 'Expert (10+ años)'
    };
    return labels[value] || value;
  }

  getAvailabilityLabel(value: string): string {
    const labels: { [key: string]: string } = {
      'full_time': 'Tiempo Completo',
      'part_time': 'Medio Tiempo',
      'project_based': 'Por Proyectos',
      'weekends': 'Fines de Semana'
    };
    return labels[value] || value;
  }

  // Envío del formulario
  async onSubmit(): Promise<void> {
    if (!this.profileForm.valid || this.selectedSkills.length < 3) {
      await this.showErrorToast('Por favor completa todos los campos requeridos');
      return;
    }

    this.isSubmitting = true;

    try {
      await this.createFreelancerProfile();
      await this.showSuccessToast('¡Perfil creado exitosamente!');
      await this.navController.navigateRoot('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      await this.showErrorToast('Error al crear el perfil. Intenta nuevamente.');
    } finally {
      this.isSubmitting = false;
    }
  }

  private async createFreelancerProfile(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Usuario no encontrado');
    }

    // Filtrar enlaces vacíos de portafolio
    const validPortfolioLinks = this.portfolioLinks
      .map(link => link.url.trim())
      .filter(url => url.length > 0);

    // Mapear nivel de experiencia del formulario a enum
    const experienceMapping: { [key: string]: ExperienceLevel } = {
      'junior': ExperienceLevel.ENTRY,
      'intermediate': ExperienceLevel.INTERMEDIATE,
      'senior': ExperienceLevel.EXPERT,
      'expert': ExperienceLevel.EXPERT
    };

    // Mapear disponibilidad del formulario a enum
    const availabilityMapping: { [key: string]: Availability } = {
      'full_time': Availability.FULL_TIME,
      'part_time': Availability.PART_TIME,
      'project_based': Availability.CONTRACT,
      'weekends': Availability.PART_TIME
    };

    const profileData: Omit<FreelancerProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: this.currentUser.uid,
      firstName: this.currentUser.displayName?.split(' ')[0] || '',
      lastName: this.currentUser.displayName?.split(' ').slice(1).join(' ') || '',
      title: this.profileForm.get('professionalTitle')?.value,
      bio: this.profileForm.get('bio')?.value,
      skills: this.selectedSkills,
      experience: experienceMapping[this.profileForm.get('yearsExperience')?.value] || ExperienceLevel.ENTRY,
      hourlyRate: Number(this.profileForm.get('hourlyRateMin')?.value),
      availability: availabilityMapping[this.profileForm.get('availability')?.value] || Availability.FULL_TIME,
      languages: this.mapLanguages(this.profileForm.get('languages')?.value || []),
      education: this.mapEducation(this.profileForm.get('education')?.value),
      certifications: [],
      portfolio: this.mapPortfolio(validPortfolioLinks),
      location: this.profileForm.get('location')?.value,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      averageRating: 0,
      totalEarnings: 0,
      completedProjects: 0,
      successRate: 100,
      responseTime: 24,
      verificationStatus: 'pending' as any
    };

    const response = await this.userService.createFreelancerProfile(profileData);

    if (!response.success) {
      throw new Error(response.error || 'Error al crear el perfil');
    }
  }

  private mapLanguages(languageValues: string[]): any[] {
    const languageNames: { [key: string]: string } = {
      'es': 'Español',
      'en': 'Inglés',
      'pt': 'Portugués',
      'fr': 'Francés',
      'de': 'Alemán',
      'it': 'Italiano',
      'zh': 'Chino',
      'ja': 'Japonés'
    };

    return languageValues.map(code => ({
      name: languageNames[code] || code,
      proficiency: code === 'es' ? 'native' : 'conversational'
    }));
  }

  private mapEducation(educationLevel: string): any[] {
    if (!educationLevel) return [];

    const educationLabels: { [key: string]: string } = {
      'high_school': 'Educación Secundaria',
      'vocational': 'Educación Técnica',
      'associate': 'Técnico Superior',
      'bachelor': 'Licenciatura',
      'master': 'Maestría',
      'phd': 'Doctorado',
      'bootcamp': 'Bootcamp/Curso Intensivo',
      'self_taught': 'Autodidacta'
    };

    return [{
      institution: 'Por especificar',
      degree: educationLabels[educationLevel] || educationLevel,
      fieldOfStudy: 'Por especificar',
      startYear: new Date().getFullYear() - 4,
      description: 'Información educativa básica'
    }];
  }

  private mapPortfolio(urls: string[]): any[] {
    return urls.map((url, index) => ({
      id: `portfolio-${index}`,
      title: `Proyecto ${index + 1}`,
      description: 'Descripción del proyecto pendiente',
      projectUrl: url,
      technologies: [],
      category: 'general',
      completionDate: new Date()
    }));
  }

  // Mensajes Toast
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private async showInfoToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'primary'
    });
    await toast.present();
  }
}