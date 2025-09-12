// src/app/core/guards/project-owner.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take, switchMap, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service';
import { UserRole } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class ProjectOwnerGuard implements CanActivate {
    private authService = inject(AuthService);
    private projectService = inject(ProjectService);
    private router = inject(Router);

    canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
        const projectId = route.params['id'] || route.params['projectId'];

        if (!projectId) {
            return of(this.router.createUrlTree(['/projects']));
        }

        return this.authService.currentUser$.pipe(
            take(1),
            switchMap(user => {
                if (!user) {
                    return of(this.router.createUrlTree(['/auth/login']));
                }

                // Admin can access all projects
                if (user.role === UserRole.ADMIN) {
                    return of(true);
                }

                // Check project ownership
                return this.projectService.getProjectById(projectId).then(response => {
                    if (!response.success || !response.data) {
                        return this.router.createUrlTree(['/projects']);
                    }

                    const project = response.data;

                    // Client must own the project
                    if (user.role === UserRole.CLIENT && project.clientId === user.uid) {
                        return true;
                    }

                    // Freelancer must be assigned to the project
                    if (user.role === UserRole.FREELANCER && project.assignedFreelancerId === user.uid) {
                        return true;
                    }

                    return this.router.createUrlTree(['/projects']);
                });
            })
        );
    }
}

