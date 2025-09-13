// src/app/features/projects/project-create/project-create.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
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
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonChip,
  IonAlert,
  IonToast,
  IonDatetime,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  arrowBackOutline,
  addOutline,
  closeOutline,
  documentTextOutline,
  calendarOutline,
  cashOutline,
  peopleOutline,
  checkmarkCircleOutline,
  flagOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Project,
  ProjectCategory,
  BudgetType,
  TimelineType,
  ExperienceLevel,
  ProjectVisibility,
  ProjectStatus,
  ApiResponse
} from '../../../core/interfaces';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-project-create',
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
    IonCheckbox,
    IonGrid,
    IonRow,
    IonCol,
    IonProgressBar,
    IonChip,
    IonAlert,
    IonToast,
    IonDatetime,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonSpinner,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './project-create.component.html',
  styleUrls: ['./project-create.component.scss']
})
export class ProjectCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Form and state management
  projectForm!: FormGroup;
  currentStep = 1;
  totalSteps = 4;
  isSubmitting = false;
  showSkillModal = false;
  showMilestoneModal = false;

  // Alerts and toasts
  showExitAlert = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';

  // Alert buttons configuration
  alertButtons = [
    {
      text: 'Cancelar',
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

  // Data for selects
  categories = [
    { value: ProjectCategory.WEB_DEVELOPMENT, label: 'Desarrollo Web' },
    { value: ProjectCategory.MOBILE_DEVELOPMENT, label: 'Desarrollo Móvil' },
    { value: ProjectCategory.DESIGN, label: 'Diseño' },
    { value: ProjectCategory.WRITING, label: 'Redacción' },
    { value: ProjectCategory.MARKETING, label: 'Marketing' },
    { value: ProjectCategory.DATA_SCIENCE, label: 'Ciencia de Datos' },
    { value: ProjectCategory.BUSINESS, label: 'Negocios' },
    { value: ProjectCategory.OTHER, label: 'Otro' }
  ];

  subcategories: { [key: string]: string[] } = {
    [ProjectCategory.WEB_DEVELOPMENT]: ['Frontend', 'Backend', 'Full Stack', 'E-commerce', 'CMS'],
    [ProjectCategory.MOBILE_DEVELOPMENT]: ['iOS', 'Android', 'React Native', 'Flutter', 'Ionic'],
    [ProjectCategory.DESIGN]: ['UI/UX', 'Logo', 'Branding', 'Web Design', 'Print Design'],
    [ProjectCategory.WRITING]: ['Blog Posts', 'Copywriting', 'Technical Writing', 'Creative Writing'],
    [ProjectCategory.MARKETING]: ['SEO', 'Social Media', 'Email Marketing', 'Content Marketing'],
    [ProjectCategory.DATA_SCIENCE]: ['Data Analysis', 'Machine Learning', 'Data Visualization'],
    [ProjectCategory.BUSINESS]: ['Business Plan', 'Market Research', 'Strategy Consulting'],
    [ProjectCategory.OTHER]: ['Otros servicios']
  };

  budgetTypes = [
    { value: BudgetType.FIXED, label: 'Precio Fijo', description: 'Un monto fijo para todo el proyecto' },
    { value: BudgetType.HOURLY, label: 'Por Hora', description: 'Pago basado en horas trabajadas' },
    { value: BudgetType.RANGE, label: 'Rango de Precio', description: 'Un rango de presupuesto estimado' }
  ];

  timelineTypes = [
    { value: TimelineType.DAYS, label: 'Días' },
    { value: TimelineType.WEEKS, label: 'Semanas' },
    { value: TimelineType.MONTHS, label: 'Meses' }
  ];

  experienceLevels = [
    { value: ExperienceLevel.ENTRY, label: 'Principiante', description: 'Freelancers nuevos con ganas de aprender' },
    { value: ExperienceLevel.INTERMEDIATE, label: 'Intermedio', description: 'Freelancers con experiencia sólida' },
    { value: ExperienceLevel.EXPERT, label: 'Experto', description: 'Freelancers altamente experimentados' }
  ];

  visibilityOptions = [
    { value: ProjectVisibility.PUBLIC, label: 'Público', description: 'Visible para todos los freelancers' },
    { value: ProjectVisibility.PRIVATE, label: 'Privado', description: 'Solo visible para freelancers invitados' },
    { value: ProjectVisibility.INVITE_ONLY, label: 'Solo Invitación', description: 'Solo por invitación directa' }
  ];

  // Available skills (could be loaded from a service)
  availableSkills = [
    'JavaScript', 'TypeScript', 'Angular', 'React', 'Vue.js', 'Node.js',
    'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
    'HTML5', 'CSS3', 'Sass', 'Tailwind CSS', 'Bootstrap',
    'MongoDB', 'MySQL', 'PostgreSQL', 'Firebase', 'AWS', 'Docker',
    'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
    'SEO', 'Google Analytics', 'Facebook Ads', 'Google Ads'
  ];

  // Selected skills
  selectedSkills: string[] = [];
  skillSearch = '';

  constructor() {
    addIcons({
      arrowForwardOutline,
      arrowBackOutline,
      addOutline,
      closeOutline,
      documentTextOutline,
      calendarOutline,
      cashOutline,
      peopleOutline,
      checkmarkCircleOutline,
      flagOutline
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.projectForm = this.fb.group({
      // Step 1: Basic Information
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(2000)]],
      category: ['', Validators.required],
      subcategory: ['', Validators.required],

      // Step 2: Budget & Timeline
      budgetType: ['', Validators.required],
      budgetAmount: [null],
      budgetMinAmount: [null],
      budgetMaxAmount: [null],
      currency: ['USD', Validators.required],
      timelineType: ['', Validators.required],
      timelineDuration: [null, [Validators.required, Validators.min(1)]],
      applicationDeadline: [''],
      isFlexibleTimeline: [false],

      // Step 3: Requirements
      requiredSkills: [[]],
      preferredExperience: ['', Validators.required],
      additionalRequirements: [''],

      // Step 4: Project Settings
      visibility: [ProjectVisibility.PUBLIC, Validators.required],
      milestones: this.fb.array([]),
      estimatedFreelancers: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });

    // Watch for category changes to update subcategories
    this.projectForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(category => {
        this.projectForm.get('subcategory')?.setValue('');
      });

    // Watch for budget type changes
    this.projectForm.get('budgetType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(budgetType => {
        this.updateBudgetValidators(budgetType);
      });
  }

  private updateBudgetValidators(budgetType: BudgetType): void {
    const budgetAmount = this.projectForm.get('budgetAmount');
    const budgetMinAmount = this.projectForm.get('budgetMinAmount');
    const budgetMaxAmount = this.projectForm.get('budgetMaxAmount');

    // Clear all validators first
    budgetAmount?.clearValidators();
    budgetMinAmount?.clearValidators();
    budgetMaxAmount?.clearValidators();

    // Set validators based on budget type
    switch (budgetType) {
      case BudgetType.FIXED:
      case BudgetType.HOURLY:
        budgetAmount?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case BudgetType.RANGE:
        budgetMinAmount?.setValidators([Validators.required, Validators.min(1)]);
        budgetMaxAmount?.setValidators([Validators.required, Validators.min(1)]);
        break;
    }

    // Update validity
    budgetAmount?.updateValueAndValidity();
    budgetMinAmount?.updateValueAndValidity();
    budgetMaxAmount?.updateValueAndValidity();
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
    // Allow navigation to previous steps or current step
    if (step <= this.currentStep || this.isStepValid(this.currentStep)) {
      this.currentStep = step;
    }
  }

  // Make isStepValid public for template access
  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.projectForm.get('title')?.valid &&
          this.projectForm.get('description')?.valid &&
          this.projectForm.get('category')?.valid &&
          this.projectForm.get('subcategory')?.valid);
      case 2:
        return !!(this.projectForm.get('budgetType')?.valid &&
          this.projectForm.get('timelineType')?.valid &&
          this.projectForm.get('timelineDuration')?.valid &&
          this.isBudgetValid());
      case 3:
        return !!(this.projectForm.get('preferredExperience')?.valid &&
          this.selectedSkills.length > 0);
      case 4:
        return !!this.projectForm.get('visibility')?.valid;
      default:
        return false;
    }
  }

  private isBudgetValid(): boolean {
    const budgetType = this.projectForm.get('budgetType')?.value;
    switch (budgetType) {
      case BudgetType.FIXED:
      case BudgetType.HOURLY:
        return !!this.projectForm.get('budgetAmount')?.valid;
      case BudgetType.RANGE:
        const minValid = !!this.projectForm.get('budgetMinAmount')?.valid;
        const maxValid = !!this.projectForm.get('budgetMaxAmount')?.valid;
        const minAmount = this.projectForm.get('budgetMinAmount')?.value;
        const maxAmount = this.projectForm.get('budgetMaxAmount')?.value;
        return minValid && maxValid && minAmount < maxAmount;
      default:
        return false;
    }
  }

  private markStepAsTouched(step: number): void {
    switch (step) {
      case 1:
        this.projectForm.get('title')?.markAsTouched();
        this.projectForm.get('description')?.markAsTouched();
        this.projectForm.get('category')?.markAsTouched();
        this.projectForm.get('subcategory')?.markAsTouched();
        break;
      case 2:
        this.projectForm.get('budgetType')?.markAsTouched();
        this.projectForm.get('budgetAmount')?.markAsTouched();
        this.projectForm.get('budgetMinAmount')?.markAsTouched();
        this.projectForm.get('budgetMaxAmount')?.markAsTouched();
        this.projectForm.get('timelineType')?.markAsTouched();
        this.projectForm.get('timelineDuration')?.markAsTouched();
        break;
      case 3:
        this.projectForm.get('preferredExperience')?.markAsTouched();
        break;
      case 4:
        this.projectForm.get('visibility')?.markAsTouched();
        break;
    }
  }

  // Skills management
  openSkillModal(): void {
    this.showSkillModal = true;
    this.skillSearch = '';
  }

  closeSkillModal(): void {
    this.showSkillModal = false;
  }

  get filteredSkills(): string[] {
    return this.availableSkills.filter(skill =>
      skill.toLowerCase().includes(this.skillSearch.toLowerCase()) &&
      !this.selectedSkills.includes(skill)
    );
  }

  addSkill(skill: string): void {
    if (!this.selectedSkills.includes(skill)) {
      this.selectedSkills.push(skill);
      this.projectForm.get('requiredSkills')?.setValue(this.selectedSkills);
    }
  }

  removeSkill(skill: string): void {
    this.selectedSkills = this.selectedSkills.filter(s => s !== skill);
    this.projectForm.get('requiredSkills')?.setValue(this.selectedSkills);
  }

  // Milestones management
  get milestonesArray(): FormArray {
    return this.projectForm.get('milestones') as FormArray;
  }

  addMilestone(): void {
    const milestoneGroup = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      amount: [null, [Validators.required, Validators.min(1)]],
      dueDate: [''],
      deliverables: this.fb.array([this.fb.control('', Validators.required)])
    });

    this.milestonesArray.push(milestoneGroup);
  }

  removeMilestone(index: number): void {
    this.milestonesArray.removeAt(index);
  }

  getDeliverables(milestoneIndex: number): FormArray {
    return this.milestonesArray.at(milestoneIndex).get('deliverables') as FormArray;
  }

  addDeliverable(milestoneIndex: number): void {
    const deliverables = this.getDeliverables(milestoneIndex);
    deliverables.push(this.fb.control('', Validators.required));
  }

  removeDeliverable(milestoneIndex: number, deliverableIndex: number): void {
    const deliverables = this.getDeliverables(milestoneIndex);
    if (deliverables.length > 1) {
      deliverables.removeAt(deliverableIndex);
    }
  }

  // Form submission
  async onSubmit(): Promise<void> {
    if (!this.projectForm.valid || this.selectedSkills.length === 0) {
      this.markStepAsTouched(this.currentStep);
      this.toastMessage = 'Por favor, completa todos los campos requeridos';
      this.showErrorToast = true;
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.projectForm.value;
      const currentUser = this.authService.currentUser;

      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Build budget object based on type
      const budgetType = formValue.budgetType;
      let budget: any = {
        type: budgetType,
        currency: formValue.currency || 'USD'
      };

      // Only add the fields that are relevant for each budget type
      switch (budgetType) {
        case BudgetType.FIXED:
        case BudgetType.HOURLY:
          budget.amount = formValue.budgetAmount || 0;
          break;
        case BudgetType.RANGE:
          budget.minAmount = formValue.budgetMinAmount || 0;
          budget.maxAmount = formValue.budgetMaxAmount || 0;
          break;
      }

      // Build timeline object
      const timeline: any = {
        type: formValue.timelineType,
        isFlexible: formValue.isFlexibleTimeline || false
      };

      // Only add duration if it exists
      if (formValue.timelineDuration) {
        timeline.duration = formValue.timelineDuration;
      }

      // Process milestones to remove undefined values
      const milestones = (formValue.milestones || []).map((milestone: any) => {
        const processedMilestone: any = {
          title: milestone.title || '',
          description: milestone.description || '',
          deliverables: milestone.deliverables || []
        };

        // Only add amount if it exists and is valid
        if (milestone.amount && milestone.amount > 0) {
          processedMilestone.amount = milestone.amount;
        }

        // Only add dueDate if it exists
        if (milestone.dueDate) {
          processedMilestone.dueDate = new Date(milestone.dueDate);
        }

        return processedMilestone;
      });

      const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        clientId: currentUser.uid,
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        subcategory: formValue.subcategory,
        budget: budget,
        timeline: timeline,
        requiredSkills: this.selectedSkills,
        preferredExperience: formValue.preferredExperience,
        visibility: formValue.visibility,
        status: ProjectStatus.DRAFT,
        attachments: [],
        milestones: milestones,
        proposalCount: 0,
        viewCount: 0,
        isFeatured: false
      };

      // Only add applicationDeadline if it exists
      if (formValue.applicationDeadline) {
        projectData.applicationDeadline = new Date(formValue.applicationDeadline);
      }

      console.log('Project data being sent:', projectData); // Debug log

      const response: ApiResponse<Project> = await this.projectService.createProject(projectData);

      if (response.success && response.data) {
        this.toastMessage = '¡Proyecto creado exitosamente!';
        this.showSuccessToast = true;

        // Navigate to project detail after a short delay
        setTimeout(() => {
          this.router.navigate(['/projects', response.data!.id]);
        }, 2000);
      } else {
        throw new Error(response.error || 'Error al crear el proyecto');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      this.toastMessage = error.message || 'Error al crear el proyecto';
      this.showErrorToast = true;
    } finally {
      this.isSubmitting = false;
    }
  }

  // Save as draft
  async saveDraft(): Promise<void> {
    if (!this.projectForm.get('title')?.value) {
      this.toastMessage = 'El título es requerido para guardar como borrador';
      this.showErrorToast = true;
      return;
    }

    // Similar to onSubmit but save as draft
    // Implementation here...
  }

  // Exit confirmation
  onExit(): void {
    if (this.projectForm.dirty) {
      this.showExitAlert = true;
    } else {
      this.router.navigate(['/projects']);
    }
  }

  confirmExit(): void {
    this.router.navigate(['/projects']);
  }

  // Utility methods
  getStepTitle(step: number): string {
    switch (step) {
      case 1: return 'Información Básica';
      case 2: return 'Presupuesto y Cronograma';
      case 3: return 'Requisitos y Habilidades';
      case 4: return 'Configuración del Proyecto';
      default: return '';
    }
  }

  getStepIcon(step: number): string {
    switch (step) {
      case 1: return 'document-text-outline';
      case 2: return 'cash-outline';
      case 3: return 'people-outline';
      case 4: return 'checkmark-circle-outline';
      default: return '';
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  // Get current date for date inputs
  getCurrentDate(): string {
    return new Date().toISOString();
  }

  // Helper methods for template
  getCategoryLabel(categoryValue: string): string {
    const category = this.categories.find(c => c.value === categoryValue);
    return category?.label || 'No seleccionada';
  }

  getTimelineLabel(timelineValue: string): string {
    const timeline = this.timelineTypes.find(t => t.value === timelineValue);
    return timeline?.label?.toLowerCase() || '';
  }

  getExperienceLabel(experienceValue: string): string {
    const experience = this.experienceLevels.find(e => e.value === experienceValue);
    return experience?.label || 'No definida';
  }
}