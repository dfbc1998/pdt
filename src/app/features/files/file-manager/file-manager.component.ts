// src/app/features/files/file-manager/file-manager.component.ts - REEMPLAZAR COMPLETO
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
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
  IonList,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonText,
  IonPopover,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  ToastController,
  AlertController,
  ActionSheetController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentOutline,
  imageOutline,
  videocamOutline,
  musicalNotesOutline,
  archiveOutline,
  cloudUploadOutline,
  downloadOutline,
  trashOutline,
  shareOutline,
  eyeOutline,
  filterOutline,
  gridOutline,
  listOutline,
  searchOutline,
  addOutline,
  ellipsisVerticalOutline,
  folderOutline,
  calendarOutline,
  resizeOutline
} from 'ionicons/icons';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { FileUpload, FileCategory, User } from '../../../core/interfaces';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'date' | 'size' | 'type';

interface FileStats {
  totalFiles: number;
  totalSize: number;
  byCategory: { [key in FileCategory]?: number };
}

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonChip,
    IonCheckbox,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonText,
    IonPopover,
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss']
})
export class FileManagerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private storageService = inject(StorageService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private modalController = inject(ModalController);
  private router = inject(Router);

  // Component state
  currentUser: User | null = null;
  isLoading = true;
  isLoadingMore = false;
  hasMoreFiles = true;

  // Files and filtering
  allFiles: FileUpload[] = [];
  displayedFiles: FileUpload[] = [];
  selectedFiles: Set<string> = new Set();

  // View and sorting
  viewMode: ViewMode = 'grid';
  sortBy: SortOption = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Filtering
  selectedCategory: FileCategory | 'all' = 'all';
  searchTerm = '';
  private searchSubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<FileCategory | 'all'>('all');
  private sortSubject = new BehaviorSubject<{ by: SortOption; direction: 'asc' | 'desc' }>({
    by: 'date',
    direction: 'desc'
  });

  // Statistics
  fileStats: FileStats = {
    totalFiles: 0,
    totalSize: 0,
    byCategory: {}
  };

  // Available categories
  fileCategories = [
    { value: 'all' as const, label: 'Todos los archivos', icon: 'document-outline' },
    { value: FileCategory.DOCUMENT, label: 'Documentos', icon: 'document-outline' },
    { value: FileCategory.PROJECT_ATTACHMENT, label: 'Adjuntos de Proyecto', icon: 'folder-outline' },
    { value: FileCategory.PROPOSAL_ATTACHMENT, label: 'Adjuntos de Propuesta', icon: 'document-outline' },
    { value: FileCategory.MESSAGE_ATTACHMENT, label: 'Adjuntos de Mensaje', icon: 'document-outline' },
    { value: FileCategory.PORTFOLIO_IMAGE, label: 'Imágenes de Portafolio', icon: 'image-outline' },
    { value: FileCategory.PROFILE_PHOTO, label: 'Fotos de Perfil', icon: 'image-outline' },
    { value: FileCategory.OTHER, label: 'Otros', icon: 'document-outline' }
  ];

  // File type icons
  fileTypeIcons: { [key: string]: string } = {
    'application/pdf': 'document-outline',
    'application/msword': 'document-outline',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document-outline',
    'application/vnd.ms-excel': 'document-outline',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document-outline',
    'image/jpeg': 'image-outline',
    'image/png': 'image-outline',
    'image/gif': 'image-outline',
    'image/webp': 'image-outline',
    'video/mp4': 'videocam-outline',
    'video/webm': 'videocam-outline',
    'audio/mp3': 'musical-notes-outline',
    'audio/wav': 'musical-notes-outline',
    'application/zip': 'archive-outline',
    'application/x-zip-compressed': 'archive-outline'
  };

  // Observables for filtering and sorting
  filteredFiles$: Observable<FileUpload[]>;

  constructor() {
    addIcons({
      documentOutline,
      imageOutline,
      videocamOutline,
      musicalNotesOutline,
      archiveOutline,
      cloudUploadOutline,
      downloadOutline,
      trashOutline,
      shareOutline,
      eyeOutline,
      filterOutline,
      gridOutline,
      listOutline,
      searchOutline,
      addOutline,
      ellipsisVerticalOutline,
      folderOutline,
      calendarOutline,
      resizeOutline
    });

    // Setup reactive filtering
    this.filteredFiles$ = combineLatest([
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.categorySubject,
      this.sortSubject
    ]).pipe(
      map(([search, category, sort]) => this.filterAndSortFiles(search, category, sort))
    );
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUser;

    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadFiles();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    this.filteredFiles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(files => {
        this.displayedFiles = files;
        this.calculateStats();
      });
  }

  // Data loading
  private async loadFiles(): Promise<void> {
    if (!this.currentUser) return;

    this.isLoading = true;

    try {
      const response = await this.storageService.getFilesByOwner(this.currentUser.uid);

      if (response.success && response.data) {
        this.allFiles = response.data;
        this.calculateStats();
      } else {
        this.showErrorToast(response.error || 'Error al cargar archivos');
      }
    } catch (error: any) {
      this.showErrorToast('Error al cargar archivos: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  // Filtering and sorting
  private filterAndSortFiles(
    searchTerm: string,
    category: FileCategory | 'all',
    sort: { by: SortOption; direction: 'asc' | 'desc' }
  ): FileUpload[] {
    let filtered = [...this.allFiles];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(search) ||
        file.originalName.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter(file => file.category === category);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sort.by) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }

  private calculateStats(): void {
    this.fileStats = {
      totalFiles: this.allFiles.length,
      totalSize: this.allFiles.reduce((sum, file) => sum + file.size, 0),
      byCategory: {}
    };

    // Calculate by category
    for (const file of this.allFiles) {
      if (!this.fileStats.byCategory[file.category]) {
        this.fileStats.byCategory[file.category] = 0;
      }
      this.fileStats.byCategory[file.category]!++;
    }
  }

  // Event handlers
  onSearchChange(event: any): void {
    this.searchTerm = event.detail.value || '';
    this.searchSubject.next(this.searchTerm);
  }

  onCategoryChange(category: FileCategory | 'all'): void {
    this.selectedCategory = category;
    this.categorySubject.next(category);
  }

  onSortChange(sortBy: SortOption): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'desc';
    }

    this.sortSubject.next({ by: this.sortBy, direction: this.sortDirection });
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  // File operations
  async downloadFile(file: FileUpload): Promise<void> {
    try {
      const urlResponse = await this.storageService.getSecureDownloadUrl(file.id);

      if (urlResponse.success && urlResponse.data) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = urlResponse.data;
        link.download = file.originalName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showSuccessToast('Descarga iniciada');
      } else {
        this.showErrorToast(urlResponse.error || 'Error al obtener URL de descarga');
      }
    } catch (error: any) {
      this.showErrorToast('Error al descargar archivo: ' + error.message);
    }
  }

  async deleteFile(file: FileUpload): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar "${file.originalName}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              const response = await this.storageService.deleteFile(file.id);

              if (response.success) {
                this.allFiles = this.allFiles.filter(f => f.id !== file.id);
                this.selectedFiles.delete(file.id);
                this.showSuccessToast('Archivo eliminado exitosamente');
              } else {
                this.showErrorToast(response.error || 'Error al eliminar archivo');
              }
            } catch (error: any) {
              this.showErrorToast('Error al eliminar archivo: ' + error.message);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteSelectedFiles(): Promise<void> {
    if (this.selectedFiles.size === 0) return;

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar ${this.selectedFiles.size} archivo(s)?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              const fileIds = Array.from(this.selectedFiles);
              const response = await this.storageService.deleteMultipleFiles(fileIds);

              if (response.success && response.data) {
                this.allFiles = this.allFiles.filter(f => !this.selectedFiles.has(f.id));
                this.selectedFiles.clear();
                this.showSuccessToast(`${response.data.deleted} archivo(s) eliminado(s)`);
              } else {
                this.showErrorToast(response.error || 'Error al eliminar archivos');
              }
            } catch (error: any) {
              this.showErrorToast('Error al eliminar archivos: ' + error.message);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Selection methods
  toggleFileSelection(fileId: string): void {
    if (this.selectedFiles.has(fileId)) {
      this.selectedFiles.delete(fileId);
    } else {
      this.selectedFiles.add(fileId);
    }
  }

  selectAllFiles(): void {
    if (this.selectedFiles.size === this.displayedFiles.length) {
      this.selectedFiles.clear();
    } else {
      this.selectedFiles.clear();
      this.displayedFiles.forEach(file => this.selectedFiles.add(file.id));
    }
  }

  isFileSelected(fileId: string): boolean {
    return this.selectedFiles.has(fileId);
  }

  // Utility methods
  getFileIcon(file: FileUpload): string {
    return this.fileTypeIcons[file.type] || 'document-outline';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getCategoryLabel(category: FileCategory): string {
    const categoryData = this.fileCategories.find(c => c.value === category);
    return categoryData?.label || category;
  }

  getCategoryIcon(category: FileCategory): string {
    const categoryData = this.fileCategories.find(c => c.value === category);
    return categoryData?.icon || 'document-outline';
  }

  // Navigation
  goToUpload(): void {
    this.router.navigate(['/files/upload']);
  }

  // Toast methods
  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }
}