
export type UserType = 'concierge' | 'private' | 'chef';
export type RequestMode = 'fast' | 'concierge';
export type RequestStatus = 'new' | 'in_review' | 'assigned' | 'closed';
export type ChefStatus = 'pending_validation' | 'approved' | 'active' | 'paused';

export type ChefProfileType = 'private' | 'residence' | 'yacht' | 'pastry';
export type ChefSeniority = 'junior' | 'confirmed' | 'senior';
export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'inactive' | 'active' | 'cancelled' | 'coming_soon';

export type MissionStatus = 'offered' | 'accepted' | 'declined' | 'confirmed' | 'completed' | 'cancelled';

export interface Mission {
  id: string;
  chefId: string;
  requestId?: string; // Optional link to original request
  title: string;
  location: string;
  startDate: string; // ISO Date
  endDate?: string; // ISO Date
  guestCount: number;
  serviceLevel: string;
  estimatedAmount: number; // For Chef KPI
  clientPhone?: string; // Contact for confirmed missions
  status: MissionStatus;
  createdAt: string;
}

export interface ChefProfile {
  // Identity
  phone: string;
  languages: string[];
  photoUrl?: string;

  // Professional Class
  profileType?: ChefProfileType;
  seniorityLevel?: ChefSeniority;

  // Experience
  yearsExperience: number;
  environments: string[]; // 'yacht', 'villa', 'restaurant', 'hotel'
  specialties: string[];
  bio: string;

  // Portfolio
  images: string[];

  // Coverage
  baseCity: string;
  travelRadiusKm: number;
  internationalMobility: boolean;
  coverageZones: string[];

  // Preferences
  minBudgetPerDay?: number;
  maxGuestCount?: number;
  acceptedMissions: string[]; // 'dinner', 'long_term', 'permanent'
  teamAcceptance: 'solo' | 'assistants' | 'brigade';
  
  // Availability
  unavailableDates: string[]; // ISO YYYY-MM-DD
}

export interface ChefUser {
  id: string;
  email: string;
  password?: string; // In real app, never store plain text
  firstName: string;
  lastName: string;
  role: 'chef';
  status: ChefStatus;
  createdAt: string;
  profileCompleted: boolean;
  
  // Subscription (MRR)
  plan: SubscriptionPlan;
  planStatus: SubscriptionStatus;
  planUpdatedAt?: string;

  // Admin CRM
  adminNotes?: string;

  // Extended Profile Data
  profile?: Partial<ChefProfile>;
}

export interface RequestForm {
  // Meta
  mode: RequestMode; // Added to track context

  // Step 1: Context
  clientType: 'concierge' | 'private';
  location: string;
  dateMode: 'single' | 'multi';
  startDate: string;
  endDate?: string;

  // Step 2: Assignment
  assignmentType: 'dinner' | 'event' | 'daily' | 'residence' | 'yacht';
  guestCount: number;
  serviceExpectations: 'chef_only' | 'chef_service' | 'full_team';
  // Conditionals
  serviceRhythm?: 'daily' | 'occasional' | 'ondemand'; // If multi
  accommodationProvided?: 'yes' | 'no'; // If multi
  sailingArea?: string; // If yacht
  crewSize?: number; // If yacht

  // Step 3: Preferences
  cuisinePreferences: string;
  dietaryRestrictions: string;
  preferredLanguage: string;

  // Step 4: Context
  budgetRange: string;
  notes: string;

  // Step 5: Contact
  fullName: string;
  email: string;
  phone: string;
  companyName?: string; // If concierge
}

export interface RequestEntity {
  id: string;
  mode: RequestMode;
  userType: 'b2b' | 'b2c';
  location: string;
  dates: {
    start: string;
    end?: string;
    type: 'single' | 'multi';
  };
  guestCount: number;
  missionType: string;
  serviceLevel: string;
  preferences: {
    cuisine?: string;
    allergies?: string;
    languages?: string;
  };
  budgetRange?: string;
  notes?: string;
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  createdAt: string; // ISO String
  status: RequestStatus;
}

export interface ChefApplicationForm {
  fullName: string;
  email: string;
  phone: string;
  baseCity: string;
  travelRange: string;
  languages: string;
  background: {
    michelin: boolean;
    palace: boolean;
    yacht: boolean;
    privateHousehold: boolean;
  };
  specialties: string;
  portfolioLink: string;
  availabilityNotes: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

// --- BACKEND LOGIC TYPES ---

export interface FastMatchResult {
  success: boolean;
  mode: 'instant_match' | 'concierge_escalation' | 'concierge_manual';
  referenceId: string;
  matchedChef?: string; // Name of chef if instant
  reason?: string;
}