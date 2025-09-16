// src/app/features/chat/chat-room/components/message-list/message-list.component.ts
import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  checkmarkOutline,
  checkmarkDoneOutline,
  documentTextOutline,
  imageOutline,
  folderOpenOutline
} from 'ionicons/icons';

import { Message, MessageType } from '../../../../../core/interfaces';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon
  ],
  template: `
    <div class="messages-container" #messagesContainer>
      <div class="messages-list" *ngIf="messages.length > 0">
        <div 
          class="message-wrapper"
          *ngFor="let message of messages; trackBy: trackMessage"
          [class.own-message]="message.senderId === currentUserId"
          [class.other-message]="message.senderId !== currentUserId">
          
          <!-- Date Separator -->
          <div class="date-separator" *ngIf="shouldShowDateSeparator(message)">
            <span>{{ getDateSeparatorText(message.sentAt) }}</span>
          </div>

          <!-- System Messages -->
          <div class="system-message" *ngIf="message.isSystemMessage">
            <div class="system-content">
              <ion-icon name="information-circle-outline"></ion-icon>
              <span>{{ message.content }}</span>
            </div>
            <div class="system-timestamp">
              {{ formatMessageTime(message.sentAt) }}
            </div>
          </div>

          <!-- Regular Messages -->
          <div class="message-bubble" *ngIf="!message.isSystemMessage">
            
            <!-- Message Content -->
            <div class="message-content">
              <p class="message-text">{{ message.content }}</p>

              <!-- Attachments -->
              <div class="message-attachments" *ngIf="message.attachments && message.attachments.length > 0">
                <div 
                  class="attachment-item"
                  *ngFor="let attachment of message.attachments">
                  
                  <div class="file-attachment">
                    <div class="file-icon">
                      <ion-icon [name]="getFileIcon(attachment.type)"></ion-icon>
                    </div>
                    <div class="file-info">
                      <span class="file-name">{{ attachment.name }}</span>
                      <span class="file-size">{{ formatFileSize(attachment.size) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message Meta -->
            <div class="message-meta">
              <span class="message-time">{{ formatMessageTime(message.sentAt) }}</span>
              <div class="message-status" *ngIf="message.senderId === currentUserId">
                <ion-icon 
                  name="checkmark-outline" 
                  *ngIf="!message.isRead"
                  class="sent-status">
                </ion-icon>
                <ion-icon 
                  name="checkmark-done-outline" 
                  *ngIf="message.isRead"
                  class="read-status">
                </ion-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements OnChanges {
  @Input() messages: Message[] = [];
  @Input() currentUserId: string = '';

  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  private lastMessageDate: string | null = null;

  constructor() {
    addIcons({
      informationCircleOutline,
      checkmarkOutline,
      checkmarkDoneOutline,
      documentTextOutline,
      imageOutline,
      folderOpenOutline
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages'] && this.messages.length > 0) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  trackMessage(index: number, message: Message): string {
    return message.id;
  }

  shouldShowDateSeparator(message: Message): boolean {
    if (this.messages.length === 0) return false;

    const messageIndex = this.messages.indexOf(message);
    if (messageIndex === 0) return true;

    const previousMessage = this.messages[messageIndex - 1];
    const currentDate = message.sentAt.toDateString();
    const previousDate = previousMessage.sentAt.toDateString();

    return currentDate !== previousDate;
  }

  getDateSeparatorText(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = date.toDateString();
    const todayString = today.toDateString();
    const yesterdayString = yesterday.toDateString();

    if (messageDate === todayString) {
      return 'Hoy';
    } else if (messageDate === yesterdayString) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  formatMessageTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileIcon(type: string): string {
    const fileType = type.toLowerCase();

    if (fileType.includes('image')) return 'image-outline';
    if (fileType.includes('pdf')) return 'document-text-outline';

    return 'folder-open-outline';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}