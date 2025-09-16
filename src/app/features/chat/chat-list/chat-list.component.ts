// src/app/features/chat/chat-list/chat-list.component.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';

// Ionic Components
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonSpinner,
  IonChip,
  NavController,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';

// Ionicons
import { addIcons } from 'ionicons';
import {
  chatbubblesOutline,
  searchOutline,
  addOutline,
  timeOutline,
  documentTextOutline,
  imageOutline,
  attachOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  chevronForwardOutline,
  refreshOutline,
  filterOutline
} from 'ionicons/icons';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ProjectService } from '../../../core/services/project.service';
import {
  User,
  ChatRoom,
  Message,
  Project,
  MessageType,
  ProjectStatus,
  ApiResponse
} from '../../../core/interfaces';

interface ConversationDisplay {
  id: string;
  projectId: string;
  projectTitle: string;
  participantName: string;
  participantInitials: string;
  lastMessage: Message | null;
  lastActivity: Date;
  unreadCount: number;
  isActive: boolean;
  projectStatus?: ProjectStatus;
}

type ConversationFilter = 'all' | 'unread' | 'active' | 'completed';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonSpinner,
    IonChip,
    HeaderComponent
  ],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss']
})
export class ChatListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private projectService = inject(ProjectService);
  private navController = inject(NavController);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private router = inject(Router);

  // Component State
  currentUser: User | null = null;
  isLoading = true;
  isRefreshing = false;

  // Data
  allConversations: ConversationDisplay[] = [];
  filteredConversations$: Observable<ConversationDisplay[]>;

  // Search and Filter
  private searchSubject = new BehaviorSubject<string>('');
  private filterSubject = new BehaviorSubject<ConversationFilter>('all');
  searchTerm = '';
  currentFilter: ConversationFilter = 'all';

  // Filter options
  filterOptions = [
    { value: 'all' as ConversationFilter, label: 'Todas', count: 0 },
    { value: 'unread' as ConversationFilter, label: 'No leídas', count: 0 },
    { value: 'active' as ConversationFilter, label: 'Activas', count: 0 },
    { value: 'completed' as ConversationFilter, label: 'Completadas', count: 0 }
  ];

  // Message Types Enum (for template access)
  MessageType = MessageType;

  constructor() {
    addIcons({
      chatbubblesOutline,
      searchOutline,
      addOutline,
      timeOutline,
      documentTextOutline,
      imageOutline,
      attachOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      chevronForwardOutline,
      refreshOutline,
      filterOutline
    });

    // Setup filtered conversations observable
    this.filteredConversations$ = combineLatest([
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      ),
      this.filterSubject.pipe(
        distinctUntilChanged(),
        startWith('all' as ConversationFilter)
      )
    ]).pipe(
      map(([searchTerm, filter]) => this.filterConversations(searchTerm, filter))
    );
  }

  async ngOnInit(): Promise<void> {
    await this.initializeComponent();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeComponent(): Promise<void> {
    try {
      this.currentUser = this.authService.currentUser;

      if (!this.currentUser) {
        await this.router.navigate(['/auth/login']);
        return;
      }

      await this.loadConversations();
    } catch (error) {
      console.error('Error initializing chat list:', error);
      await this.showErrorToast('Error al cargar las conversaciones');
    } finally {
      this.isLoading = false;
    }
  }

  private setupSubscriptions(): void {
    // Subscribe to auth changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.router.navigate(['/auth/login']);
        }
      });
  }

  private async loadConversations(): Promise<void> {
    if (!this.currentUser) return;

    try {
      this.isRefreshing = true;

      // Get user's projects (both as client and freelancer)
      const userProjects = await this.getUserProjects();

      // For each project, create conversation display
      const conversations: ConversationDisplay[] = [];

      for (const project of userProjects) {
        const conversation = await this.createConversationDisplay(project);
        if (conversation) {
          conversations.push(conversation);
        }
      }

      // Sort by last activity (newest first)
      this.allConversations = conversations.sort((a, b) =>
        b.lastActivity.getTime() - a.lastActivity.getTime()
      );

      this.updateFilterCounts();

    } catch (error) {
      console.error('Error loading conversations:', error);
      await this.showErrorToast('Error al cargar las conversaciones');
    } finally {
      this.isRefreshing = false;
    }
  }

  private async getUserProjects(): Promise<Project[]> {
    if (!this.currentUser) return [];

    try {
      // Get projects by client (if user is a client)
      const clientProjectsResponse: ApiResponse<Project[]> = await this.projectService.getProjectsByClient(this.currentUser.uid);
      const clientProjects = clientProjectsResponse.success && clientProjectsResponse.data ? clientProjectsResponse.data : [];

      // Get published projects and filter by assigned freelancer (if user is a freelancer)
      const publishedResponse: ApiResponse<Project[]> = await this.projectService.getPublishedProjects(100);
      const freelancerProjects = publishedResponse.success && publishedResponse.data ?
        publishedResponse.data.filter(project => project.assignedFreelancerId === this.currentUser!.uid) : [];

      // Combine and deduplicate
      const allProjects = [...clientProjects, ...freelancerProjects];
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      );

      // Only return projects that have been assigned (have both client and freelancer)
      return uniqueProjects.filter(project =>
        project.assignedFreelancerId &&
        (project.clientId === this.currentUser!.uid || project.assignedFreelancerId === this.currentUser!.uid)
      );

    } catch (error) {
      console.error('Error fetching user projects:', error);
      return [];
    }
  }

  private async createConversationDisplay(project: Project): Promise<ConversationDisplay | null> {
    if (!this.currentUser) return null;

    try {
      // Determine the other participant
      const isClient = project.clientId === this.currentUser.uid;
      const otherUserId = isClient ? project.assignedFreelancerId : project.clientId;

      if (!otherUserId) return null;

      // Get other user's basic info using available profile methods
      let otherUserName = 'Usuario';

      if (isClient && project.assignedFreelancerId) {
        // Get freelancer profile
        const profileResponse = await this.userService.getFreelancerProfile(project.assignedFreelancerId);
        if (profileResponse.success && profileResponse.data) {
          otherUserName = `${profileResponse.data.firstName} ${profileResponse.data.lastName}`;
        }
      } else {
        // Get client profile
        const profileResponse = await this.userService.getClientProfile(project.clientId);
        if (profileResponse.success && profileResponse.data) {
          otherUserName = profileResponse.data.companyName;
        }
      }

      // Create mock last message (in real app, this would come from a chat service)
      const mockMessages: string[] = [
        '¡Perfecto! Comenzaré con el desarrollo inmediatamente.',
        'He subido la primera versión para tu revisión.',
        '¿Podrías revisar los cambios que implementé?',
        'Todo listo para la entrega final.',
        'Gracias por la colaboración, ¡fue un gran proyecto!'
      ];

      const lastMessage: Message | null = Math.random() > 0.2 ? {
        id: `msg_${Date.now()}`,
        projectId: project.id,
        senderId: Math.random() > 0.5 ? this.currentUser.uid : otherUserId,
        receiverId: Math.random() > 0.5 ? otherUserId : this.currentUser.uid,
        content: mockMessages[Math.floor(Math.random() * mockMessages.length)],
        type: Math.random() > 0.8 ? MessageType.FILE : MessageType.TEXT,
        attachments: [],
        isRead: Math.random() > 0.3,
        sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        isSystemMessage: Math.random() > 0.9,
        metadata: {}
      } : null;

      return {
        id: `${project.id}_chat`,
        projectId: project.id,
        projectTitle: project.title,
        participantName: otherUserName,
        participantInitials: this.getInitials(otherUserName),
        lastMessage: lastMessage,
        lastActivity: lastMessage?.sentAt || project.updatedAt || project.createdAt,
        unreadCount: Math.floor(Math.random() * 5),
        isActive: project.status === ProjectStatus.IN_PROGRESS,
        projectStatus: project.status
      };

    } catch (error) {
      console.error('Error creating conversation display:', error);
      return null;
    }
  }

  private getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  private filterConversations(searchTerm: string, filter: ConversationFilter): ConversationDisplay[] {
    let filtered = [...this.allConversations];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(conv =>
        conv.participantName.toLowerCase().includes(search) ||
        conv.projectTitle.toLowerCase().includes(search) ||
        (conv.lastMessage?.content?.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'active':
        filtered = filtered.filter(conv => conv.isActive);
        break;
      case 'completed':
        filtered = filtered.filter(conv => conv.projectStatus === ProjectStatus.COMPLETED);
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    return filtered;
  }

  private updateFilterCounts(): void {
    const total = this.allConversations.length;
    const unread = this.allConversations.filter(conv => conv.unreadCount > 0).length;
    const active = this.allConversations.filter(conv => conv.isActive).length;
    const completed = this.allConversations.filter(conv => conv.projectStatus === ProjectStatus.COMPLETED).length;

    this.filterOptions = [
      { value: 'all', label: 'Todas', count: total },
      { value: 'unread', label: 'No leídas', count: unread },
      { value: 'active', label: 'Activas', count: active },
      { value: 'completed', label: 'Completadas', count: completed }
    ];
  }

  // Event Handlers
  onSearchInput(event: any): void {
    const term = event.target.value || '';
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  onFilterChange(filter: ConversationFilter): void {
    this.currentFilter = filter;
    this.filterSubject.next(filter);
  }

  async onConversationClick(conversation: ConversationDisplay): Promise<void> {
    try {
      // Navigate to chat room
      await this.router.navigate(['/messages', conversation.projectId]);
    } catch (error) {
      console.error('Error navigating to chat:', error);
      await this.showErrorToast('Error al abrir el chat');
    }
  }

  async onRefresh(): Promise<void> {
    await this.loadConversations();
  }

  async onStartNewChat(): Promise<void> {
    // Navigate to projects to select one for starting a new chat
    await this.router.navigate(['/projects']);
  }

  // Message formatting helpers
  formatLastMessage(message: Message): string {
    if (message.isSystemMessage) {
      return message.content;
    }

    switch (message.type) {
      case MessageType.FILE:
        return '📎 Archivo adjunto';
      case MessageType.IMAGE:
        return '🖼️ Imagen';
      case MessageType.MILESTONE_UPDATE:
        return '🎯 Actualización de hito';
      case MessageType.PAYMENT_NOTIFICATION:
        return '💳 Notificación de pago';
      default:
        return message.content;
    }
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMins}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays}d`;
      } else {
        return date.toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric'
        });
      }
    }
  }

  getStatusChipClass(status?: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return 'active';
      case ProjectStatus.COMPLETED:
        return 'completed';
      default:
        return 'pending';
    }
  }

  // Template helper methods
  trackConversation(index: number, conversation: ConversationDisplay): string {
    return conversation.id;
  }

  getStatusLabel(status?: ProjectStatus): string {
    const statusLabels: { [key in ProjectStatus]: string } = {
      [ProjectStatus.DRAFT]: 'Borrador',
      [ProjectStatus.PUBLISHED]: 'Publicado',
      [ProjectStatus.IN_PROGRESS]: 'En Progreso',
      [ProjectStatus.UNDER_REVIEW]: 'En Revisión',
      [ProjectStatus.COMPLETED]: 'Completado',
      [ProjectStatus.CANCELLED]: 'Cancelado',
      [ProjectStatus.PAUSED]: 'Pausado'
    };
    return statusLabels[status || ProjectStatus.DRAFT];
  }

  // Helper for template to check if filter options have counts
  hasFilterOptions(): boolean {
    return this.filterOptions.some(option => option.count > 0);
  }

  // Utility methods
  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  private async showSuccessToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}