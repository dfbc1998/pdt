// src/app/core/guards/auth.guard.ts - REEMPLAZAR COMPLETO
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take, filter, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    canActivate(): Observable<boolean | UrlTree> {
        // Esperar a que termine de cargar el estado de autenticación
        return this.authService.isLoading$.pipe(
            filter(isLoading => !isLoading), // Solo continuar cuando ya no esté cargando
            take(1),
            switchMap(() => this.authService.currentUser$.pipe(take(1))),
            map(user => {
                // Si no hay usuario autenticado, redirigir a login
                if (!user) {
                    console.log('No authenticated user, redirecting to login');
                    return this.router.createUrlTree(['/auth/login']);
                }

                // Si el usuario existe y tiene rol, permitir acceso
                if (user && user.role) {
                    console.log('User authenticated with role:', user.role);
                    return true;
                }

                // Si hay problemas con el usuario, redirigir a recuperación
                console.log('User exists but incomplete data, redirecting to recovery');
                return this.router.createUrlTree(['/auth/user-recovery']);
            })
        );
    }
}