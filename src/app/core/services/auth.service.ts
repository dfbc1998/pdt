import { Injectable, inject } from '@angular/core';
import { Auth, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole, LoginRequest, RegisterRequest, ApiResponse } from '../interfaces';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    private loadingSubject = new BehaviorSubject<boolean>(true);

    public currentUser$ = this.currentUserSubject.asObservable();
    public isLoading$ = this.loadingSubject.asObservable();

    constructor() {
        this.initAuthListener();
    }

    private initAuthListener(): void {
        onAuthStateChanged(this.auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const user = await this.getUserData(firebaseUser.uid);
                    this.currentUserSubject.next(user);
                } catch (error) {
                    console.error('Error loading user data:', error);
                    this.currentUserSubject.next(null);
                }
            } else {
                this.currentUserSubject.next(null);
            }
            this.loadingSubject.next(false);
        });
    }

    async login(credentials: LoginRequest): Promise<ApiResponse<User>> {
        try {
            const result = await signInWithEmailAndPassword(
                this.auth,
                credentials.email,
                credentials.password
            );

            // Wait a moment for the auth state listener to process
            await new Promise(resolve => setTimeout(resolve, 500));

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
                // Don't redirect here, let the auth guard handle it
                return {
                    success: true,
                    data: null as any, // This will trigger the recovery flow
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

            await this.createUserDocument(user);

            // Send email verification
            await sendEmailVerification(result.user);

            this.currentUserSubject.next(user);

            // Redirect to appropriate onboarding
            this.redirectAfterRegistration(userData.role);

            return {
                success: true,
                data: user,
                message: 'Registration successful. Please check your email for verification.'
            };
        } catch (error: any) {
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

    private async getUserData(uid: string): Promise<User> {
        const userRef = doc(this.firestore, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User document not found');
        }

        const userData = userSnap.data();
        return {
            uid,
            email: userData['email'],
            displayName: userData['displayName'],
            photoURL: userData['photoURL'],
            role: userData['role'],
            isEmailVerified: userData['isEmailVerified'],
            createdAt: userData['createdAt']?.toDate() || new Date(),
            updatedAt: userData['updatedAt']?.toDate() || new Date(),
            isActive: userData['isActive'] ?? true
        };
    }

    private async createUserDocument(user: User): Promise<void> {
        const userRef = doc(this.firestore, 'users', user.uid);
        await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            isActive: user.isActive
        });
    }

    private redirectAfterLogin(role: UserRole): void {
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
    }

    private redirectAfterRegistration(role: UserRole): void {
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