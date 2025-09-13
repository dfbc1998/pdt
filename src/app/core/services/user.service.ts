import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, orderBy, limit } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of } from 'rxjs';
import { User, ClientProfile, FreelancerProfile, UserRole, ApiResponse, VerificationStatus } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private readonly CLIENT_PROFILES_COLLECTION = 'client_profiles';
    private readonly FREELANCER_PROFILES_COLLECTION = 'freelancer_profiles';

    constructor() { }

    // Client Profile Management
    async createClientProfile(profileData: Omit<ClientProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'averageRating' | 'totalProjects' | 'totalSpent' | 'verificationStatus'>): Promise<ApiResponse<ClientProfile>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser || !this.authService.isClient) {
                return {
                    success: false,
                    error: 'Only clients can create client profiles'
                };
            }

            // Check if profile already exists
            const existingProfile = await this.getClientProfile(currentUser.uid);
            if (existingProfile.success && existingProfile.data) {
                return {
                    success: false,
                    error: 'Client profile already exists'
                };
            }

            const profileToCreate: ClientProfile = {
                id: currentUser.uid,
                userId: currentUser.uid,
                ...profileData,
                averageRating: 0,
                totalProjects: 0,
                totalSpent: 0,
                verificationStatus: VerificationStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const profileRef = doc(this.firestore, this.CLIENT_PROFILES_COLLECTION, currentUser.uid);
            await setDoc(profileRef, this.convertToFirestore(profileToCreate));

            return {
                success: true,
                data: profileToCreate,
                message: 'Client profile created successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create client profile'
            };
        }
    }

    async updateClientProfile(profileId: string, updates: Partial<ClientProfile>): Promise<ApiResponse<ClientProfile>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Users can only update their own profile unless they're admin
            if (profileId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only update your own profile'
                };
            }

            const profileRef = doc(this.firestore, this.CLIENT_PROFILES_COLLECTION, profileId);
            const updateData = {
                ...updates,
                updatedAt: new Date()
            };

            await updateDoc(profileRef, this.convertToFirestore(updateData));

            // Get updated profile
            const updatedProfile = await this.getClientProfile(profileId);
            return updatedProfile;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update client profile'
            };
        }
    }

    // Freelancer Profile Management
    async createFreelancerProfile(profileData: Omit<FreelancerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'averageRating' | 'totalEarnings' | 'completedProjects' | 'successRate' | 'responseTime' | 'verificationStatus'>): Promise<ApiResponse<FreelancerProfile>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser || !this.authService.isFreelancer) {
                return {
                    success: false,
                    error: 'Only freelancers can create freelancer profiles'
                };
            }

            // Check if profile already exists
            const existingProfile = await this.getFreelancerProfile(currentUser.uid);
            if (existingProfile.success && existingProfile.data) {
                return {
                    success: false,
                    error: 'Freelancer profile already exists'
                };
            }

            const profileToCreate: FreelancerProfile = {
                id: currentUser.uid,
                userId: currentUser.uid,
                ...profileData,
                averageRating: 0,
                totalEarnings: 0,
                completedProjects: 0,
                successRate: 0,
                responseTime: 24, // Default 24 hours
                verificationStatus: VerificationStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const profileRef = doc(this.firestore, this.FREELANCER_PROFILES_COLLECTION, currentUser.uid);
            await setDoc(profileRef, this.convertToFirestore(profileToCreate));

            return {
                success: true,
                data: profileToCreate,
                message: 'Freelancer profile created successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create freelancer profile'
            };
        }
    }

    async updateFreelancerProfile(profileId: string, updates: Partial<FreelancerProfile>): Promise<ApiResponse<FreelancerProfile>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Users can only update their own profile unless they're admin
            if (profileId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only update your own profile'
                };
            }

            const profileRef = doc(this.firestore, this.FREELANCER_PROFILES_COLLECTION, profileId);
            const updateData = {
                ...updates,
                updatedAt: new Date()
            };

            await updateDoc(profileRef, this.convertToFirestore(updateData));

            // Get updated profile
            const updatedProfile = await this.getFreelancerProfile(profileId);
            return updatedProfile;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update freelancer profile'
            };
        }
    }

    // Search freelancers
    async searchFreelancers(skills?: string[], limitCount: number = 20): Promise<ApiResponse<FreelancerProfile[]>> {
        try {
            let freelancersQuery;

            if (skills && skills.length > 0) {
                freelancersQuery = query(
                    collection(this.firestore, this.FREELANCER_PROFILES_COLLECTION),
                    where('skills', 'array-contains-any', skills),
                    orderBy('averageRating', 'desc'),
                    limit(limitCount)
                );
            } else {
                freelancersQuery = query(
                    collection(this.firestore, this.FREELANCER_PROFILES_COLLECTION),
                    orderBy('averageRating', 'desc'),
                    limit(limitCount)
                );
            }

            const querySnapshot = await getDocs(freelancersQuery);
            const freelancers: FreelancerProfile[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data['createdAt']?.toDate() || new Date(),
                    updatedAt: data['updatedAt']?.toDate() || new Date()
                } as FreelancerProfile;
            });

            return {
                success: true,
                data: freelancers
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to search freelancers'
            };
        }
    }

    // Get top freelancers
    async getTopFreelancers(limitCount: number = 10): Promise<ApiResponse<FreelancerProfile[]>> {
        try {
            const freelancersQuery = query(
                collection(this.firestore, this.FREELANCER_PROFILES_COLLECTION),
                where('averageRating', '>=', 4.0),
                orderBy('averageRating', 'desc'),
                orderBy('completedProjects', 'desc'),
                limit(limitCount)
            );

            const querySnapshot = await getDocs(freelancersQuery);
            const freelancers: FreelancerProfile[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data['createdAt']?.toDate() || new Date(),
                    updatedAt: data['updatedAt']?.toDate() || new Date()
                } as FreelancerProfile;
            });

            return {
                success: true,
                data: freelancers
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get top freelancers'
            };
        }
    }

    // Get profile completion percentage
    getClientProfileCompletion(profile: ClientProfile): number {
        const requiredFields = [
            'companyName',
            'industry',
            'location',
            'description',
            'phone',
            'website'
        ];

        const completedFields = requiredFields.filter(field =>
            profile[field as keyof ClientProfile]
        ).length;

        return Math.round((completedFields / requiredFields.length) * 100);
    }

    getFreelancerProfileCompletion(profile: FreelancerProfile): number {
        const requiredFields = [
            'firstName',
            'lastName',
            'title',
            'bio',
            'location',
            'hourlyRate'
        ];

        let completedFields = requiredFields.filter(field =>
            profile[field as keyof FreelancerProfile]
        ).length;

        // Add points for arrays/objects
        if (profile.skills?.length > 0) completedFields++;
        if (profile.languages?.length > 0) completedFields++;
        if (profile.education?.length > 0) completedFields++;
        if (profile.portfolio?.length > 0) completedFields++;

        const totalFields = requiredFields.length + 4; // +4 for array fields
        return Math.round((completedFields / totalFields) * 100);
    }

    // Skills management
    async addSkill(freelancerId: string, skill: string): Promise<ApiResponse<FreelancerProfile>> {
        try {
            const profileResponse = await this.getFreelancerProfile(freelancerId);
            if (!profileResponse.success || !profileResponse.data) {
                return {
                    success: false,
                    error: 'Freelancer profile not found'
                };
            }

            const profile = profileResponse.data;
            const currentSkills = profile.skills || [];

            if (currentSkills.includes(skill)) {
                return {
                    success: false,
                    error: 'Skill already exists'
                };
            }

            const updatedSkills = [...currentSkills, skill];

            return await this.updateFreelancerProfile(freelancerId, {
                skills: updatedSkills
            });
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to add skill'
            };
        }
    }

    async removeSkill(freelancerId: string, skill: string): Promise<ApiResponse<FreelancerProfile>> {
        try {
            const profileResponse = await this.getFreelancerProfile(freelancerId);
            if (!profileResponse.success || !profileResponse.data) {
                return {
                    success: false,
                    error: 'Freelancer profile not found'
                };
            }

            const profile = profileResponse.data;
            const updatedSkills = (profile.skills || []).filter(s => s !== skill);

            return await this.updateFreelancerProfile(freelancerId, {
                skills: updatedSkills
            });
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to remove skill'
            };
        }
    }

    // Portfolio management
    async addPortfolioItem(freelancerId: string, portfolioItem: any): Promise<ApiResponse<FreelancerProfile>> {
        try {
            const profileResponse = await this.getFreelancerProfile(freelancerId);
            if (!profileResponse.success || !profileResponse.data) {
                return {
                    success: false,
                    error: 'Freelancer profile not found'
                };
            }

            const profile = profileResponse.data;
            const currentPortfolio = profile.portfolio || [];

            const newPortfolioItem = {
                id: `portfolio_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                ...portfolioItem,
                completionDate: portfolioItem.completionDate || new Date()
            };

            const updatedPortfolio = [...currentPortfolio, newPortfolioItem];

            return await this.updateFreelancerProfile(freelancerId, {
                portfolio: updatedPortfolio
            });
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to add portfolio item'
            };
        }
    }

    async removePortfolioItem(freelancerId: string, portfolioItemId: string): Promise<ApiResponse<FreelancerProfile>> {
        try {
            const profileResponse = await this.getFreelancerProfile(freelancerId);
            if (!profileResponse.success || !profileResponse.data) {
                return {
                    success: false,
                    error: 'Freelancer profile not found'
                };
            }

            const profile = profileResponse.data;
            const updatedPortfolio = (profile.portfolio || []).filter(
                item => item.id !== portfolioItemId
            );

            return await this.updateFreelancerProfile(freelancerId, {
                portfolio: updatedPortfolio
            });
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to remove portfolio item'
            };
        }
    }

    // Update profile statistics
    async updateFreelancerStats(
        freelancerId: string,
        stats: {
            projectCompleted?: boolean;
            earnings?: number;
            newRating?: number;
        }
    ): Promise<ApiResponse<FreelancerProfile>> {
        try {
            const profileResponse = await this.getFreelancerProfile(freelancerId);
            if (!profileResponse.success || !profileResponse.data) {
                return {
                    success: false,
                    error: 'Freelancer profile not found'
                };
            }

            const profile = profileResponse.data;
            const updates: Partial<FreelancerProfile> = {};

            if (stats.projectCompleted) {
                updates.completedProjects = (profile.completedProjects || 0) + 1;
            }

            if (stats.earnings) {
                updates.totalEarnings = (profile.totalEarnings || 0) + stats.earnings;
            }

            if (stats.newRating !== undefined) {
                // Calculate new average rating
                const currentTotal = (profile.averageRating || 0) * (profile.completedProjects || 0);
                const newTotal = currentTotal + stats.newRating;
                const newCount = (profile.completedProjects || 0) + (stats.projectCompleted ? 1 : 0);
                updates.averageRating = newCount > 0 ? Math.round((newTotal / newCount) * 100) / 100 : 0;
            }

            if (Object.keys(updates).length > 0) {
                return await this.updateFreelancerProfile(freelancerId, updates);
            }

            return {
                success: true,
                data: profile
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update freelancer stats'
            };
        }
    }

    async updateClientStats(
        clientId: string,
        stats: {
            projectCompleted?: boolean;
            spent?: number;
            newRating?: number;
        }
    ): Promise<ApiResponse<ClientProfile>> {
        try {
            const profileResponse = await this.getClientProfile(clientId);
            if (!profileResponse.success || !profileResponse.data) {
                return {
                    success: false,
                    error: 'Client profile not found'
                };
            }

            const profile = profileResponse.data;
            const updates: Partial<ClientProfile> = {};

            if (stats.projectCompleted) {
                updates.totalProjects = (profile.totalProjects || 0) + 1;
            }

            if (stats.spent) {
                updates.totalSpent = (profile.totalSpent || 0) + stats.spent;
            }

            if (stats.newRating !== undefined) {
                // Calculate new average rating
                const currentTotal = (profile.averageRating || 0) * (profile.totalProjects || 0);
                const newTotal = currentTotal + stats.newRating;
                const newCount = (profile.totalProjects || 0) + (stats.projectCompleted ? 1 : 0);
                updates.averageRating = newCount > 0 ? Math.round((newTotal / newCount) * 100) / 100 : 0;
            }

            if (Object.keys(updates).length > 0) {
                return await this.updateClientProfile(clientId, updates);
            }

            return {
                success: true,
                data: profile
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update client stats'
            };
        }
    }

    // Verification methods
    async requestProfileVerification(userId: string): Promise<ApiResponse<void>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser || currentUser.uid !== userId) {
                return {
                    success: false,
                    error: 'You can only request verification for your own profile'
                };
            }

            if (currentUser.role === UserRole.CLIENT) {
                await this.updateClientProfile(userId, {
                    verificationStatus: VerificationStatus.PENDING
                });
            } else if (currentUser.role === UserRole.FREELANCER) {
                await this.updateFreelancerProfile(userId, {
                    verificationStatus: VerificationStatus.PENDING
                });
            }

            return {
                success: true,
                message: 'Verification request submitted successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to request verification'
            };
        }
    }

    // Helper method to convert data to Firestore format
    private convertToFirestore(data: any): any {
        const converted = { ...data };

        // Convert Date objects to Firestore Timestamps
        Object.keys(converted).forEach(key => {
            if (converted[key] instanceof Date) {
                // Keep as Date, Firestore will handle the conversion
            }
        });

        return converted;
    }

    // Get user profile based on role
    async getUserProfile(userId: string): Promise<ApiResponse<ClientProfile | FreelancerProfile>> {
        try {
            // Try to get freelancer profile first
            const freelancerResponse = await this.getFreelancerProfile(userId);
            if (freelancerResponse.success) {
                return freelancerResponse;
            }

            // If not found, try client profile
            const clientResponse = await this.getClientProfile(userId);
            if (clientResponse.success) {
                return clientResponse;
            }

            return {
                success: false,
                error: 'No profile found for this user'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get user profile'
            };
        }
    }

    async getClientProfile(userId: string): Promise<ApiResponse<ClientProfile>> {
        try {
            const profileRef = doc(this.firestore, this.CLIENT_PROFILES_COLLECTION, userId);
            const profileSnap = await getDoc(profileRef);

            if (!profileSnap.exists()) {
                return {
                    success: false,
                    error: 'Client profile not found'
                };
            }

            const profileData = profileSnap.data();
            const profile: ClientProfile = {
                id: profileSnap.id,
                ...profileData,
                createdAt: profileData['createdAt']?.toDate() || new Date(),
                updatedAt: profileData['updatedAt']?.toDate() || new Date()
            } as ClientProfile;

            return {
                success: true,
                data: profile
            };
        } catch (error: any) {
            console.error('Error fetching client profile:', error);
            return {
                success: false,
                error: error.message || 'Failed to get client profile'
            };
        }
    }

    // Si hay un método getFreelancerProfile, reemplazarlo por:
    async getFreelancerProfile(userId: string): Promise<ApiResponse<FreelancerProfile>> {
        try {
            const profileRef = doc(this.firestore, this.FREELANCER_PROFILES_COLLECTION, userId);
            const profileSnap = await getDoc(profileRef);

            if (!profileSnap.exists()) {
                return {
                    success: false,
                    error: 'Freelancer profile not found'
                };
            }

            const profileData = profileSnap.data();
            const profile: FreelancerProfile = {
                id: profileSnap.id,
                ...profileData,
                createdAt: profileData['createdAt']?.toDate() || new Date(),
                updatedAt: profileData['updatedAt']?.toDate() || new Date()
            } as FreelancerProfile;

            return {
                success: true,
                data: profile
            };
        } catch (error: any) {
            console.error('Error fetching freelancer profile:', error);
            return {
                success: false,
                error: error.message || 'Failed to get freelancer profile'
            };
        }
    }

    // AGREGAR estos métodos de validación si no existen:
    isClientProfileComplete(profile: ClientProfile): boolean {
        return !!(
            profile.companyName &&
            profile.industry &&
            profile.location &&
            profile.description
        );
    }

    isFreelancerProfileComplete(profile: FreelancerProfile): boolean {
        return !!(
            profile.firstName &&
            profile.lastName &&
            profile.title &&
            profile.bio &&
            profile.skills &&
            profile.skills.length > 0 &&
            profile.location
        );
    }
}