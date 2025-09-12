// src/app/core/guards/guest.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class GuestGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): Observable<boolean | UrlTree> {
        return this.authService.currentUser$.pipe(
            take(1),
            map(user => {
                if (!user) {
                    return true; // Allow access for guests
                }

                // Redirect authenticated users to their dashboard
                switch (user.role) {
                    case UserRole.CLIENT:
                        return this.router.createUrlTree(['/dashboard/client']);
                    case UserRole.FREELANCER:
                        return this.router.createUrlTree(['/dashboard/freelancer']);
                    case UserRole.ADMIN:
                        return this.router.createUrlTree(['/dashboard/admin']);
                    default:
                        return this.router.createUrlTree(['/dashboard']);
                }
            })
        );
    }
}

