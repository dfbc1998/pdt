// src/app/features/profile/profile-public/profile-public.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-profile-public',
  standalone: true,
  imports: [CommonModule, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, HeaderComponent],
  template: `
    <app-header title="Perfil Público"></app-header>
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Perfil Público</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Vista pública del perfil - En desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class ProfilePublicComponent { }

// Componentes restantes de una línea para evitar errores de compilación
export class FreelancerListComponent { static template = '<ion-content><p>Lista de Freelancers - En desarrollo</p></ion-content>'; }
export class FreelancerDetailComponent { static template = '<ion-content><p>Detalle de Freelancer - En desarrollo</p></ion-content>'; }
export class ChatListComponent { static template = '<ion-content><p>Lista de Chats - En desarrollo</p></ion-content>'; }
export class ChatRoomComponent { static template = '<ion-content><p>Sala de Chat - En desarrollo</p></ion-content>'; }
export class FileManagerComponent { static template = '<ion-content><p>Gestor de Archivos - En desarrollo</p></ion-content>'; }
export class FileUploadComponent { static template = '<ion-content><p>Subir Archivos - En desarrollo</p></ion-content>'; }
export class SettingsMainComponent { static template = '<ion-content><p>Configuración - En desarrollo</p></ion-content>'; }
export class AccountSettingsComponent { static template = '<ion-content><p>Configuración de Cuenta - En desarrollo</p></ion-content>'; }
export class NotificationSettingsComponent { static template = '<ion-content><p>Configuración de Notificaciones - En desarrollo</p></ion-content>'; }
export class PrivacySettingsComponent { static template = '<ion-content><p>Configuración de Privacidad - En desarrollo</p></ion-content>'; }
export class AboutComponent { static template = '<ion-content><p>Acerca de - En desarrollo</p></ion-content>'; }
export class ContactComponent { static template = '<ion-content><p>Contacto - En desarrollo</p></ion-content>'; }
export class TermsComponent { static template = '<ion-content><p>Términos y Condiciones - En desarrollo</p></ion-content>'; }
export class PrivacyPolicyComponent { static template = '<ion-content><p>Política de Privacidad - En desarrollo</p></ion-content>'; }