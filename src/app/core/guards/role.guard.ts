// src/app/core/guards/role.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
        const allowedRoles = route.data['roles'] as UserRole[];

        if (!allowedRoles || allowedRoles.length === 0) {
            return this.authService.currentUser$.pipe(
                take(1),
                map(user => !!user)
            );
        }

        return this.authService.currentUser$.pipe(
            take(1),
            map(user => {
                if (!user) {
                    return this.router.createUrlTree(['/auth/login']);
                }

                if (allowedRoles.includes(user.role)) {
                    return true;
                }

                // Redirect based on user role
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


