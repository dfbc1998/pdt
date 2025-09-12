// src/app/core/guards/auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): Observable<boolean | UrlTree> {
        return this.authService.isLoading$.pipe(
            take(1),
            switchMap(isLoading => {
                if (isLoading) {
                    // Still loading, wait for auth state to resolve
                    return this.authService.currentUser$.pipe(take(1));
                } else {
                    return this.authService.currentUser$.pipe(take(1));
                }
            }),
            map(user => {
                const firebaseUser = this.authService.auth.currentUser;

                // If user is authenticated in Firebase but no user document exists
                if (firebaseUser && !user) {
                    console.log('User authenticated but no document found, redirecting to recovery');
                    return this.router.createUrlTree(['/auth/user-recovery']);
                }

                // If user exists and has complete data
                if (user && user.role) {
                    return true;
                }

                // If no user, redirect to login
                if (!user && !firebaseUser) {
                    return this.router.createUrlTree(['/auth/login']);
                }

                // Default case
                return this.router.createUrlTree(['/auth/login']);
            })
        );
    }
}