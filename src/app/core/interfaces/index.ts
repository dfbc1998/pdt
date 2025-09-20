// User & Authentication Interfaces
export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role: UserRole;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

export enum UserRole {
    CLIENT = 'client',
    FREELANCER = 'freelancer',
    ADMIN = 'admin'
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
}

// Client Profile Interface
export interface ClientProfile {
    id: string;
    userId: string;
    companyName: string;
    industry: string;
    companySize: CompanySize;
    website?: string;
    description?: string;
    location: string;
    phone?: string;
    averageRating: number;
    totalProjects: number;
    totalSpent: number;
    verificationStatus: VerificationStatus;
    createdAt: Date;
    updatedAt: Date;
}

export enum CompanySize {
    STARTUP = 'startup',
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
    ENTERPRISE = 'enterprise'
}

// Freelancer Profile Interface
export interface FreelancerProfile {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    title: string;
    bio: string;
    skills: string[];
    experience: ExperienceLevel;
    hourlyRate: number;
    availability: Availability;
    languages: Language[];
    education: Education[];
    certifications: Certification[];
    portfolio: PortfolioItem[];
    location: string;
    timezone: string;
    averageRating: number;
    totalEarnings: number;
    completedProjects: number;
    successRate: number;
    responseTime: number; // in hours
    verificationStatus: VerificationStatus;
    createdAt: Date;
    updatedAt: Date;
}

export enum ExperienceLevel {
    ENTRY = 'entry',
    INTERMEDIATE = 'intermediate',
    EXPERT = 'expert'
}

export enum Availability {
    FULL_TIME = 'full_time',
    PART_TIME = 'part_time',
    CONTRACT = 'contract',
    NOT_AVAILABLE = 'not_available'
}

export interface Language {
    name: string;
    proficiency: LanguageProficiency;
}

export enum LanguageProficiency {
    BASIC = 'basic',
    CONVERSATIONAL = 'conversational',
    FLUENT = 'fluent',
    NATIVE = 'native'
}

export interface Education {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear?: number;
    description?: string;
}

export interface Certification {
    name: string;
    issuer: string;
    issueDate: Date;
    expirationDate?: Date;
    credentialId?: string;
    credentialUrl?: string;
}

export interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    projectUrl?: string;
    technologies: string[];
    category: string;
    completionDate: Date;
}

export enum VerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected'
}

// Project Interfaces
export interface Project {
    id: string;
    clientId: string;
    title: string;
    description: string;
    category: ProjectCategory;
    subcategory: string;
    budget: ProjectBudget;
    timeline: ProjectTimeline;
    requiredSkills: string[];
    preferredExperience: ExperienceLevel;
    attachments: ProjectAttachment[];
    milestones: Milestone[];
    status: ProjectStatus;
    visibility: ProjectVisibility;
    applicationDeadline?: Date;
    startDate?: Date;
    endDate?: Date;
    assignedFreelancerId?: string;
    proposalCount: number;
    viewCount: number;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export enum ProjectCategory {
    WEB_DEVELOPMENT = 'web_development',
    MOBILE_DEVELOPMENT = 'mobile_development',
    DESIGN = 'design',
    WRITING = 'writing',
    MARKETING = 'marketing',
    DATA_SCIENCE = 'data_science',
    BUSINESS = 'business',
    OTHER = 'other'
}

export interface ProjectBudget {
    type: BudgetType;
    amount?: number;
    minAmount?: number;
    maxAmount?: number;
    currency: string;
}

export enum BudgetType {
    FIXED = 'fixed',
    HOURLY = 'hourly',
    RANGE = 'range'
}

export interface ProjectTimeline {
    type: TimelineType;
    duration?: number;
    startDate?: Date;
    endDate?: Date;
    isFlexible: boolean;
}

export enum TimelineType {
    DAYS = 'days',
    WEEKS = 'weeks',
    MONTHS = 'months',
    FLEXIBLE = 'flexible'
}

export interface ProjectAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: Date;
}

export interface Milestone {
    id: string;
    title: string;
    description: string;
    amount: number;
    dueDate?: Date;
    status: MilestoneStatus;
    deliverables: string[];
    order: number;
}

export enum MilestoneStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    UNDER_REVIEW = 'under_review',
    COMPLETED = 'completed',
    OVERDUE = 'overdue'
}

export enum ProjectStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    IN_PROGRESS = 'in_progress',
    UNDER_REVIEW = 'under_review',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    PAUSED = 'paused'
}

export enum ProjectVisibility {
    PUBLIC = 'public',
    PRIVATE = 'private',
    INVITE_ONLY = 'invite_only'
}

// Proposal Interfaces
export interface Proposal {
    id: string;
    projectId: string;
    freelancerId: string;
    coverLetter: string;
    proposedBudget: ProposedBudget;
    proposedTimeline: ProposedTimeline;
    milestones: ProposedMilestone[];
    attachments: ProposalAttachment[];
    questions: ProposalQuestion[];
    status: ProposalStatus;
    submittedAt: Date;
    respondedAt?: Date;
    clientFeedback?: string;
    isShortlisted: boolean;
    viewedByClient: boolean;
}

export interface ProposedBudget {
    amount: number;
    type: BudgetType;
    currency: string;
    breakdown?: BudgetBreakdown[];
}

export interface BudgetBreakdown {
    description: string;
    amount: number;
    percentage?: number;
}

export interface ProposedTimeline {
    duration: number;
    unit: TimelineType;
    startDate?: Date;
    endDate?: Date;
    description?: string;
}

export interface ProposedMilestone {
    title: string;
    description: string;
    amount: number;
    duration: number;
    deliverables: string[];
}

export interface ProposalAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    description?: string;
}

export interface ProposalQuestion {
    question: string;
    answer: string;
    isRequired: boolean;
}

export enum ProposalStatus {
    SUBMITTED = 'submitted',
    SHORTLISTED = 'shortlisted',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn'
}

// Message & Communication Interfaces
export interface Message {
    id: string;
    projectId: string;
    senderId: string;
    receiverId?: string;
    content: string;
    type: MessageType;
    attachments: MessageAttachment[];
    isRead: boolean;
    readAt?: Date;
    sentAt: Date;
    editedAt?: Date;
    isSystemMessage: boolean;
    metadata?: MessageMetadata;
}

export enum MessageType {
    TEXT = 'text',
    FILE = 'file',
    IMAGE = 'image',
    SYSTEM = 'system',
    MILESTONE_UPDATE = 'milestone_update',
    PAYMENT_NOTIFICATION = 'payment_notification'
}

export interface MessageAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    thumbnailUrl?: string;
}

export interface MessageMetadata {
    milestoneId?: string;
    paymentId?: string;
    systemAction?: string;
    oldValue?: any;
    newValue?: any;
}

export interface ChatRoom {
    id: string;
    projectId: string;
    participants: string[];
    lastMessage?: Message;
    lastActivity: Date;
    unreadCount: { [userId: string]: number };
    isActive: boolean;
    createdAt: Date;
}

// File Management Interfaces
export interface FileUpload {
    id: string;
    name: string;
    originalName: string;
    url: string;
    downloadUrl?: string;
    size: number;
    type: string;
    category: FileCategory;
    ownerId: string;
    projectId?: string;
    proposalId?: string;
    messageId?: string;
    isPublic: boolean;
    uploadedAt: Date;
    metadata?: FileMetadata;
}

export enum FileCategory {
    PROJECT_ATTACHMENT = 'project_attachment',
    PROPOSAL_ATTACHMENT = 'proposal_attachment',
    MESSAGE_ATTACHMENT = 'message_attachment',
    PORTFOLIO_IMAGE = 'portfolio_image',
    PROFILE_PHOTO = 'profile_photo',
    DOCUMENT = 'document',
    OTHER = 'other'
}

export interface FileMetadata {
    dimensions?: { width: number; height: number };
    duration?: number; // for videos/audio
    pageCount?: number; // for PDFs
    thumbnailUrl?: string;
    previewUrl?: string;
}

// Rating & Review Interfaces
export interface Rating {
    id: string;
    projectId: string;
    fromUserId: string;
    toUserId: string;
    rating: number; // 1-5
    review?: string;
    categories: RatingCategory[];
    isPublic: boolean;
    createdAt: Date;
    response?: RatingResponse;
}

export interface RatingCategory {
    category: string;
    rating: number;
}

export interface RatingResponse {
    content: string;
    createdAt: Date;
}

// Notification Interfaces
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: NotificationData;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
    actionUrl?: string;
}

export enum NotificationType {
    NEW_PROPOSAL = 'new_proposal',
    PROPOSAL_ACCEPTED = 'proposal_accepted',
    PROPOSAL_REJECTED = 'proposal_rejected',
    PROJECT_UPDATE = 'project_update',
    MESSAGE = 'message',
    PAYMENT = 'payment',
    MILESTONE_COMPLETED = 'milestone_completed',
    DEADLINE_REMINDER = 'deadline_reminder',
    SYSTEM = 'system'
}

export interface NotificationData {
    projectId?: string;
    proposalId?: string;
    messageId?: string;
    milestoneId?: string;
    userId?: string;
    amount?: number;
}

// Search & Filter Interfaces
export interface ProjectSearchFilters {
    category?: ProjectCategory;
    subcategory?: string;
    budgetMin?: number;
    budgetMax?: number;
    budgetType?: BudgetType;
    experienceLevel?: ExperienceLevel;
    skills?: string[];
    timeline?: string;
    location?: string;
    clientRating?: number;
    isRemote?: boolean;
    sortBy?: ProjectSortOption;
    sortOrder?: SortOrder;
}

export enum ProjectSortOption {
    NEWEST = 'newest',
    BUDGET_HIGH = 'budget_high',
    BUDGET_LOW = 'budget_low',
    DEADLINE = 'deadline',
    PROPOSALS = 'proposals',
    CLIENT_RATING = 'client_rating'
}

export interface FreelancerSearchFilters {
    skills?: string[];
    experienceLevel?: ExperienceLevel;
    availability?: Availability;
    hourlyRateMin?: number;
    hourlyRateMax?: number;
    location?: string;
    languages?: string[];
    rating?: number;
    responseTime?: number;
    sortBy?: FreelancerSortOption;
    sortOrder?: SortOrder;
}

export enum FreelancerSortOption {
    RATING = 'rating',
    RATE_LOW = 'rate_low',
    RATE_HIGH = 'rate_high',
    EXPERIENCE = 'experience',
    RESPONSE_TIME = 'response_time',
    SUCCESS_RATE = 'success_rate'
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

// API Response Interfaces
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    code?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
}

// Form State Interfaces
export interface FormState {
    isLoading: boolean;
    isSubmitted: boolean;
    errors: { [key: string]: string };
    isDirty: boolean;
    isValid: boolean;
}

// Dashboard Interfaces
export interface DashboardStats {
    totalProjects?: number;
    totalProposals?: number;
    activeProjects?: number;
    acceptedProposals?: number;
    pendingProposals?: number;
    rejectedProposals?: number;
    avgResponseTime: 2.5
    completedProjects?: number;
    totalEarnings?: number;
    averageRating?: number;
    responseTime?: number;
    successRate?: number;
    monthlyEarnings?: MonthlyEarning[];
    recentActivities?: RecentActivity[];
}

export interface MonthlyEarning {
    month: string;
    amount: number;
    projects: number;
}

export interface RecentActivity {
    id: string;
    type: string;
    description: string;
    date: Date;
    projectId?: string;
    amount?: number;
}

export interface ProposalWithProject extends Proposal {
    project?: Project;
}