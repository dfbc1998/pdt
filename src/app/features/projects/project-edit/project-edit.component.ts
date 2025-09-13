// src/app/features/projects/project-edit/project-edit.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonChip,
  IonCheckbox,
  IonDatetime,
  IonPopover,
  IonList,
  IonItemDivider,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonAlert,
  ToastController,
  IonNote,
  IonText
} from '@ionic/angular/standalone';
import {
  add,
  remove,
  save,
  close,
  document,
  calendar
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import {
  Project,
  ProjectCategory,
  BudgetType,
  TimelineType,
  ProjectVisibility,
  ExperienceLevel,
  Milestone,
  MilestoneStatus,
  ProjectStatus
} from '../../../core/interfaces';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonChip,
    IonCheckbox,
    IonDatetime,
    IonPopover,
    IonList,
    IonItemDivider,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonAlert,
    HeaderComponent,
    IonNote,
    IonText
  ],
  templateUrl: './project-edit.component.html'
})
export class ProjectEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);

  project: Project | null = null;
  projectForm!: FormGroup;
  isLoading = true;
  isSaving = false;

  // Enum options for selects
  categories = Object.values(ProjectCategory);
  budgetTypes = Object.values(BudgetType);
  timelineTypes = Object.values(TimelineType);
  visibilityOptions = Object.values(ProjectVisibility);
  experienceLevels = Object.values(ExperienceLevel);

  // Skills management
  availableSkills = [
    'JavaScript', 'TypeScript', 'Angular', 'React', 'Vue.js', 'Node.js',
    'Python', 'Django', 'Flask', 'Java', 'Spring', 'PHP', 'Laravel',
    'C#', '.NET', 'Ruby', 'Rails', 'Swift', 'Kotlin', 'Flutter',
    'iOS', 'Android', 'React Native', 'HTML', 'CSS', 'SASS', 'SCSS',
    'Bootstrap', 'Tailwind CSS', 'MySQL', 'PostgreSQL', 'MongoDB',
    'Firebase', 'AWS', 'Docker', 'Git', 'GraphQL', 'REST API'
  ];

  newSkill = '';

  constructor() {
    addIcons({ add, remove, save, close, document, calendar });
    this.initializeForm();
  }

  ngOnInit() {
    this.loadProject();
  }

  private initializeForm() {
    this.projectForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(10)]],
      description: ['', [Validators.required, Validators.minLength(50)]],
      category: ['', Validators.required],
      subcategory: [''],
      budgetType: ['', Validators.required],
      budgetAmount: [null],
      budgetMinAmount: [null],
      budgetMaxAmount: [null],
      currency: ['CLP', Validators.required],
      timelineType: ['', Validators.required],
      timelineDuration: [null],
      timelineStartDate: [null],
      timelineEndDate: [null],
      timelineIsFlexible: [false],
      requiredSkills: [[]],
      preferredExperience: ['', Validators.required],
      visibility: [ProjectVisibility.PUBLIC, Validators.required],
      applicationDeadline: [null],
      milestones: this.formBuilder.array([])
    });

    // Add validators based on budget type
    this.projectForm.get('budgetType')?.valueChanges.subscribe(type => {
      this.updateBudgetValidators(type);
    });

    // Add validators based on timeline type
    this.projectForm.get('timelineType')?.valueChanges.subscribe(type => {
      this.updateTimelineValidators(type);
    });
  }

  async loadProject() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) {
      this.router.navigate(['/projects']);
      return;
    }

    this.isLoading = true;
    try {
      const response = await this.projectService.getProjectById(projectId);
      if (response.success && response.data) {
        this.project = response.data;

        // Check if user can edit this project
        const currentUser = this.authService.currentUser;
        if (!currentUser || currentUser.uid !== this.project.clientId) {
          await this.showErrorToast('No tienes permisos para editar este proyecto');
          this.router.navigate(['/projects', projectId]);
          return;
        }

        // Check if project can be edited (only drafts)
        if (this.project.status !== ProjectStatus.DRAFT) {
          await this.showErrorToast('Solo se pueden editar proyectos en estado borrador');
          this.router.navigate(['/projects', projectId]);
          return;
        }

        this.populateForm();
      } else {
        await this.showErrorToast('Proyecto no encontrado');
        this.router.navigate(['/projects']);
      }
    } catch (error) {
      await this.showErrorToast('Error al cargar el proyecto');
      this.router.navigate(['/projects']);
    } finally {
      this.isLoading = false;
    }
  }

  private populateForm() {
    if (!this.project) return;

    const { budget, timeline } = this.project;

    this.projectForm.patchValue({
      title: this.project.title,
      description: this.project.description,
      category: this.project.category,
      subcategory: this.project.subcategory,
      budgetType: budget.type,
      budgetAmount: budget.amount,
      budgetMinAmount: budget.minAmount,
      budgetMaxAmount: budget.maxAmount,
      currency: budget.currency,
      timelineType: timeline.type,
      timelineDuration: timeline.duration,
      timelineStartDate: timeline.startDate?.toISOString(),
      timelineEndDate: timeline.endDate?.toISOString(),
      timelineIsFlexible: timeline.isFlexible,
      requiredSkills: this.project.requiredSkills || [],
      preferredExperience: this.project.preferredExperience,
      visibility: this.project.visibility,
      applicationDeadline: this.project.applicationDeadline?.toISOString()
    });

    // Populate milestones
    const milestonesArray = this.projectForm.get('milestones') as FormArray;
    this.project.milestones?.forEach(milestone => {
      milestonesArray.push(this.createMilestoneGroup(milestone));
    });
  }

  private createMilestoneGroup(milestone?: Milestone) {
    return this.formBuilder.group({
      id: [milestone?.id || ''],
      title: [milestone?.title || '', Validators.required],
      description: [milestone?.description || '', Validators.required],
      amount: [milestone?.amount || 0, [Validators.required, Validators.min(1)]],
      dueDate: [milestone?.dueDate?.toISOString() || null],
      deliverables: [milestone?.deliverables || []],
      order: [milestone?.order || 1]
    });
  }

  private updateBudgetValidators(type: BudgetType) {
    const amountControl = this.projectForm.get('budgetAmount');
    const minAmountControl = this.projectForm.get('budgetMinAmount');
    const maxAmountControl = this.projectForm.get('budgetMaxAmount');

    // Clear existing validators
    amountControl?.clearValidators();
    minAmountControl?.clearValidators();
    maxAmountControl?.clearValidators();

    switch (type) {
      case BudgetType.FIXED:
      case BudgetType.HOURLY:
        amountControl?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case BudgetType.RANGE:
        minAmountControl?.setValidators([Validators.required, Validators.min(1)]);
        maxAmountControl?.setValidators([Validators.required, Validators.min(1)]);
        break;
    }

    amountControl?.updateValueAndValidity();
    minAmountControl?.updateValueAndValidity();
    maxAmountControl?.updateValueAndValidity();
  }

  private updateTimelineValidators(type: TimelineType) {
    const durationControl = this.projectForm.get('timelineDuration');
    const startDateControl = this.projectForm.get('timelineStartDate');
    const endDateControl = this.projectForm.get('timelineEndDate');

    // Clear existing validators
    durationControl?.clearValidators();
    startDateControl?.clearValidators();
    endDateControl?.clearValidators();

    if (type !== TimelineType.FLEXIBLE) {
      durationControl?.setValidators([Validators.required, Validators.min(1)]);
    }

    durationControl?.updateValueAndValidity();
    startDateControl?.updateValueAndValidity();
    endDateControl?.updateValueAndValidity();
  }

  get milestonesArray() {
    return this.projectForm.get('milestones') as FormArray;
  }

  addMilestone() {
    this.milestonesArray.push(this.createMilestoneGroup());
  }

  removeMilestone(index: number) {
    this.milestonesArray.removeAt(index);
  }

  addSkill() {
    if (this.newSkill.trim()) {
      const currentSkills = this.projectForm.get('requiredSkills')?.value || [];
      if (!currentSkills.includes(this.newSkill.trim())) {
        currentSkills.push(this.newSkill.trim());
        this.projectForm.patchValue({ requiredSkills: currentSkills });
      }
      this.newSkill = '';
    }
  }

  removeSkill(skill: string) {
    const currentSkills = this.projectForm.get('requiredSkills')?.value || [];
    const updatedSkills = currentSkills.filter((s: string) => s !== skill);
    this.projectForm.patchValue({ requiredSkills: updatedSkills });
  }

  onSkillInputChange(event: any) {
    this.newSkill = event.detail.value || '';
  }

  addSkillFromAvailable(skill: string) {
    const currentSkills = this.projectForm.get('requiredSkills')?.value || [];
    if (!currentSkills.includes(skill)) {
      currentSkills.push(skill);
      this.projectForm.patchValue({ requiredSkills: currentSkills });
    }
  }

  async onSubmit() {
    if (this.projectForm.invalid || !this.project) {
      this.markFormGroupTouched(this.projectForm);
      await this.showErrorToast('Por favor corrige los errores en el formulario');
      return;
    }

    this.isSaving = true;
    try {
      const formValue = this.projectForm.value;
      const updatedProject: Partial<Project> = {
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        subcategory: formValue.subcategory,
        budget: {
          type: formValue.budgetType,
          amount: formValue.budgetAmount,
          minAmount: formValue.budgetMinAmount,
          maxAmount: formValue.budgetMaxAmount,
          currency: formValue.currency
        },
        timeline: {
          type: formValue.timelineType,
          duration: formValue.timelineDuration,
          startDate: formValue.timelineStartDate ? new Date(formValue.timelineStartDate) : undefined,
          endDate: formValue.timelineEndDate ? new Date(formValue.timelineEndDate) : undefined,
          isFlexible: formValue.timelineIsFlexible
        },
        requiredSkills: formValue.requiredSkills,
        preferredExperience: formValue.preferredExperience,
        visibility: formValue.visibility,
        applicationDeadline: formValue.applicationDeadline ? new Date(formValue.applicationDeadline) : undefined,
        milestones: formValue.milestones.map((m: any, index: number) => ({
          ...m,
          id: m.id || `milestone-${index}`,
          dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
          order: index + 1,
          status: MilestoneStatus.PENDING
        }))
      };

      const response = await this.projectService.updateProject(this.project.id, updatedProject);

      if (response.success) {
        await this.showSuccessToast('Proyecto actualizado exitosamente');
        this.router.navigate(['/projects', this.project.id]);
      } else {
        await this.showErrorToast(response.error || 'Error al actualizar el proyecto');
      }
    } catch (error) {
      await this.showErrorToast('Error al actualizar el proyecto');
    } finally {
      this.isSaving = false;
    }
  }

  cancel() {
    this.router.navigate(['/projects', this.project?.id]);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((c: any) => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          } else {
            c.markAsTouched({ onlySelf: true });
          }
        });
      }
    });
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }
}