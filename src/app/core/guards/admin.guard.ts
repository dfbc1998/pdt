// src/app/core/guards/admin.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): Observable<boolean | UrlTree> {
        return this.authService.currentUser$.pipe(
            take(1),
            map(user => {
                if (!user) {
                    return this.router.createUrlTree(['/auth/login']);
                }

                if (user.role === UserRole.ADMIN) {
                    return true;
                }

                // Redirect non-admin users
                return this.router.createUrlTree(['/dashboard']);
            })
        );
    }
}

