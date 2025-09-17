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
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonBadge,
  IonChip,
  IonText,
  IonNote,
  ToastController,
  AlertController, IonSpinner
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  arrowBack,
  document,
  cash,
  time,
  checkmark,
  chevronForward,
  add,
  remove,
  help,
  informationCircle,
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
  imports: [IonSpinner,
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
    IonGrid,
    IonRow,
    IonCol,
    IonProgressBar,
    IonBadge,
    IonChip,
    IonText,
    IonNote,
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
  isLoading = true;
  isSubmitting = false;

  // Form Options
  budgetTypes = [
    { value: BudgetType.FIXED, label: 'Precio Fijo', description: 'Un precio total para el proyecto' },
    { value: BudgetType.HOURLY, label: 'Por Hora', description: 'Tarifa por hora trabajada' }
  ];

  timelineTypes = [
    { value: TimelineType.DAYS, label: 'Días' },
    { value: TimelineType.WEEKS, label: 'Semanas' },
    { value: TimelineType.MONTHS, label: 'Meses' }
  ];

  constructor() {
    addIcons({
      arrowBack,
      document,
      cash,
      time,
      checkmark,
      chevronForward,
      add,
      remove,
      help,
      informationCircle,
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
        await this.showToast('ID de proyecto no válido', 'danger');
        this.router.navigate(['/projects']);
        return;
      }

      // Load project and initialize form
      await this.loadProject();
      this.initializeForm();

    } catch (error) {
      console.error('Error initializing component:', error);
      await this.showToast('Error al cargar el proyecto', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadProject(): Promise<void> {
    const response = await this.projectService.getProjectById(this.projectId);

    if (response.success && response.data) {
      this.project = response.data;

      if (this.project.status !== 'published') {
        await this.showToast('Este proyecto no está aceptando propuestas', 'warning');
        this.router.navigate(['/projects']);
      }
    } else {
      await this.showToast('Proyecto no encontrado', 'danger');
      this.router.navigate(['/projects']);
    }
  }

  private initializeForm(): void {
    this.proposalForm = this.formBuilder.group({
      coverLetter: ['', [Validators.required, Validators.minLength(100), Validators.maxLength(2000)]],
      budget: this.formBuilder.group({
        amount: [null, [Validators.required, Validators.min(1)]],
        type: [BudgetType.FIXED, Validators.required],
        currency: ['USD', Validators.required]
      }),
      timeline: this.formBuilder.group({
        duration: [null, [Validators.required, Validators.min(1)]],
        unit: [TimelineType.WEEKS, Validators.required],
        description: ['']
      }),
      milestones: this.formBuilder.array([]),
      questions: this.formBuilder.array([])
    });
  }

  // Form Array Getters
  get milestonesArray(): FormArray {
    return this.proposalForm.get('milestones') as FormArray;
  }

  get questionsArray(): FormArray {
    return this.proposalForm.get('questions') as FormArray;
  }

  // Milestone Management
  addMilestone(): void {
    const milestone = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      duration: [1, [Validators.required, Validators.min(1)]],
      deliverables: this.formBuilder.array([
        this.formBuilder.control('', Validators.required)
      ])
    });

    this.milestonesArray.push(milestone);
  }

  removeMilestone(index: number): void {
    this.milestonesArray.removeAt(index);
  }

  getDeliverables(milestoneIndex: number): FormArray {
    const milestone = this.milestonesArray.at(milestoneIndex);
    return milestone.get('deliverables') as FormArray;
  }

  addDeliverable(milestoneIndex: number): void {
    const deliverables = this.getDeliverables(milestoneIndex);
    deliverables.push(this.formBuilder.control('', Validators.required));
  }

  removeDeliverable(milestoneIndex: number, deliverableIndex: number): void {
    const deliverables = this.getDeliverables(milestoneIndex);
    if (deliverables.length > 1) {
      deliverables.removeAt(deliverableIndex);
    }
  }

  // Question Management
  addQuestion(): void {
    const question = this.formBuilder.group({
      question: ['', Validators.required],
      answer: ['', Validators.required],
      isRequired: [true]
    });

    this.questionsArray.push(question);
  }

  removeQuestion(index: number): void {
    this.questionsArray.removeAt(index);
  }

  // Form Submission
  async submitProposal(): Promise<void> {
    if (!this.proposalForm.valid) {
      await this.showToast('Por favor completa todos los campos requeridos', 'warning');
      this.markFormGroupTouched(this.proposalForm);
      return;
    }

    if (!this.currentUser || !this.project) {
      await this.showToast('Error de autenticación', 'danger');
      return;
    }

    try {
      this.isSubmitting = true;

      const formValue = this.proposalForm.value;

      const proposalData: Omit<Proposal, 'id' | 'submittedAt' | 'viewedByClient'> = {
        projectId: this.projectId,
        freelancerId: this.currentUser.uid,
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
        attachments: [],
        questions: formValue.questions as ProposalQuestion[],
        status: ProposalStatus.SUBMITTED,
        isShortlisted: false,
        respondedAt: undefined,
        clientFeedback: undefined
      };

      const response = await this.proposalService.submitProposal(proposalData);

      if (response.success) {
        await this.showToast('Propuesta enviada exitosamente', 'success');
        this.router.navigate(['/proposals']);
      } else {
        await this.showToast(response.error || 'Error al enviar la propuesta', 'danger');
      }

    } catch (error) {
      console.error('Error submitting proposal:', error);
      await this.showToast('Error inesperado al enviar la propuesta', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  // Utility Methods
  getCoverLetterWordCount(): number {
    const coverLetter = this.proposalForm.get('coverLetter')?.value || '';
    return coverLetter.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
  }

  getTotalMilestoneAmount(): number {
    return this.milestonesArray.controls.reduce((total, milestone) => {
      const amount = milestone.get('amount')?.value || 0;
      return total + Number(amount);
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

  async goBack(): Promise<void> {
    if (this.proposalForm.dirty) {
      const alert = await this.alertController.create({
        header: 'Confirmar salida',
        message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Salir',
            role: 'confirm',
            handler: () => {
              this.router.navigate(['/projects', this.projectId]);
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.router.navigate(['/projects', this.projectId]);
    }
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

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }
}