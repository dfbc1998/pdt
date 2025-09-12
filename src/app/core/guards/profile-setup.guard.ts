// src/app/core/guards/profile-setup.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { UserRole } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class ProfileSetupGuard implements CanActivate {
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private router = inject(Router);

    canActivate(): Observable<boolean | UrlTree> {
        return this.authService.currentUser$.pipe(
            take(1),
            switchMap(user => {
                if (!user) {
                    return [this.router.createUrlTree(['/auth/login'])];
                }

                // Check if profile is set up
                if (user.role === UserRole.CLIENT) {
                    return this.userService.getClientProfile(user.uid).then(response => {
                        if (response.success && response.data) {
                            const isComplete = this.userService.isClientProfileComplete(response.data);
                            return isComplete ? true : this.router.createUrlTree(['/profile/client/setup']);
                        }
                        return this.router.createUrlTree(['/profile/client/setup']);
                    });
                } else if (user.role === UserRole.FREELANCER) {
                    return this.userService.getFreelancerProfile(user.uid).then(response => {
                        if (response.success && response.data) {
                            const isComplete = this.userService.isFreelancerProfileComplete(response.data);
                            return isComplete ? true : this.router.createUrlTree(['/profile/freelancer/setup']);
                        }
                        return this.router.createUrlTree(['/profile/freelancer/setup']);
                    });
                }

                return [true];
            })
        );
    }
}

