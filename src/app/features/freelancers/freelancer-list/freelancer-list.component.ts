// src/app/features/freelancers/freelancer-list/freelancer-list.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';

// Ionic Components
import {
  IonContent,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonAvatar,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  ToastController,
  NavController
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  refreshOutline,
  searchOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  eyeOutline,
  mailOutline,
  addOutline,
  peopleOutline,
  locationOutline,
  star,
  starOutline,
  checkmarkCircle,
  codeSlashOutline,
  brushOutline,
  megaphoneOutline,
  barChartOutline,
  constructOutline,
  libraryOutline,
  timeOutline,
  businessOutline,
  contractOutline
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';

// Core Services and Interfaces
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  FreelancerProfile,
  User,
  ExperienceLevel,
  Availability,
  ApiResponse
} from '../../../core/interfaces';

interface QuickFilter {
  value: string;
  label: string;
  icon: string;
  skills: string[];
}

@Component({
  selector: 'app-freelancer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonAvatar,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    HeaderComponent
  ],
  templateUrl: './freelancer-list.component.html',
  styleUrls: ['./freelancer-list.component.scss']
})
export class FreelancerListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private navController = inject(NavController);
  private toastController = inject(ToastController);

  // Component State
  currentUser: User | null = null;
  isLoading = true;
  isLoadingMore = false;
  hasMoreResults = false;

  // Data
  allFreelancers: FreelancerProfile[] = [];
  filteredFreelancers: FreelancerProfile[] = [];

  // Search and Filters
  searchTerm = '';
  private searchSubject = new BehaviorSubject<string>('');
  selectedFilters: string[] = [];
  showAdvancedFilters = false;

  // Advanced Filters
  experienceFilter = '';
  rateFilter = '';
  availabilityFilter = '';
  ratingFilter = '';

  // Sorting
  sortBy = 'rating';

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;

  // Quick Filters
  quickFilters: QuickFilter[] = [
    {
      value: 'development',
      label: 'Desarrollo',
      icon: 'code-slash-outline',
      skills: ['JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js', 'Python', 'Java']
    },
    {
      value: 'design',
      label: 'Diseño',
      icon: 'brush-outline',
      skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Graphic Design']
    },
    {
      value: 'marketing',
      label: 'Marketing',
      icon: 'megaphone-outline',
      skills: ['Digital Marketing', 'SEO', 'Content Marketing', 'Social Media', 'Google Ads']
    },
    {
      value: 'data',
      label: 'Datos',
      icon: 'bar-chart-outline',
      skills: ['Data Analysis', 'Machine Learning', 'Python', 'SQL', 'Data Science']
    },
    {
      value: 'mobile',
      label: 'Mobile',
      icon: 'phone-portrait-outline',
      skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin']
    },
    {
      value: 'writing',
      label: 'Redacción',
      icon: 'library-outline',
      skills: ['Content Writing', 'Copywriting', 'Technical Writing', 'Blog Writing']
    }
  ];

  constructor() {
    this.registerIcons();
    this.setupSearch();
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
      refreshOutline,
      searchOutline,
      chevronDownOutline,
      chevronUpOutline,
      closeOutline,
      eyeOutline,
      mailOutline,
      addOutline,
      peopleOutline,
      locationOutline,
      star,
      starOutline,
      checkmarkCircle,
      codeSlashOutline,
      brushOutline,
      megaphoneOutline,
      barChartOutline,
      constructOutline,
      libraryOutline,
      timeOutline,
      businessOutline,
      contractOutline
    });
  }

  private initializeComponent(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadFreelancers();
        }
      });
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        this.applyFilters();
      });
  }

  private async loadFreelancers(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('🔄 Loading freelancers...');

      // Load top freelancers by default
      const response: ApiResponse<FreelancerProfile[]> = await this.userService.getTopFreelancers(50);

      if (response.success && response.data) {
        this.allFreelancers = response.data;
        this.filteredFreelancers = [...this.allFreelancers];
        this.applySorting();

        console.log('✅ Freelancers loaded:', this.allFreelancers.length);
      } else {
        console.error('❌ Error loading freelancers:', response.error);
        await this.showToast(response.error || 'Error al cargar freelancers', 'danger');
      }
    } catch (error) {
      console.error('💥 Error loading freelancers:', error);
      await this.showToast('Error inesperado al cargar freelancers', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // Search and Filter Methods
  onSearchChange(event: any): void {
    const searchTerm = event.target.value || '';
    this.searchSubject.next(searchTerm);
  }

  toggleFilter(filterValue: string): void {
    const index = this.selectedFilters.indexOf(filterValue);
    if (index > -1) {
      this.selectedFilters.splice(index, 1);
    } else {
      this.selectedFilters.push(filterValue);
    }
    this.applyFilters();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  applyFilters(): void {
    let filtered = [...this.allFreelancers];

    // Text search
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(freelancer => {
        return (
          freelancer.title.toLowerCase().includes(searchLower) ||
          freelancer.bio.toLowerCase().includes(searchLower) ||
          freelancer.skills.some(skill => skill.toLowerCase().includes(searchLower)) ||
          `${freelancer.firstName} ${freelancer.lastName}`.toLowerCase().includes(searchLower)
        );
      });
    }

    // Quick filters (skill-based)
    if (this.selectedFilters.length > 0) {
      filtered = filtered.filter(freelancer => {
        return this.selectedFilters.some(filterValue => {
          const filter = this.quickFilters.find(f => f.value === filterValue);
          if (!filter) return false;

          return filter.skills.some(skill =>
            freelancer.skills.some(freelancerSkill =>
              freelancerSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
        });
      });
    }

    // Experience filter
    if (this.experienceFilter) {
      filtered = filtered.filter(freelancer =>
        freelancer.experience === this.experienceFilter
      );
    }

    // Rate filter
    if (this.rateFilter) {
      const [min, max] = this.getRateRange(this.rateFilter);
      filtered = filtered.filter(freelancer => {
        const rate = freelancer.hourlyRate;
        return rate >= min && (max === Infinity || rate <= max);
      });
    }

    // Availability filter
    if (this.availabilityFilter) {
      filtered = filtered.filter(freelancer =>
        freelancer.availability === this.availabilityFilter
      );
    }

    // Rating filter
    if (this.ratingFilter) {
      const minRating = parseFloat(this.ratingFilter);
      filtered = filtered.filter(freelancer =>
        freelancer.averageRating >= minRating
      );
    }

    this.filteredFreelancers = filtered;
    this.applySorting();
  }

  private getRateRange(rateFilter: string): [number, number] {
    switch (rateFilter) {
      case '0-25': return [0, 25];
      case '25-50': return [25, 50];
      case '50-100': return [50, 100];
      case '100+': return [100, Infinity];
      default: return [0, Infinity];
    }
  }

  applySorting(): void {
    this.filteredFreelancers.sort((a, b) => {
      switch (this.sortBy) {
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'rate_low':
          return a.hourlyRate - b.hourlyRate;
        case 'rate_high':
          return b.hourlyRate - a.hourlyRate;
        case 'experience':
          return (b.completedProjects || 0) - (a.completedProjects || 0);
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedFilters = [];
    this.experienceFilter = '';
    this.rateFilter = '';
    this.availabilityFilter = '';
    this.ratingFilter = '';
    this.sortBy = 'rating';
    this.showAdvancedFilters = false;

    this.searchSubject.next('');
    this.applyFilters();
  }

  // Navigation Methods
  viewFreelancer(freelancerId: string): void {
    this.router.navigate(['/freelancers', freelancerId]);
  }

  viewProfile(freelancerId: string): void {
    this.router.navigate(['/freelancers', freelancerId]);
  }

  contactFreelancer(freelancerId: string): void {
    // Navigate to messages or project creation with pre-selected freelancer
    this.router.navigate(['/messages'], {
      queryParams: { freelancer: freelancerId }
    });
  }

  // UI Helper Methods
  getFreelancerName(freelancer: FreelancerProfile): string {
    return `${freelancer.firstName} ${freelancer.lastName}`.trim();
  }

  getFreelancerAvatar(freelancer: FreelancerProfile): string {
    // Return a default avatar URL or use initials
    const initials = `${freelancer.firstName[0]}${freelancer.lastName[0]}`.toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=ffffff&size=120`;
  }

  getAvailabilityColor(availability: Availability): string {
    const colors: { [key in Availability]: string } = {
      [Availability.FULL_TIME]: 'success',
      [Availability.PART_TIME]: 'warning',
      [Availability.CONTRACT]: 'primary',
      [Availability.NOT_AVAILABLE]: 'medium'
    };
    return colors[availability] || 'medium';
  }

  getAvailabilityIcon(availability: Availability): string {
    const icons: { [key in Availability]: string } = {
      [Availability.FULL_TIME]: 'time-outline',
      [Availability.PART_TIME]: 'time-outline',
      [Availability.CONTRACT]: 'contract-outline',
      [Availability.NOT_AVAILABLE]: 'close-outline'
    };
    return icons[availability] || 'time-outline';
  }

  getAvailabilityLabel(availability: Availability): string {
    const labels: { [key in Availability]: string } = {
      [Availability.FULL_TIME]: 'Tiempo Completo',
      [Availability.PART_TIME]: 'Medio Tiempo',
      [Availability.CONTRACT]: 'Por Proyecto',
      [Availability.NOT_AVAILABLE]: 'No Disponible'
    };
    return labels[availability] || availability;
  }

  // Event Handlers
  async onRefresh(event: any): Promise<void> {
    await this.loadFreelancers();
    event.target.complete();
  }

  async refreshData(): Promise<void> {
    await this.loadFreelancers();
  }

  async loadMoreFreelancers(): Promise<void> {
    // This would typically load more results from the API
    // For now, we'll just show all results
    this.hasMoreResults = false;
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}