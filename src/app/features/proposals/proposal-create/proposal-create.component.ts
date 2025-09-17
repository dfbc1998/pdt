// src/app/features/proposals/proposal-create/proposal-create.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Ionic Components
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
  IonNote,
  IonText,
  IonProgressBar,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  add,
  remove,
  save,
  close,
  document,
  calendar,
  cash,
  time,
  checkmark,
  arrowBack,
  attach,
  help,
  informationCircle,
  chevronForward,
  send
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { ProposalService } from '../../../core/services/proposal.service';
import {
  User,
  Project,
  Proposal,
  ProposalStatus,
  BudgetType,
  TimelineType,
  ProposedBudget,
  ProposedTimeline,
  ProposedMilestone,
  ProposalQuestion,
  ApiResponse
} from '../../../core/interfaces';

@Component({
  selector: 'app-proposal-create',
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
    IonNote,
    IonText,
    IonProgressBar,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './proposal-create.component.html',
  styleUrls: ['./proposal-create.component.scss']
})
export class ProposalCreateComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private proposalService = inject(ProposalService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  // Component State
  projectId = '';
  project: Project | null = null;
  currentUser: User | null = null;

  // Form State
  proposalForm!: FormGroup;
  currentStep = 1;
  totalSteps = 4;
  isLoading = true;
  isSubmitting = false;

  // UI State
  showExitAlert = false;
  showCoverLetterTips = false;

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

  // Form Data
  budgetTypes = [
    { value: BudgetType.FIXED, label: 'Precio Fijo', description: 'Un precio total fijo para todo el proyecto' },
    { value: BudgetType.HOURLY, label: 'Por Hora', description: 'Tarifa por hora trabajada' }
  ];

  timelineTypes = [
    { value: TimelineType.DAYS, label: 'Días' },
    { value: TimelineType.WEEKS, label: 'Semanas' },
    { value: TimelineType.MONTHS, label: 'Meses' }
  ];

  // Pre-defined questions that clients often ask
  commonQuestions = [
    "¿Has trabajado en proyectos similares anteriormente?",
    "¿Qué metodología de trabajo utilizas?",
    "¿Podrías proporcionar ejemplos de tu trabajo previo?",
    "¿Cómo manejas los cambios en los requerimientos?",
    "¿Cuál es tu disponibilidad para este proyecto?"
  ];

  constructor() {
    addIcons({
      add,
      remove,
      save,
      close,
      document,
      calendar,
      cash,
      time,
      checkmark,
      arrowBack,
      attach,
      help,
      informationCircle,
      chevronForward,
      send
    });
  }

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeComponent(): Promise<void> {
    try {
      // Get current user
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
          if (!user) {
            this.router.navigate(['/auth/login']);
          }
        });

      // Get project ID from route
      this.projectId = this.route.snapshot.paramMap.get('projectId') || '';

      if (!this.projectId) {
        await this.showErrorToast('ID de proyecto no válido');
        this.router.navigate(['/projects']);
        return;
      }

      // Load project details
      await this.loadProject();

      // Initialize form
      this.initializeForm();

    } catch (error) {
      console.error('Error initializing component:', error);
      await this.showErrorToast('Error al cargar el proyecto');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadProject(): Promise<void> {
    const response: ApiResponse<Project> = await this.projectService.getProjectById(this.projectId);

    if (response.success && response.data) {
      this.project = response.data;

      // Validate project is accepting proposals
      if (this.project.status !== 'published') {
        await this.showErrorToast('Este proyecto no está aceptando propuestas');
        this.router.navigate(['/projects']);
        return;
      }
    } else {
      await this.showErrorToast('Proyecto no encontrado');
      this.router.navigate(['/projects']);
    }
  }

  private initializeForm(): void {
    this.proposalForm = this.formBuilder.group({
      // Step 1: Cover Letter
      coverLetter: ['', [Validators.required, Validators.minLength(100), Validators.maxLength(2000)]],

      // Step 2: Budget
      budget: this.formBuilder.group({
        amount: [0, [Validators.required, Validators.min(1)]],
        type: [BudgetType.FIXED, Validators.required],
        currency: ['USD', Validators.required]
      }),

      // Step 3: Timeline
      timeline: this.formBuilder.group({
        duration: [0, [Validators.required, Validators.min(1)]],
        unit: [TimelineType.WEEKS, Validators.required],
        description: ['']
      }),

      // Step 4: Additional Details
      milestones: this.formBuilder.array([]),
      questions: this.formBuilder.array([])
    });

    // Add default milestone if project budget suggests it
    if (this.project && this.project.budget?.amount && this.project.budget.amount > 1000) {
      this.addMilestone();
    }
  }

  // Form Array Getters
  get milestonesArray(): FormArray {
    return this.proposalForm.get('milestones') as FormArray;
  }

  get questionsArray(): FormArray {
    return this.proposalForm.get('questions') as FormArray;
  }

  // Helper to get deliverables FormArray for a milestone
  getDeliverables(milestoneIndex: number): FormArray {
    const milestone = this.milestonesArray.at(milestoneIndex);
    return milestone.get('deliverables') as FormArray;
  }

  // Step Navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.isCurrentStepValid()) {
        this.currentStep++;
      } else {
        this.showErrorToast('Por favor completa todos los campos requeridos');
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    if (!this.proposalForm) return false;

    switch (this.currentStep) {
      case 1:
        const coverLetter = this.proposalForm.get('coverLetter');
        return coverLetter ? coverLetter.valid : false;
      case 2:
        const budget = this.proposalForm.get('budget');
        return budget ? budget.valid : false;
      case 3:
        const timeline = this.proposalForm.get('timeline');
        return timeline ? timeline.valid : false;
      case 4:
        return true; // Step 4 is optional
      default:
        return false;
    }
  }

  // Milestone Management
  addMilestone(): void {
    const milestoneGroup = this.formBuilder.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(1)]],
      duration: [1, [Validators.required, Validators.min(1)]],
      deliverables: this.formBuilder.array([
        this.formBuilder.control('', [Validators.required])
      ])
    });

    this.milestonesArray.push(milestoneGroup);
  }

  removeMilestone(index: number): void {
    this.milestonesArray.removeAt(index);
  }

  addDeliverable(milestoneIndex: number): void {
    const deliverables = this.getDeliverables(milestoneIndex);
    deliverables.push(this.formBuilder.control('', [Validators.required]));
  }

  removeDeliverable(milestoneIndex: number, deliverableIndex: number): void {
    const deliverables = this.getDeliverables(milestoneIndex);
    if (deliverables.length > 1) {
      deliverables.removeAt(deliverableIndex);
    }
  }

  // Question Management
  addQuestion(questionText: string = ''): void {
    const questionGroup = this.formBuilder.group({
      question: [questionText, [Validators.required]],
      answer: ['', [Validators.required]],
      isRequired: [true]
    });

    this.questionsArray.push(questionGroup);
  }

  removeQuestion(index: number): void {
    this.questionsArray.removeAt(index);
  }

  addCommonQuestion(question: string): void {
    this.addQuestion(question);
  }

  // Form Submission
  async submitProposal(): Promise<void> {
    if (!this.proposalForm.valid) {
      await this.showErrorToast('Por favor completa todos los campos requeridos');
      return;
    }

    if (!this.currentUser || !this.project) {
      await this.showErrorToast('Error de autenticación');
      return;
    }

    const confirmAlert = await this.alertController.create({
      header: 'Confirmar Envío',
      message: '¿Estás seguro de que quieres enviar esta propuesta? No podrás modificarla después.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar Propuesta',
          role: 'confirm',
          handler: () => {
            this.executeSubmission();
          }
        }
      ]
    });

    await confirmAlert.present();
  }

  private async executeSubmission(): Promise<void> {
    try {
      this.isSubmitting = true;

      const formValue = this.proposalForm.value;

      const proposalData: Omit<Proposal, 'id' | 'submittedAt' | 'viewedByClient'> = {
        projectId: this.projectId,
        freelancerId: this.currentUser!.uid,
        coverLetter: formValue.coverLetter,
        proposedBudget: {
          amount: formValue.budget.amount,
          type: formValue.budget.type,
          currency: formValue.budget.currency
        } as ProposedBudget,
        proposedTimeline: {
          duration: formValue.timeline.duration,
          unit: formValue.timeline.unit,
          description: formValue.timeline.description
        } as ProposedTimeline,
        milestones: formValue.milestones.map((m: any) => ({
          title: m.title,
          description: m.description,
          amount: m.amount,
          duration: m.duration,
          deliverables: m.deliverables
        })) as ProposedMilestone[],
        attachments: [], // TODO: Implement file uploads
        questions: formValue.questions as ProposalQuestion[],
        status: ProposalStatus.SUBMITTED,
        isShortlisted: false,
        respondedAt: undefined,
        clientFeedback: undefined
      };

      const response = await this.proposalService.submitProposal(proposalData);

      if (response.success) {
        await this.showSuccessToast('¡Propuesta enviada exitosamente!');
        this.router.navigate(['/proposals']);
      } else {
        await this.showErrorToast(response.error || 'Error al enviar la propuesta');
      }

    } catch (error) {
      console.error('Error submitting proposal:', error);
      await this.showErrorToast('Error inesperado al enviar la propuesta');
    } finally {
      this.isSubmitting = false;
    }
  }

  // UI Helper Methods
  getStepProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Carta de Presentación';
      case 2: return 'Presupuesto';
      case 3: return 'Cronograma';
      case 4: return 'Detalles Adicionales';
      default: return '';
    }
  }

  getCoverLetterWordCount(): number {
    const coverLetter = this.proposalForm.get('coverLetter')?.value || '';
    return coverLetter.split(/\s+/).filter((word: string) => word.length > 0).length;
  }

  getTotalMilestoneAmount(): number {
    return this.milestonesArray.controls.reduce((total, milestone) => {
      const amount = milestone.get('amount')?.value || 0;
      return total + (typeof amount === 'number' ? amount : 0);
    }, 0);
  }

  getTimelineLabel(type: string): string {
    switch (type) {
      case 'days': return 'días';
      case 'weeks': return 'semanas';
      case 'months': return 'meses';
      case 'flexible': return 'flexible';
      default: return type;
    }
  }

  // Debug method to check form validity
  debugFormValidity(): void {
    console.log('=== FORM DEBUG ===');
    console.log('Form valid:', this.proposalForm?.valid);
    console.log('Form value:', this.proposalForm?.value);
    console.log('Form errors:', this.getFormErrors());
    console.log('Current step:', this.currentStep);
    console.log('Step valid:', this.isCurrentStepValid());
  }

  private getFormErrors(): any {
    if (!this.proposalForm) return {};

    const errors: any = {};

    Object.keys(this.proposalForm.controls).forEach(key => {
      const control = this.proposalForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }

      // Check nested form groups
      if (control && typeof control === 'object' && 'controls' in control) {
        const nestedErrors = this.getNestedErrors(control as any);
        if (Object.keys(nestedErrors).length > 0) {
          errors[key] = nestedErrors;
        }
      }
    });

    return errors;
  }

  private getNestedErrors(group: any): any {
    const errors: any = {};

    if (group && group.controls) {
      Object.keys(group.controls).forEach(key => {
        const control = group.get(key);
        if (control && control.errors) {
          errors[key] = control.errors;
        }
      });
    }

    return errors;
  }

  // Navigation and Utility Methods
  async goBack(): Promise<void> {
    if (this.proposalForm.dirty) {
      this.showExitAlert = true;
    } else {
      this.router.navigate(['/projects', this.projectId]);
    }
  }

  async confirmExit(): Promise<void> {
    this.showExitAlert = false;
    this.router.navigate(['/projects', this.projectId]);
  }

  // Toast and Error Handling
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success',
      icon: 'checkmark'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      position: 'top',
      color: 'danger',
      icon: 'close'
    });
    await toast.present();
  }
}