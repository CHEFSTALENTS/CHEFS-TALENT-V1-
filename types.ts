export type UserType = 'concierge' | 'private' | 'chef';
export type RequestMode = 'fast' | 'concierge';
export type RequestStatus = 'new' | 'in_review' | 'assigned' | 'closed';
export type ChefStatus = 'pending_validation' | 'approved' | 'active' | 'paused';

export type ChefProfileType = 'private' | 'residence' | 'yacht' | 'pastry';
export type ChefSeniority = 'junior' | 'confirmed' | 'senior';
export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'inactive' | 'active' | 'cancelled' | 'coming_soon';

export type MissionStatus =
  | 'offered'
  | 'accepted'
  | 'declined'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface Mission {
  id: string;
  chefId: string;
  requestId?: string;
  title: string;
  location: string;
  startDate: string;
  endDate?: string;
  guestCount: number;
  serviceLevel: string;
  estimatedAmount: number;
  clientPhone?: string;
  status: MissionStatus;
  createdAt: string;
}

export interface ChefProfile {
  phone?: string;
  languages: string[];
  photoUrl?: string;

  profileType?: ChefProfileType;
  seniorityLevel?: ChefSeniority;

  yearsExperience?: number;
  environments: string[];
  specialties: string[];
  bio?: string;

  images: string[];

  baseCity?: string;
  travelRadiusKm?: number;
  internationalMobility?: boolean;
  coverageZones: string[];

  minBudgetPerDay?: number;
  maxGuestCount?: number;
  acceptedMissions: string[];
  teamAcceptance?: 'solo' | 'assistants' | 'brigade';

  unavailableDates: string[];
}

export interface ChefUser {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'chef';
  status: ChefStatus;
  createdAt: string;
  profileCompleted: boolean;

  plan: SubscriptionPlan;
  planStatus: SubscriptionStatus;
  planUpdatedAt?: string;

  adminNotes?: string;
  profile?: Partial<ChefProfile>;
}

export interface RequestForm {
  mode: RequestMode;

  clientType: 'concierge' | 'private';
  location: string;
  dateMode: 'single' | 'multi';
  startDate: string;
  endDate?: string;

  assignmentType: 'dinner' | 'event' | 'daily' | 'residence' | 'yacht';
  guestCount: number;
  serviceExpectations: 'chef_only' | 'chef_service' | 'full_team';

  serviceRhythm?: 'daily' | 'occasional' | 'ondemand';
  accommodationProvided?: 'yes' | 'no';
  sailingArea?: string;
  crewSize?: number;

  cuisinePreferences: string;
  dietaryRestrictions: string;
  preferredLanguage: string;

  budgetRange: string;
  notes: string;

  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
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
  createdAt: string;
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

export interface FastMatchResult {
  success: boolean;
  mode: 'instant_match' | 'concierge_manual';
  referenceId: string;
  matchedChef?: string;
}
