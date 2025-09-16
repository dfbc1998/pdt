import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Ionic Components
import {
  IonContent,
  NavController,
  ToastController, IonButton, IonSpinner, IonIcon
} from '@ionic/angular/standalone';

// Shared Components
import { HeaderComponent } from '../../../shared/components/header/header.component';

// Chat Components
import { MessageListComponent } from './components/message-list/message-list.component';
import { MessageInputComponent } from './components/message-input/message-input.component';
import { ProjectInfoComponent } from './components/project-info/project-info.component';

// Core Services and Interfaces
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ProjectService } from '../../../core/services/project.service';
import {
  User,
  Project,
  Message,
  MessageType,
  ApiResponse
} from '../../../core/interfaces';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [IonIcon, IonSpinner, IonButton,
    CommonModule,
    IonContent,
    HeaderComponent,
    MessageListComponent,
    MessageInputComponent,
    ProjectInfoComponent
  ],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navController = inject(NavController);
  private toastController = inject(ToastController);

  // Component State
  currentUser: User | null = null;
  currentProject: Project | null = null;
  projectId: string = '';
  participantName: string = '';
  isLoading = true;

  // Messages
  messages: Message[] = [];

  constructor() { }

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

      // Get project ID from route params
      this.projectId = this.route.snapshot.paramMap.get('projectId') || '';

      if (!this.projectId) {
        await this.showErrorToast('ID de proyecto no válido');
        await this.navController.back();
        return;
      }

      await this.loadProject();
      await this.loadMessages();

    } catch (error) {
      console.error('Error initializing chat room:', error);
      await this.showErrorToast('Error al cargar el chat');
    } finally {
      this.isLoading = false;
    }
  }

  private setupSubscriptions(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.router.navigate(['/auth/login']);
        }
      });
  }

  private async loadProject(): Promise<void> {
    try {
      const response: ApiResponse<Project> = await this.projectService.getProjectById(this.projectId);

      if (response.success && response.data) {
        this.currentProject = response.data;

        // Determine participant name
        const isClient = this.currentProject.clientId === this.currentUser!.uid;
        const otherUserId = isClient ? this.currentProject.assignedFreelancerId : this.currentProject.clientId;

        if (otherUserId) {
          await this.loadParticipantName(otherUserId, isClient);
        }
      } else {
        await this.showErrorToast('Proyecto no encontrado');
        await this.navController.back();
      }
    } catch (error) {
      console.error('Error loading project:', error);
      await this.showErrorToast('Error al cargar el proyecto');
    }
  }

  private async loadParticipantName(userId: string, isClient: boolean): Promise<void> {
    try {
      if (isClient && this.currentProject?.assignedFreelancerId) {
        const response = await this.userService.getFreelancerProfile(this.currentProject.assignedFreelancerId);
        if (response.success && response.data) {
          this.participantName = `${response.data.firstName} ${response.data.lastName}`;
        }
      } else {
        const response = await this.userService.getClientProfile(this.currentProject!.clientId);
        if (response.success && response.data) {
          this.participantName = response.data.companyName;
        }
      }
    } catch (error) {
      console.error('Error loading participant name:', error);
      this.participantName = 'Usuario';
    }
  }

  private async loadMessages(): Promise<void> {
    try {
      // Generate mock messages for demo
      this.messages = this.generateMockMessages();
    } catch (error) {
      console.error('Error loading messages:', error);
      await this.showErrorToast('Error al cargar los mensajes');
    }
  }

  private generateMockMessages(): Message[] {
    if (!this.currentUser || !this.currentProject) return [];

    const otherUserId = this.currentProject.clientId === this.currentUser.uid
      ? this.currentProject.assignedFreelancerId || 'other'
      : this.currentProject.clientId;

    const mockMessages: Message[] = [];

    const messageTemplates = [
      { sender: 'other', content: '¡Hola! Gracias por asignarme este proyecto.' },
      { sender: 'current', content: '¡Perfecto! ¿Cuándo podríamos comenzar?' },
      { sender: 'other', content: 'Podemos empezar inmediatamente.' },
      { sender: 'current', content: 'Genial, tengo algunos archivos que te serán útiles.' }
    ];

    messageTemplates.forEach((template, index) => {
      const messageDate = new Date(Date.now() - (messageTemplates.length - index) * 2 * 60 * 60 * 1000);

      mockMessages.push({
        id: `msg_${index}`,
        projectId: this.currentProject!.id,
        senderId: template.sender === 'current' ? this.currentUser!.uid : otherUserId,
        receiverId: template.sender === 'current' ? otherUserId : this.currentUser!.uid,
        content: template.content,
        type: MessageType.TEXT,
        attachments: [],
        isRead: Math.random() > 0.3,
        sentAt: messageDate,
        isSystemMessage: false,
        metadata: {}
      });
    });

    return mockMessages.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }

  // Event Handlers
  async onNewMessage(messageData: { content: string; attachments: File[] }): Promise<void> {
    if (!this.currentUser || !this.currentProject) return;

    try {
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        projectId: this.currentProject.id,
        senderId: this.currentUser.uid,
        receiverId: this.currentProject.clientId === this.currentUser.uid
          ? this.currentProject.assignedFreelancerId!
          : this.currentProject.clientId,
        content: messageData.content,
        type: messageData.attachments.length > 0 ? MessageType.FILE : MessageType.TEXT,
        attachments: [], // Process attachments in real implementation
        isRead: false,
        sentAt: new Date(),
        isSystemMessage: false,
        metadata: {}
      };

      this.messages = [...this.messages, newMessage];

    } catch (error) {
      console.error('Error sending message:', error);
      await this.showErrorToast('Error al enviar el mensaje');
    }
  }

  async showProjectDetails(): Promise<void> {
    if (this.currentProject) {
      await this.router.navigate(['/projects', this.currentProject.id]);
    }
  }

  private async showErrorToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}