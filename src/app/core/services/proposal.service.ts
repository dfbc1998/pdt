import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit } from '@angular/fire/firestore';
import { Proposal, ProposalStatus, ApiResponse } from '../interfaces';
import { AuthService } from './auth.service';
import { ProjectService } from './project.service';

@Injectable({
    providedIn: 'root'
})
export class ProposalService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private projectService = inject(ProjectService);

    private readonly COLLECTION_NAME = 'proposals';

    constructor() { }

    // Get proposal by ID
    async getProposalById(proposalId: string): Promise<ApiResponse<Proposal>> {
        try {
            const proposalRef = doc(this.firestore, this.COLLECTION_NAME, proposalId);
            const proposalSnap = await getDoc(proposalRef);

            if (!proposalSnap.exists()) {
                return {
                    success: false,
                    error: 'Proposal not found'
                };
            }

            const proposalData = proposalSnap.data();
            const proposal: Proposal = {
                id: proposalSnap.id,
                ...proposalData,
                submittedAt: proposalData['submittedAt']?.toDate() || new Date(),
                respondedAt: proposalData['respondedAt']?.toDate()
            } as Proposal;

            // Mark as viewed by client if current user is the project owner
            const currentUser = this.authService.currentUser;
            if (currentUser && this.authService.isClient && !proposal.viewedByClient) {
                const projectResponse = await this.projectService.getProjectById(proposal.projectId);
                if (projectResponse.success && projectResponse.data?.clientId === currentUser.uid) {
                    await this.markAsViewedByClient(proposalId);
                    proposal.viewedByClient = true;
                }
            }

            return {
                success: true,
                data: proposal
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get proposal'
            };
        }
    }

    // Get proposals for a project
    async getProposalsByProject(projectId: string): Promise<ApiResponse<Proposal[]>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Verify user has access to view proposals for this project
            const projectResponse = await this.projectService.getProjectById(projectId);
            if (!projectResponse.success || !projectResponse.data) {
                return {
                    success: false,
                    error: 'Project not found'
                };
            }

            const project = projectResponse.data;
            if (this.authService.isClient && project.clientId !== currentUser.uid) {
                return {
                    success: false,
                    error: 'You can only view proposals for your own projects'
                };
            }

            const proposalsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('projectId', '==', projectId),
                orderBy('submittedAt', 'desc')
            );

            const querySnapshot = await getDocs(proposalsQuery);
            const proposals: Proposal[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    submittedAt: data['submittedAt']?.toDate() || new Date(),
                    respondedAt: data['respondedAt']?.toDate()
                } as Proposal;
            });

            return {
                success: true,
                data: proposals
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get project proposals'
            };
        }
    }

    // Get proposals by freelancer
    async getProposalsByFreelancer(freelancerId: string): Promise<ApiResponse<Proposal[]>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Users can only view their own proposals unless they're admin
            if (freelancerId !== currentUser.uid && !this.authService.isAdmin) {
                return {
                    success: false,
                    error: 'You can only view your own proposals'
                };
            }

            const proposalsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('freelancerId', '==', freelancerId),
                orderBy('submittedAt', 'desc')
            );

            const querySnapshot = await getDocs(proposalsQuery);
            const proposals: Proposal[] = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    submittedAt: data['submittedAt']?.toDate() || new Date(),
                    respondedAt: data['respondedAt']?.toDate()
                } as Proposal;
            });

            return {
                success: true,
                data: proposals
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get freelancer proposals'
            };
        }
    }

    // Update proposal status (accept/reject/shortlist)
    async updateProposalStatus(proposalId: string, status: ProposalStatus, clientFeedback?: string): Promise<ApiResponse<Proposal>> {
        try {
            const currentUser = this.authService.currentUser;
            if (!currentUser) {
                return {
                    success: false,
                    error: 'Authentication required'
                };
            }

            // Get the proposal to verify ownership
            const proposalResponse = await this.getProposalById(proposalId);
            if (!proposalResponse.success || !proposalResponse.data) {
                return {
                    success: false,
                    error: 'Proposal not found'
                };
            }

            const proposal = proposalResponse.data;

            // Verify the project belongs to the current user
            const projectResponse = await this.projectService.getProjectById(proposal.projectId);
            if (!projectResponse.success || !projectResponse.data) {
                return {
                    success: false,
                    error: 'Associated project not found'
                };
            }

            const project = projectResponse.data;

            // Only project owner can accept/reject/shortlist proposals
            if (this.authService.isClient && project.clientId !== currentUser.uid) {
                return {
                    success: false,
                    error: 'You can only manage proposals for your own projects'
                };
            }

            // Only proposal owner can withdraw
            if (status === ProposalStatus.WITHDRAWN && proposal.freelancerId !== currentUser.uid) {
                return {
                    success: false,
                    error: 'You can only withdraw your own proposals'
                };
            }

            const proposalRef = doc(this.firestore, this.COLLECTION_NAME, proposalId);
            const updateData: any = {
                status,
                respondedAt: new Date()
            };

            if (clientFeedback) {
                updateData.clientFeedback = clientFeedback;
            }

            if (status === ProposalStatus.SHORTLISTED) {
                updateData.isShortlisted = true;
            }

            // If accepting a proposal, assign freelancer to project
            if (status === ProposalStatus.ACCEPTED) {
                await this.projectService.assignFreelancer(proposal.projectId, proposal.freelancerId);
                // Reject all other proposals for this project
                await this.rejectOtherProposals(proposal.projectId, proposalId);
            }

            await updateDoc(proposalRef, updateData);

            const updatedProposal: Proposal = {
                ...proposal,
                ...updateData
            };

            return {
                success: true,
                data: updatedProposal,
                message: `Proposal ${status} successfully`
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update proposal status'
            };
        }
    }

    // Private helper methods
    private async checkExistingProposal(projectId: string, freelancerId: string): Promise<boolean> {
        try {
            const proposalsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('projectId', '==', projectId),
                where('freelancerId', '==', freelancerId),
                limit(1)
            );

            const querySnapshot = await getDocs(proposalsQuery);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking existing proposal:', error);
            return false;
        }
    }

    private async markAsViewedByClient(proposalId: string): Promise<void> {
        try {
            const proposalRef = doc(this.firestore, this.COLLECTION_NAME, proposalId);
            await updateDoc(proposalRef, {
                viewedByClient: true
            });
        } catch (error) {
            console.error('Error marking proposal as viewed:', error);
        }
    }

    private async rejectOtherProposals(projectId: string, acceptedProposalId: string): Promise<void> {
        try {
            const proposalsQuery = query(
                collection(this.firestore, this.COLLECTION_NAME),
                where('projectId', '==', projectId),
                where('status', '==', ProposalStatus.SUBMITTED)
            );

            const querySnapshot = await getDocs(proposalsQuery);

            const updatePromises = querySnapshot.docs
                .filter(doc => doc.id !== acceptedProposalId)
                .map(doc =>
                    updateDoc(doc.ref, {
                        status: ProposalStatus.REJECTED,
                        respondedAt: new Date(),
                        clientFeedback: 'Another freelancer was selected for this project.'
                    })
                );

            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Error rejecting other proposals:', error);
        }
    }

    // Get proposal statistics for freelancer
    async getFreelancerProposalStats(freelancerId: string): Promise<ApiResponse<any>> {
        try {
            const proposalsResponse = await this.getProposalsByFreelancer(freelancerId);
            if (!proposalsResponse.success || !proposalsResponse.data) {
                return {
                    success: false,
                    error: 'Failed to get proposals'
                };
            }

            const proposals = proposalsResponse.data;
            const stats = {
                total: proposals.length,
                submitted: proposals.filter(p => p.status === ProposalStatus.SUBMITTED).length,
                shortlisted: proposals.filter(p => p.status === ProposalStatus.SHORTLISTED).length,
                accepted: proposals.filter(p => p.status === ProposalStatus.ACCEPTED).length,
                rejected: proposals.filter(p => p.status === ProposalStatus.REJECTED).length,
                withdrawn: proposals.filter(p => p.status === ProposalStatus.WITHDRAWN).length,
                successRate: proposals.length > 0 ?
                    Math.round((proposals.filter(p => p.status === ProposalStatus.ACCEPTED).length / proposals.length) * 100) : 0
            };

            return {
                success: true,
                data: stats
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get proposal statistics'
            };
        }
    }

    // Método submitProposal corregido con debugging
    // Método submitProposal corregido con debugging
    async submitProposal(proposalData: Omit<Proposal, 'id' | 'submittedAt' | 'viewedByClient'>): Promise<ApiResponse<Proposal>> {
        try {
            console.log('🚀 [ProposalService] Starting proposal submission...');

            const currentUser = this.authService.currentUser;
            if (!currentUser || !this.authService.isFreelancer) {
                console.error('❌ [ProposalService] Authentication failed or user is not freelancer');
                return {
                    success: false,
                    error: 'Only freelancers can submit proposals'
                };
            }

            console.log('✅ [ProposalService] User authenticated:', currentUser.uid, 'Role:', currentUser.role);

            // Check if freelancer has already submitted a proposal
            console.log('🔍 [ProposalService] Checking for existing proposal...');
            const existingProposal = await this.checkExistingProposal(proposalData.projectId, currentUser.uid);
            if (existingProposal) {
                console.error('❌ [ProposalService] Proposal already exists');
                return {
                    success: false,
                    error: 'You have already submitted a proposal for this project'
                };
            }

            // Verify project exists and is accepting proposals
            console.log('🔍 [ProposalService] Verifying project status...');
            const projectResponse = await this.projectService.getProjectById(proposalData.projectId);
            if (!projectResponse.success || !projectResponse.data) {
                console.error('❌ [ProposalService] Project not found');
                return {
                    success: false,
                    error: 'Project not found'
                };
            }

            const project = projectResponse.data;
            if (project.status !== 'published') {
                console.error('❌ [ProposalService] Project not published, status:', project.status);
                return {
                    success: false,
                    error: 'This project is not accepting proposals'
                };
            }

            console.log('✅ [ProposalService] Project verified, status:', project.status);

            // Prepare proposal data
            const proposalToCreate = {
                projectId: proposalData.projectId,
                freelancerId: currentUser.uid,
                coverLetter: proposalData.coverLetter,
                proposedBudget: proposalData.proposedBudget,
                proposedTimeline: proposalData.proposedTimeline,
                milestones: proposalData.milestones || [],
                attachments: proposalData.attachments || [],
                questions: proposalData.questions || [],
                status: ProposalStatus.SUBMITTED,
                submittedAt: new Date(),
                viewedByClient: false,
                isShortlisted: false
                // respondedAt y clientFeedback se omiten intencionalmente (undefined por defecto)
            };

            console.log('📝 [ProposalService] Proposal data prepared:', {
                projectId: proposalToCreate.projectId,
                freelancerId: proposalToCreate.freelancerId,
                status: proposalToCreate.status,
                coverLetterLength: proposalToCreate.coverLetter.length,
                budgetAmount: proposalToCreate.proposedBudget.amount,
                timelineDuration: proposalToCreate.proposedTimeline.duration,
                milestonesCount: proposalToCreate.milestones.length,
                questionsCount: proposalToCreate.questions.length
            });

            console.log('💾 [ProposalService] Saving to Firestore...');
            const proposalRef = await addDoc(collection(this.firestore, this.COLLECTION_NAME), proposalToCreate);
            console.log('✅ [ProposalService] Proposal saved with ID:', proposalRef.id);

            const createdProposal: Proposal = {
                id: proposalRef.id,
                ...proposalToCreate,
                // Campos opcionales que pueden ser undefined
                respondedAt: undefined,
                clientFeedback: undefined
            };

            return {
                success: true,
                data: createdProposal,
                message: 'Proposal submitted successfully'
            };
        } catch (error: any) {
            console.error('💥 [ProposalService] Error submitting proposal:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error);

            return {
                success: false,
                error: error.message || 'Failed to submit proposal'
            };
        }
    }
}