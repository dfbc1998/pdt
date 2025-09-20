// src/app/app.routes.ts - ACTUALIZACIÓN COMPLETA
import { Routes } from '@angular/router';
import { AuthGuard, RoleGuard, GuestGuard, ProfileSetupGuard, AdminGuard, ProjectOwnerGuard } from './core/guards';
import { UserRole } from './core/interfaces';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Authentication routes (guest only)
  {
    path: 'auth',
    canActivate: [GuestGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      }
    ]
  },

  // Dashboard routes (authenticated users only)
  {
    path: 'dashboard',
    canActivate: [AuthGuard, ProfileSetupGuard],
    children: [
      {
        path: '',
        // CAMBIO PRINCIPAL: Reemplazamos MainDashboardComponent con DashboardRedirectComponent
        loadComponent: () => import('./shared/components/dashboard-redirect/dashboard-redirect.component').then(m => m.DashboardRedirectComponent)
      },
      {
        path: 'client',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.CLIENT] },
        loadComponent: () => import('./features/dashboard/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent)
      },
      {
        path: 'freelancer',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.FREELANCER] },
        loadComponent: () => import('./features/dashboard/freelancer-dashboard/freelancer-dashboard.component').then(m => m.FreelancerDashboardComponent)
      },
      {
        path: 'admin',
        canActivate: [AdminGuard],
        loadComponent: () => import('./features/dashboard/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      }
    ]
  },

  // Project routes
  {
    path: 'projects',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'create',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.CLIENT] },
        loadComponent: () => import('./features/projects/project-create/project-create.component').then(m => m.ProjectCreateComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: ':id/edit',
        canActivate: [ProjectOwnerGuard],
        loadComponent: () => import('./features/projects/project-edit/project-edit.component').then(m => m.ProjectEditComponent)
      }
    ]
  },

  // Proposals routes
  {
    path: 'proposals',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'received',
        pathMatch: 'full'
      },
      {
        path: 'received',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.CLIENT] },
        loadComponent: () => import('./features/proposals/received-proposals/received-proposals.component').then(m => m.ReceivedProposalsComponent)
      },
      {
        path: 'my-proposals',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.FREELANCER] },
        loadComponent: () => import('./features/proposals/my-proposals/my-proposals.component').then(m => m.MyProposalsComponent)
      },
      {
        path: 'create/:projectId',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.FREELANCER] },
        loadComponent: () => import('./features/proposals/proposal-create/proposal-create.component').then(m => m.ProposalCreateComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/proposals/proposal-detail/proposal-detail.component').then(m => m.ProposalDetailComponent)
      }
    ]
  },

  // Profile routes
  {
    path: 'profile',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/profile/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
      },
      {
        path: 'client/setup',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.CLIENT] },
        loadComponent: () => import('./features/profile/client-profile-setup/client-profile-setup.component').then(m => m.ClientProfileSetupComponent)
      },
      {
        path: 'freelancer/setup',
        canActivate: [RoleGuard],
        data: { roles: [UserRole.FREELANCER] },
        loadComponent: () => import('./features/profile/freelancer-profile-setup/freelancer-profile-setup.component').then(m => m.FreelancerProfileSetupComponent)
      },
      {
        path: 'edit',
        loadComponent: () => import('./features/profile/profile-edit/profile-edit.component').then(m => m.ProfileEditComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/profile/profile-public/profile-public.component').then(m => m.ProfilePublicComponent)
      }
    ]
  },

  // Freelancer discovery
  {
    path: 'freelancers',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/freelancers/freelancer-list/freelancer-list.component').then(m => m.FreelancerListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/freelancers/freelancer-detail/freelancer-detail.component').then(m => m.FreelancerDetailComponent)
      }
    ]
  },

  // Chat/Messages
  {
    path: 'messages',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/chat/chat-list/chat-list.component').then(m => m.ChatListComponent)
      },
      {
        path: ':projectId',
        loadComponent: () => import('./features/chat/chat-room/chat-room.component').then(m => m.ChatRoomComponent)
      }
    ]
  },

  // File management
  {
    path: 'files',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/files/file-manager/file-manager.component').then(m => m.FileManagerComponent)
      },
      {
        path: 'upload',
        loadComponent: () => import('./features/files/file-upload/file-upload.component').then(m => m.FileUploadComponent)
      }
    ]
  },

  // Settings
  {
    path: 'settings',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/settings/settings-main/settings-main.component').then(m => m.SettingsMainComponent)
      },
      {
        path: 'account',
        loadComponent: () => import('./features/settings/account-settings/account-settings.component').then(m => m.AccountSettingsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/settings/notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent)
      },
      {
        path: 'privacy',
        loadComponent: () => import('./features/settings/privacy-settings/privacy-settings.component').then(m => m.PrivacySettingsComponent)
      }
    ]
  },

  // Public pages
  {
    path: 'about',
    loadComponent: () => import('./features/public/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/public/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/public/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/public/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },

  // Error pages
  {
    path: '404',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '403',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/404'
  }
];