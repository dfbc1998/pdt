import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

// Ionic Components
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  NavController,
  ToastController
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  addOutline,
  searchOutline,
  closeOutline,
  refreshOutline,
  cardOutline,
  documentTextOutline,
  timeOutline,
  sendOutline,
  createOutline,
  chevronForwardOutline,
  chevronBackOutline
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import {
  User,
  Project,
  ProjectCategory,
  UserRole
} from '../../../core/interfaces';

interface CategoryOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    HeaderComponent,
    LoadingComponent
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private navController = inject(NavController);
  private toastController = inject(ToastController);
  private router = inject(Router);

  // Search and Filter Subjects
  private searchSubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<string>('');
  private budgetSubject = new BehaviorSubject<string>('');
  private sortSubject = new BehaviorSubject<string>('newest');

  // Component State
  currentUser: User | null = null;
  currentUserRole: string = '';
  isLoading = true;
  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  paginatedProjects: Project[] = [];

  // Filter Values
  searchTerm = '';
  selectedCategory = '';
  selectedBudgetRange = '';
  sortBy = 'newest';

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  // Categories
  categories: CategoryOption[] = [
    { value: ProjectCategory.WEB_DEVELOPMENT, label: 'Desarrollo Web' },
    { value: ProjectCategory.MOBILE_DEVELOPMENT, label: 'Desarrollo Móvil' },
    { value: ProjectCategory.DESIGN, label: 'Diseño' },
    { value: ProjectCategory.WRITING, label: 'Redacción' },
    { value: ProjectCategory.MARKETING, label: 'Marketing' },
    { value: ProjectCategory.DATA_SCIENCE, label: 'Ciencia de Datos' },
    { value: ProjectCategory.BUSINESS, label: 'Negocios' },
    { value: ProjectCategory.OTHER, label: 'Otros' }
  ];

  constructor() {
    this.registerIcons();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private registerIcons(): void {
    addIcons({
      addOutline,
      searchOutline,
      closeOutline,
      refreshOutline,
      cardOutline,
      documentTextOutline,
      timeOutline,
      sendOutline,
      createOutline,
      chevronForwardOutline,
      chevronBackOutline
    });
  }

  private initializeComponent(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.currentUserRole = user?.role || '';
        this.loadProjects();
      });
  }

  private setupFilters(): void {
    // Combine all filter observables
    combineLatest([
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.categorySubject,
      this.budgetSubject,
      this.sortSubject
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([search, category, budget, sort]) => {
        this.applyFilters(search, category, budget, sort);
      });
  }

  private async loadProjects(): Promise<void> {
    try {
      this.isLoading = true;

      let response;
      if (this.currentUserRole === UserRole.CLIENT) {
        // Load client's projects
        response = await this.projectService.getProjectsByClient(this.currentUser!.uid);
      } else {
        // Load all published projects for freelancers/general viewing
        response = await this.projectService.getPublishedProjects();
      }

      if (response.success && response.data) {
        this.allProjects = response.data;
        this.filteredProjects = [...this.allProjects];
        this.updatePagination();
      } else {
        this.handleError('Error al cargar los proyectos');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      this.handleError('Error al cargar los proyectos');
    } finally {
      this.isLoading = false;
    }
  }

  private applyFilters(search: string, category: string, budget: string, sort: string): void {
    let filtered = [...this.allProjects];

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.requiredSkills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(project => project.category === category);
    }

    // Apply budget filter
    if (budget) {
      filtered = filtered.filter(project => {
        const amount = project.budget.amount || 0;
        switch (budget) {
          case '0-1000':
            return amount >= 0 && amount <= 1000;
          case '1000-5000':
            return amount > 1000 && amount <= 5000;
          case '5000-10000':
            return amount > 5000 && amount <= 10000;
          case '10000+':
            return amount > 10000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'budget_high':
          return (b.budget.amount || 0) - (a.budget.amount || 0);
        case 'budget_low':
          return (a.budget.amount || 0) - (b.budget.amount || 0);
        case 'proposals':
          return b.proposalCount - a.proposalCount;
        default:
          return 0;
      }
    });

    this.filteredProjects = filtered;
    this.currentPage = 1; // Reset to first page
    this.updatePagination();
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProjects.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);
  }

  // Event Handlers
  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value || '';
    this.searchSubject.next(this.searchTerm);
  }

  onCategoryChange(event: any): void {
    this.selectedCategory = event.detail.value || '';
    this.categorySubject.next(this.selectedCategory);
  }

  onBudgetChange(event: any): void {
    this.selectedBudgetRange = event.detail.value || '';
    this.budgetSubject.next(this.selectedBudgetRange);
  }

  onSortChange(event: any): void {
    this.sortBy = event.detail.value || 'newest';
    this.sortSubject.next(this.sortBy);
  }

  // UI Helper Methods
  getPageTitle(): string {
    if (this.currentUserRole === UserRole.CLIENT) {
      return 'Mis Proyectos';
    }
    return 'Explorar Proyectos';
  }

  getPageSubtitle(): string {
    if (this.currentUserRole === UserRole.CLIENT) {
      return 'Gestiona tus proyectos publicados y encuentra freelancers talentosos';
    }
    return 'Encuentra oportunidades perfectas para tu experiencia y habilidades';
  }

  getEmptyStateMessage(): string {
    if (this.hasActiveFilters()) {
      return 'No se encontraron proyectos que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.';
    }

    if (this.currentUserRole === UserRole.CLIENT) {
      return '¡Aún no has creado ningún proyecto! Publica tu primer proyecto y comienza a recibir propuestas de freelancers talentosos.';
    }

    return 'No hay proyectos disponibles en este momento. Vuelve pronto para ver nuevas oportunidades.';
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedCategory || this.selectedBudgetRange);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedBudgetRange = '';
    this.sortBy = 'newest';

    this.searchSubject.next('');
    this.categorySubject.next('');
    this.budgetSubject.next('');
    this.sortSubject.next('newest');
  }

  getCategoryLabel(category: string): string {
    const categoryOption = this.categories.find(c => c.value === category);
    return categoryOption?.label || category;
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'draft': 'Borrador',
      'published': 'Publicado',
      'in_progress': 'En Progreso',
      'under_review': 'En Revisión',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'paused': 'Pausado'
    };
    return statusLabels[status] || status;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMilliseconds = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        return `Hace ${diffInMinutes} min`;
      }
      return `Hace ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
    } else {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
    }
  }

  isProjectOwner(project: Project): boolean {
    return this.currentUser?.uid === project.clientId;
  }

  // Navigation Methods
  async createProject(): Promise<void> {
    await this.navController.navigateForward('/projects/create');
  }

  async viewProject(projectId: string): Promise<void> {
    await this.navController.navigateForward(`/projects/${projectId}`);
  }

  async editProject(projectId: string): Promise<void> {
    await this.navController.navigateForward(`/projects/${projectId}/edit`);
  }

  async sendProposal(projectId: string): Promise<void> {
    await this.navController.navigateForward(`/proposals/create/${projectId}`);
  }

  // Pagination Methods
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.scrollToTop();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    const content = document.querySelector('ion-content');
    content?.scrollToTop(300);
  }

  // Track By Function for *ngFor optimization
  trackByProjectId(index: number, project: Project): string {
    return project.id;
  }

  // Error Handling
  private handleError(message: string): void {
    this.showErrorToast(message);
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
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

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }
}
