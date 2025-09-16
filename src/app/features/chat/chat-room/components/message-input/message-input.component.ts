// src/app/features/chat/chat-room/components/message-input/message-input.component.ts
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { attachOutline, sendOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonSpinner
  ],
  template: `
    <div class="message-input-container">
      
      <!-- Attachment Preview -->
      <div class="attachment-preview" *ngIf="selectedAttachments.length > 0">
        <div class="preview-list">
          <div 
            class="preview-item"
            *ngFor="let attachment of selectedAttachments; let i = index">
            
            <div class="preview-content">
              <span class="file-name">{{ attachment.name }}</span>
              <span class="file-size">{{ formatFileSize(attachment.size) }}</span>
            </div>
            
            <ion-button 
              fill="clear" 
              size="small" 
              (click)="removeAttachment(i)">
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>

      <!-- Input Row -->
      <div class="input-row">
        
        <!-- Attachment Button -->
        <ion-button 
          fill="clear" 
          size="small" 
          (click)="openFilePicker()"
          [disabled]="disabled || isSending">
          <ion-icon name="attach-outline"></ion-icon>
        </ion-button>

        <!-- Text Input -->
        <div class="message-input-wrapper">
          <textarea
            #messageInput
            [(ngModel)]="messageText"
            placeholder="Escribe un mensaje..."
            rows="1"
            maxlength="2000"
            (keydown)="onKeyDown($event)"
            (input)="autoResize()"
            [disabled]="disabled || isSending">
          </textarea>
          
          <div class="input-actions" *ngIf="messageText.length > 1500">
            <span class="char-count">{{ messageText.length }}/2000</span>
          </div>
        </div>

        <!-- Send Button -->
        <ion-button 
          fill="clear" 
          size="small" 
          (click)="sendMessage()"
          [disabled]="!canSend() || disabled || isSending">
          <ion-spinner *ngIf="isSending" name="dots"></ion-spinner>
          <ion-icon *ngIf="!isSending" name="send-outline"></ion-icon>
        </ion-button>
      </div>

      <!-- File Input (Hidden) -->
      <input 
        type="file" 
        #fileInput 
        multiple 
        accept="image/*,.pdf,.doc,.docx,.txt,.zip" 
        (change)="onFileSelected($event)"
        style="display: none;">
    </div>
  `,
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponent {
  @Input() disabled = false;
  @Output() onSendMessage = new EventEmitter<{ content: string; attachments: File[] }>();

  @ViewChild('messageInput', { static: false }) messageInputRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  messageText = '';
  selectedAttachments: File[] = [];
  isSending = false;

  constructor() {
    addIcons({
      attachOutline,
      sendOutline,
      closeOutline
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(): void {
    const textarea = this.messageInputRef?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  canSend(): boolean {
    return this.messageText.trim().length > 0 || this.selectedAttachments.length > 0;
  }

  async sendMessage(): Promise<void> {
    if (!this.canSend() || this.isSending) return;

    const content = this.messageText.trim();
    const attachments = [...this.selectedAttachments];

    // Clear input immediately
    this.messageText = '';
    this.selectedAttachments = [];
    this.autoResize();

    this.isSending = true;

    try {
      this.onSendMessage.emit({ content, attachments });

      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      // Restore content on error
      this.messageText = content;
      this.selectedAttachments = attachments;
    } finally {
      this.isSending = false;
    }
  }

  openFilePicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      const selectedFiles = Array.from(files);

      // Validate file sizes (max 10MB per file)
      const maxSize = 10 * 1024 * 1024;
      const validFiles = selectedFiles.filter(file => file.size <= maxSize);

      this.selectedAttachments = [...this.selectedAttachments, ...validFiles];
    }

    // Clear file input
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  removeAttachment(index: number): void {
    this.selectedAttachments.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}