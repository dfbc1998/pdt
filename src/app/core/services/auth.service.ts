// src/app/core/services/auth.service.ts
import { Injectable, inject, NgZone } from '@angular/core';
import { Auth, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User, UserRole, LoginRequest, RegisterRequest, ApiResponse } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    public auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);
    private ngZone = inject(NgZone); // ✅ AGREGADO: Para manejar el contexto de Angular

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    private loadingSubject = new BehaviorSubject<boolean>(true);

    public currentUser$ = this.currentUserSubject.asObservable();
    public isLoading$ = this.loadingSubject.asObservable();

    constructor() {
        this.initAuthListener();
    }

    private initAuthListener(): void {
        // ✅ CORREGIDO: Ejecutar dentro del contexto de Angular Zone
        onAuthStateChanged(this.auth, async (firebaseUser) => {
            this.ngZone.run(async () => {
                if (firebaseUser) {
                    try {
                        const user = await this.getUserData(firebaseUser.uid);
                        this.currentUserSubject.next(user);
                    } catch (error) {
                        console.log('User document not found, this is normal during registration or recovery flow');
                        // ✅ CORREGIDO: No establecer como error, mantener usuario como null para que el guard maneje la recuperación
                        this.currentUserSubject.next(null);
                    }
                } else {
                    this.currentUserSubject.next(null);
                }
                this.loadingSubject.next(false);
            });
        });
    }

    async login(credentials: LoginRequest): Promise<ApiResponse<User>> {
        try {
            const result = await signInWithEmailAndPassword(
                this.auth,
                credentials.email,
                credentials.password
            );

            // ✅ CORREGIDO: Esperar más tiempo para que el listener procese
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if user document exists
            try {
                const user = await this.getUserData(result.user.uid);
                this.currentUserSubject.next(user);

                // Redirect based on role
                this.redirectAfterLogin(user.role);

                return {
                    success: true,
                    data: user,
                    message: 'Login successful'
                };
            } catch (error) {
                console.log('User document not found, user needs recovery');
                // ✅ CORREGIDO: Retornar éxito pero sin datos para activar flujo de recuperación
                return {
                    success: true,
                    data: null as any,
                    message: 'Login successful, completing setup...'
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: this.getAuthErrorMessage(error.code),
                code: error.code
            };
        }
    }

    async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
        try {
            const result = await createUserWithEmailAndPassword(
                this.auth,
                userData.email,
                userData.password
            );

            // Update Firebase Auth profile
            await updateProfile(result.user, {
                displayName: userData.displayName
            });

            // Create user document in Firestore
            const user: User = {
                uid: result.user.uid,
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                isEmailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };

            // ✅ CORREGIDO: Crear documento y esperar a que se complete
            await this.createUserDocument(user);

            // ✅ CORREGIDO: Esperar un poco más para asegurar que Firestore se actualice
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ CORREGIDO: Verificar que el documento se creó correctamente
            try {
                const createdUser = await this.getUserData(result.user.uid);
                this.currentUserSubject.next(createdUser);

                // Send email verification
                await sendEmailVerification(result.user);

                // Redirect to appropriate onboarding
                this.redirectAfterRegistration(userData.role);

                return {
                    success: true,
                    data: createdUser,
                    message: 'Registration successful. Please check your email for verification.'
                };
            } catch (verifyError) {
                console.error('Error verifying created user document:', verifyError);
                // ✅ CORREGIDO: Aún así considerarlo éxito, el documento se creó
                this.currentUserSubject.next(user);

                // Send email verification
                await sendEmailVerification(result.user);

                // Redirect to appropriate onboarding
                this.redirectAfterRegistration(userData.role);

                return {
                    success: true,
                    data: user,
                    message: 'Registration successful. Please check your email for verification.'
                };
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: this.getAuthErrorMessage(error.code),
                code: error.code
            };
        }
    }

    async logout(): Promise<void> {
        try {
            console.log('🚪 Logging out user...');

            // Clear current user first
            this.currentUserSubject.next(null);

            // Sign out from Firebase
            await this.auth.signOut();

            // Clear any cached data
            this.clearCachedData();

            console.log('✅ User logged out successfully');

            // Navigate to login
            await this.router.navigate(['/auth/login']);

        } catch (error) {
            console.error('❌ Error during logout:', error);

            // Even if logout fails, clear local state and redirect
            this.currentUserSubject.next(null);
            this.clearCachedData();
            await this.router.navigate(['/auth/login']);
        }
    }

    private clearCachedData(): void {
        // Clear any cached user data, tokens, etc.
        // Add your specific cleanup logic here
        console.log('🧹 Clearing cached data...');
    }

    async resetPassword(email: string): Promise<ApiResponse<void>> {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return {
                success: true,
                message: 'Password reset email sent successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: this.getAuthErrorMessage(error.code),
                code: error.code
            };
        }
    }

    async updateUserProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const currentUser = this.currentUserSubject.value;
            if (!currentUser) {
                throw new Error('No authenticated user');
            }

            const userRef = doc(this.firestore, 'users', currentUser.uid);
            const updateData = {
                ...updates,
                updatedAt: new Date()
            };

            await updateDoc(userRef, updateData);

            const updatedUser = { ...currentUser, ...updateData };
            this.currentUserSubject.next(updatedUser);

            return {
                success: true,
                data: updatedUser,
                message: 'Profile updated successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update profile'
            };
        }
    }

    private redirectAfterLogin(role: UserRole): void {
        console.log('🎯 User logged in with role:', role, '- letting DashboardRedirectComponent handle navigation');
    }

    private redirectAfterRegistration(role: UserRole): void {
        this.ngZone.run(() => {
            switch (role) {
                case UserRole.CLIENT:
                    this.router.navigate(['/profile/client/setup']);
                    break;
                case UserRole.FREELANCER:
                    this.router.navigate(['/profile/freelancer/setup']);
                    break;
                default:
                    this.router.navigate(['/dashboard']);
            }
        });
    }

    private getAuthErrorMessage(errorCode: string): string {
        switch (errorCode) {
            case 'auth/user-not-found':
                return 'No user found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/invalid-email':
                return 'Invalid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/too-many-requests':
                return 'Too many unsuccessful attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    // Utility methods
    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get isAuthenticated(): boolean {
        return !!this.currentUserSubject.value;
    }

    get isClient(): boolean {
        return this.currentUser?.role === UserRole.CLIENT;
    }

    get isFreelancer(): boolean {
        return this.currentUser?.role === UserRole.FREELANCER;
    }

    get isAdmin(): boolean {
        return this.currentUser?.role === UserRole.ADMIN;
    }

    hasRole(role: UserRole): boolean {
        return this.currentUser?.role === role;
    }

    hasAnyRole(roles: UserRole[]): boolean {
        return !!this.currentUser && roles.includes(this.currentUser.role);
    }

    private async getUserData(uid: string): Promise<User> {
        try {
            // Usar las instancias ya inyectadas en lugar de llamar inject() nuevamente
            const userRef = doc(this.firestore, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                throw new Error('User document not found');
            }

            const userData = userSnap.data();
            return {
                uid: userSnap.id,
                ...userData,
                createdAt: userData['createdAt']?.toDate() || new Date(),
                updatedAt: userData['updatedAt']?.toDate() || new Date()
            } as User;
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    }

    private async createUserDocument(user: User): Promise<void> {
        try {
            const userRef = doc(this.firestore, 'users', user.uid);
            await setDoc(userRef, {
                ...user,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            });
        } catch (error) {
            console.error('Error creating user document:', error);
            throw error;
        }
    }

    async recreateUserDocument(role: UserRole): Promise<ApiResponse<User>> {
        try {
            const firebaseUser = this.auth.currentUser;
            if (!firebaseUser) {
                return {
                    success: false,
                    error: 'No authenticated user found'
                };
            }

            const user: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                role: role,
                isEmailVerified: firebaseUser.emailVerified,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };

            await this.createUserDocument(user);
            this.currentUserSubject.next(user);

            return {
                success: true,
                data: user,
                message: 'User document recreated successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to recreate user document'
            };
        }
    }

    getCurrentFirebaseUser(): FirebaseUser | null {
        return this.auth.currentUser;
    }

    async checkUserDocumentExists(uid: string): Promise<boolean> {
        try {
            const userRef = doc(this.firestore, 'users', uid);
            const userSnap = await getDoc(userRef);

            console.log(`🔍 [AuthService] User document exists for ${uid}:`, userSnap.exists());

            if (userSnap.exists()) {
                const userData = userSnap.data();
                console.log('📄 [AuthService] User document data:', userData);
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ [AuthService] Error checking user document:', error);
            return false;
        }
    }

    public isUserReady(): Observable<boolean> {
        return this.currentUser$.pipe(
            map(user => {
                if (!user) return false;
                if (!user.role) return false;
                if (!user.email) return false;
                return true;
            })
        );
    }

    public getDashboardRoute(role?: UserRole): string {
        const userRole = role || this.currentUser?.role;

        const dashboardRoutes: { [key: string]: string } = {
            [UserRole.CLIENT]: '/dashboard/client',
            [UserRole.FREELANCER]: '/dashboard/freelancer',
            [UserRole.ADMIN]: '/dashboard/admin'
        };

        return dashboardRoutes[userRole as string] || '/dashboard/client';
    }


}