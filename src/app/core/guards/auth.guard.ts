// src/app/core/guards/auth.guard.ts - REEMPLAZAR COMPLETO
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take, filter, switchMap, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): Observable<boolean | UrlTree> {
        console.log('🔐 AuthGuard: Checking authentication...');

        return this.authService.isLoading$.pipe(
            // Wait for auth to finish loading, but with timeout
            filter(isLoading => {
                console.log('🔄 AuthGuard: Auth loading state:', isLoading);
                return !isLoading;
            }),
            take(1),
            timeout(15000), // 15 second timeout for auth loading
            switchMap(() => {
                console.log('✅ AuthGuard: Auth finished loading, checking user...');
                return this.authService.currentUser$.pipe(take(1));
            }),
            map(user => {
                console.log('👤 AuthGuard: Current user:', user ? `${user.email} (${user.role})` : 'null');

                // If no user, redirect to login
                if (!user) {
                    console.log('❌ AuthGuard: No user found, redirecting to login');
                    return this.router.createUrlTree(['/auth/login']);
                }

                // If user exists and has role, allow access
                if (user && user.role) {
                    console.log('✅ AuthGuard: User authenticated with role, allowing access');
                    return true;
                }

                // If user exists but has incomplete data, redirect to recovery
                console.log('⚠️ AuthGuard: User incomplete, redirecting to recovery');
                return this.router.createUrlTree(['/auth/user-recovery']);
            }),
            catchError(error => {
                console.error('💥 AuthGuard: Error during authentication check:', error);

                // On timeout or other errors, redirect to login
                return of(this.router.createUrlTree(['/auth/login']));
            })
        );
    }
}