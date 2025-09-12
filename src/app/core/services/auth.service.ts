// src/app/core/services/auth.service.ts
import { Injectable, inject, NgZone } from '@angular/core';
import { Auth, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
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
            await signOut(this.auth);
            this.currentUserSubject.next(null);
            this.router.navigate(['/auth/login']);
        } catch (error) {
            console.error('Logout error:', error);
        }
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

    getCurrentFirebaseUser(): FirebaseUser | null {
        return this.auth.currentUser;
    }

    async recreateUserDocument(role: UserRole): Promise<ApiResponse<User>> {
        try {
            const firebaseUser = this.getCurrentFirebaseUser();
            if (!firebaseUser) {
                return {
                    success: false,
                    error: 'No authenticated Firebase user found'
                };
            }

            // Create user document in Firestore
            const user: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                photoURL: firebaseUser.photoURL || undefined,
                role: role,
                isEmailVerified: firebaseUser.emailVerified,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };

            await this.createUserDocument(user);

            // ✅ CORREGIDO: Esperar un poco para que Firestore se actualice
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ CORREGIDO: Verificar que el documento se creó correctamente
            try {
                const createdUser = await this.getUserData(firebaseUser.uid);
                this.currentUserSubject.next(createdUser);

                return {
                    success: true,
                    data: createdUser,
                    message: 'User document recreated successfully'
                };
            } catch (verifyError) {
                // ✅ CORREGIDO: Incluso si no podemos verificar, considerar éxito
                this.currentUserSubject.next(user);

                return {
                    success: true,
                    data: user,
                    message: 'User document recreated successfully'
                };
            }
        } catch (error: any) {
            console.error('Error recreating user document:', error);
            return {
                success: false,
                error: error.message || 'Failed to recreate user document'
            };
        }
    }

    // ✅ CORREGIDO: Mejorar manejo de errores en getUserData
    private async getUserData(uid: string): Promise<User> {
        try {
            const userRef = doc(this.firestore, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                throw new Error('User document not found');
            }

            const userData = userSnap.data();

            // ✅ CORREGIDO: Validar que los datos necesarios existen
            if (!userData) {
                throw new Error('User document is empty');
            }

            return {
                uid,
                email: userData['email'] || '',
                displayName: userData['displayName'] || '',
                photoURL: userData['photoURL'],
                role: userData['role'],
                isEmailVerified: userData['isEmailVerified'] || false,
                createdAt: userData['createdAt']?.toDate() || new Date(),
                updatedAt: userData['updatedAt']?.toDate() || new Date(),
                isActive: userData['isActive'] ?? true
            };
        } catch (error: any) {
            console.error('Error getting user data for uid:', uid, error);
            throw error;
        }
    }

    private async createUserDocument(user: User): Promise<void> {
        try {
            const userRef = doc(this.firestore, 'users', user.uid);

            // ✅ CORREGIDO: Asegurar que los datos estén bien formateados
            const userData = {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL || null,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                isActive: user.isActive
            };

            await setDoc(userRef, userData);
            console.log('User document created successfully for:', user.uid);
        } catch (error: any) {
            console.error('Error creating user document:', error);
            throw error;
        }
    }

    private redirectAfterLogin(role: UserRole): void {
        this.ngZone.run(() => {
            switch (role) {
                case UserRole.CLIENT:
                    this.router.navigate(['/dashboard/client']);
                    break;
                case UserRole.FREELANCER:
                    this.router.navigate(['/dashboard/freelancer']);
                    break;
                case UserRole.ADMIN:
                    this.router.navigate(['/dashboard/admin']);
                    break;
                default:
                    this.router.navigate(['/dashboard']);
            }
        });
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
}