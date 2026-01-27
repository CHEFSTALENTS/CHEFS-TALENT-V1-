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
  /* -----------------
   * Identité / infos générales (utilisées dans /chef/settings + /chef/identity + autres)
   * ----------------- */
  name?: string; // ex: "Thomas Delcroix"
  city?: string;
  country?: string;
  website?: string;
  instagram?: string;
  portfolioUrl?: string;
  avatarUrl?: string; // standard
  photoUrl?: string; // legacy (on garde)

  phone?: string;
  email?: string;

  languages?: string[];

  /* -----------------
   * Classification
   * ----------------- */
  profileType?: ChefProfileType;
  seniorityLevel?: ChefSeniority;

  /* -----------------
   * Expérience / Profil
   * ----------------- */
  yearsExperience?: number;
  environments?: string[];
  specialties?: string[];
  cuisines?: string[];
  bio?: string;

  images?: string[];

  /* -----------------
   * Mobilité (legacy + nouveau format)
   * ----------------- */
  // legacy (ancien)
  baseCity?: string;
  travelRadiusKm?: number;
  internationalMobility?: boolean;
  coverageZones?: string[];

  // nouveau (utilisé dans /chef/mobility + checklist settings)
  location?: {
    baseCity?: string;
    travelRadiusKm?: number;
    internationalMobility?: boolean;
    coverageZones?: string[];
  };

  /* -----------------
   * Contraintes / pricing
   * ----------------- */
  minBudgetPerDay?: number;
  maxGuestCount?: number;
  teamAcceptance?: 'solo' | 'assistants' | 'brigade';

  acceptedMissions?: string[];

  /* -----------------
   * Disponibilités
   * ----------------- */
  unavailableDates?: string[];

  /* -----------------
   * Meta
   * ----------------- */
  createdAt?: string;
  updatedAt?: string;

  // pour tolérer des champs qui traînent (utile tant que tu itères)
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

  // ----------------------------
  // ✅ Budget (UI + estimation)
  // ----------------------------

  /**
   * Affichage / texte libre (ex: "600€ – 900€ / jour (hors frais de service)")
   * On le garde pour l’UI et le backoffice.
   */
  budgetRange: string;

  guestCount : number ;
  /**
   * ✅ Champ numérique FAST : budget par personne
   * (utilisé pour calculer chefTotal = pax * budgetPerPerson)
   */
  budgetPerPerson?: number ;

  /**
   * ✅ Champ numérique CONCIERGE : budget par jour
   * (utilisé pour calculer chefTotal = days * budgetPerDay)
   */
  budgetPerDay?: number ;

  /**
   * Optionnel : moment (fast)
   * (si tu veux arrêter les @ts-ignore sur mealMoment)
   */
  mealMoment?: 'lunch' | 'dinner';

  /**
   * Optionnel : bloc pricing calculé avant submit (pour stocker / afficher)
   * Tu peux aussi le mettre côté API uniquement, mais si tu l’envoies depuis le front, typage ici.
   */
  pricing?: {
    rate: number | null; // null => sur devis (yacht)
    rateLabel: string;

    chefTotal?: number;
    serviceFee?: number;
    totalWithService?: number;

    unitLabel?: '€/pers' | '€/jour';
    qty?: number;

    reason?: string; // si pas calculable
  };

  // ----------------------------
  // Notes & contact
  // ----------------------------
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
