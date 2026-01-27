// types.ts
// ✅ Version clean, sans doublons, compatible avec la page /request
// (on garde un peu de souplesse via [key: string]: any uniquement sur ChefProfile)

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

/* =========================================================
   Chef
========================================================= */

export interface ChefProfile {
  // Identité / infos générales
  name?: string;
  city?: string;
  country?: string;

  website?: string;
  instagram?: string;
  portfolioUrl?: string;

  avatarUrl?: string; // standard
  photoUrl?: string; // legacy

  phone?: string;
  email?: string;

  languages?: string[];

  // Classification
  profileType?: ChefProfileType;
  seniorityLevel?: ChefSeniority;

  // Expérience / profil
  yearsExperience?: number;
  environments?: string[];
  specialties?: string[];
  cuisines?: string[];
  bio?: string;

  images?: string[];

  // Mobilité (legacy + nouveau format)
  baseCity?: string;
  travelRadiusKm?: number;
  internationalMobility?: boolean;
  coverageZones?: string[];

  location?: {
    baseCity?: string;
    travelRadiusKm?: number;
    internationalMobility?: boolean;
    coverageZones?: string[];
  };

  // Contraintes / pricing
  minBudgetPerDay?: number;
  maxGuestCount?: number;
  teamAcceptance?: 'solo' | 'assistants' | 'brigade';

  acceptedMissions?: string[];

  // Disponibilités
  unavailableDates?: string[];

  // Meta
  createdAt?: string;
  updatedAt?: string;

  // Tolérance pendant itération
  [key: string]: any;
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

/* =========================================================
   Requests
========================================================= */

export type DateMode = 'single' | 'multi';

export type AssignmentType = 'dinner' | 'event' | 'daily' | 'residence' | 'yacht';

export type ServiceExpectations = 'chef_only' | 'chef_service' | 'full_team';

export type ServiceRhythm = 'daily' | 'occasional' | 'ondemand';

export type YesNo = 'yes' | 'no';

export type MealMoment = 'lunch' | 'dinner';

export type PricingUnitLabel = '€/pers' | '€/jour';

export interface PricingSnapshot {
  // null => sur devis (yacht)
  rate: number | null;
  rateLabel: string;

  chefTotal?: number;
  serviceFee?: number;
  totalWithService?: number;

  unitLabel?: PricingUnitLabel;
  qty?: number;

  // si pas calculable / pas assez de champs
  reason?: string;
}

export interface RequestForm {
  mode: RequestMode;

  clientType: 'concierge' | 'private';

  location: string;

  dateMode: DateMode;
  startDate: string;
  endDate?: string;

  assignmentType: AssignmentType;
  guestCount: number;

  serviceExpectations: ServiceExpectations;

  // champs optionnels (plutôt concierge)
  serviceRhythm?: ServiceRhythm;
  accommodationProvided?: YesNo;

  sailingArea?: string;
  crewSize?: number;

  // préférences
  cuisinePreferences: string;
  dietaryRestrictions: string;
  preferredLanguage: string;

  /**
   * Texte libre (lecture seule / affichage marché / historique DB)
   * Ex: "600€ – 900€ / jour (hors frais de service)"
   */
  budgetRange: string;

  /**
   * ✅ Numériques (saisie)
   * FAST: budget par personne
   * CONCIERGE: budget par jour
   */
  budgetPerPerson?: number | null;
  budgetPerDay?: number | null;

  // optionnel si tu l’utilises côté fast UI
  mealMoment?: MealMoment;

  // notes + contact
  notes: string;

  fullName: string;
  email: string;
  phone: string;

  companyName?: string;

  // optionnel si tu l’envoies depuis le front
  pricing?: PricingSnapshot;
}

export interface RequestEntity {
  id: string;

  mode: RequestMode;

  // b2b=concierge/agency ; b2c=private
  userType: 'b2b' | 'b2c';

  location: string;

  dates: {
    start: string;
    end?: string;
    type: DateMode;
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

/* =========================================================
   Chef Application
========================================================= */

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

/* =========================================================
   Fast Match result
========================================================= */

export interface FastMatchResult {
  success: boolean;
  mode: 'instant_match' | 'concierge_manual';
  referenceId: string;
  matchedChef?: string;
}
