import {
  RequestEntity,
  RequestForm,
  RequestStatus,
  ChefUser,
  ChefProfile,
  Mission,
  MissionStatus,
} from '../types';

import { matchChefsForFastRequest, buildFastMatchProposals } from './fastMatch';

/**
 * ⚠️ ATTENTION
 * Ce fichier est la source de vérité du front.
 * Toute méthode utilisée dans actions.ts ou app/*
 * DOIT être déclarée ici, dans api ou auth.
 *
 * Ne jamais ajouter de méthodes en dehors de api/auth.
 */

/* =========================================================
   ADMIN
========================================================= */

export const ADMIN_EMAIL = 'thomas@chef-talents.com';
// ⚠️ MVP uniquement : idéalement à sortir du repo (env var) plus tard
const ADMIN_PASSWORD = 'Cantine33?';

export function isAdminUser(user: { email?: string } | null | undefined) {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* =========================================================
   TYPES
========================================================= */

export type ProposalStatus = 'sent' | 'accepted' | 'declined';

export interface ChefProposalEntity {
  id: string;
  requestId: string;
  chefId: string;
  priceTotal?: number;
  message?: string;
  status: ProposalStatus;
  createdAt: string;
  pricePerPerson?: number;
}

/* =========================================================
   STORAGE KEYS
========================================================= */

const DB_KEY = 'chef_talents_requests_db';
const CHEF_USERS_KEY = 'chef_talents_users_db';
const MISSIONS_KEY = 'chef_talents_missions_db';
const PROPOSALS_KEY = 'chef_talents_proposals_db';

const SESSION_KEY = 'chef_session_user';

/* =========================================================
   HELPERS
========================================================= */

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const getDb = (): RequestEntity[] =>
  typeof window === 'undefined'
    ? []
    : safeParse<RequestEntity[]>(localStorage.getItem(DB_KEY), []);

const saveDb = (data: RequestEntity[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }
};

const getChefDb = (): ChefUser[] =>
  typeof window === 'undefined'
    ? []
    : safeParse<ChefUser[]>(localStorage.getItem(CHEF_USERS_KEY), []);

const saveChefDb = (data: ChefUser[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHEF_USERS_KEY, JSON.stringify(data));
  }
};

const getMissionsDb = (): Mission[] =>
  typeof window === 'undefined'
    ? []
    : safeParse<Mission[]>(localStorage.getItem(MISSIONS_KEY), []);

const saveMissionsDb = (data: Mission[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
  }
};

const getProposalsDb = (): ChefProposalEntity[] =>
  typeof window === 'undefined'
    ? []
    : safeParse<ChefProposalEntity[]>(localStorage.getItem(PROPOSALS_KEY), []);

const saveProposalsDb = (data: ChefProposalEntity[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(data));
  }
};

function getChefById(id: string): ChefUser | undefined {
  return getChefDb().find(c => c.id === id);
}

function isChefActive(chef: ChefUser | undefined | null): boolean {
  return !!chef && chef.role === 'chef' && chef.status === 'active';
}

function setSessionUser(user: ChefUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
}

function getSessionUser(): ChefUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as ChefUser) : null;
}

function clearSessionUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Seed admin en localStorage (MVP)
 * NOTE: on le met en role 'chef' car ton type ne permet pas 'admin'
 * => L’admin est détecté via l’email (isAdminUser)
 */
function ensureAdminSeed() {
  if (typeof window === 'undefined') return;

  const db = getChefDb();
  const exists = db.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!exists) {
    const adminUser: ChefUser = {
      id: crypto.randomUUID(),
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      firstName: 'Thomas',
      lastName: 'Admin',
      role: 'chef', // ✅ admin détecté par email
      status: 'active',
      createdAt: new Date().toISOString(),
      profileCompleted: true,
      plan: 'free',
      planStatus: 'coming_soon',
      planUpdatedAt: new Date().toISOString(),
      adminNotes: 'Admin seeded',
      profile: {
        images: [],
        unavailableDates: [],
        environments: [],
        specialties: [],
        coverageZones: [],
        acceptedMissions: ['dinner'],
        languages: [],
      },
    };

    db.push(adminUser);
    saveChefDb(db);
  }
}

/* =========================================================
   API
========================================================= */

export const api = {
  /* ---------- REQUESTS ---------- */

  async createRequest(form: RequestForm): Promise<RequestEntity> {
    await delay(200);

    const db = getDb();
    const isB2B = form.clientType === 'concierge';

    const entity: RequestEntity = {
      id: crypto.randomUUID(),
      mode: form.mode,
      userType: isB2B ? 'b2b' : 'b2c',
      location: form.location,
      dates: {
        start: form.startDate,
        end: form.endDate,
        type: form.dateMode,
      },
      guestCount: form.guestCount,
      missionType: form.assignmentType,
      serviceLevel: form.serviceExpectations,
      preferences: {
        cuisine: form.cuisinePreferences,
        allergies: form.dietaryRestrictions,
        languages: form.preferredLanguage,
      },
      budgetRange: form.budgetRange,
      notes: form.notes,
      contact: {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        company: form.companyName,
      },
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    db.unshift(entity);
    saveDb(db);

    // ✅ FAST MATCH AUTO (uniquement B2C + fast)
    // ✅ uniquement sur des chefs actifs (validés)
    // ❌ B2B => veto humain (donc pas d’auto-match)
    if (entity.mode === 'fast' && entity.userType === 'b2c') {
      const activeChefs = getChefDb().filter(c => c.role === 'chef' && c.status === 'active');
     let matchedChefs = matchChefsForFastRequest(entity, chefs);

// ✅ tri par score (desc)
matchedChefs = matchedChefs
  .map(c => ({ c, s: auth.computeChefScore(c).score }))
  .sort((a, b) => b.s - a.s)
  .map(x => x.c);

// ✅ top 5
matchedChefs = matchedChefs.slice(0, 5);
      
      if (matchedChefs.length > 0) {
        const proposalsToCreate = buildFastMatchProposals(entity, matchedChefs);

        const pDb = getProposalsDb().filter(p => p.requestId !== entity.id);
        pDb.unshift(...proposalsToCreate);
        saveProposalsDb(pDb);

        // passe la request en review
        const freshDb = getDb();
        const idx = freshDb.findIndex(r => r.id === entity.id);
        if (idx !== -1) {
          freshDb[idx].status = 'in_review';
          saveDb(freshDb);
        }
      }
    }

    return entity;
  },

  async getRequests(): Promise<RequestEntity[]> {
    await delay(120);
    return getDb();
  },

  async getRequest(id: string): Promise<RequestEntity | undefined> {
    await delay(120);
    return getDb().find(r => r.id === id);
  },

  async updateStatus(id: string, status: RequestStatus): Promise<void> {
    await delay(120);
    const db = getDb();
    const i = db.findIndex(r => r.id === id);
    if (i !== -1) {
      db[i].status = status;
      saveDb(db);
    }
  },

  async closeRequest(id: string): Promise<void> {
    await delay(120);
    const db = getDb();
    const i = db.findIndex(r => r.id === id);
    if (i !== -1) {
      db[i].status = 'closed';
      saveDb(db);
    }
  },

  /* ---------- PROPOSALS ---------- */

  /**
   * ✅ Admin crée des proposals manuellement
   * 🔒 IMPORTANT: on refuse tout chef non-validé (status !== active)
   */
  async createProposals(
    requestId: string,
    proposals: Array<{
      chefId: string;
      priceTotal?: number;
      pricePerPerson?: number;
      message?: string;
    }>
  ): Promise<ChefProposalEntity[]> {
    await delay(120);

    // garde uniquement les chefs actifs (validés)
    const allowed = proposals.filter(p => isChefActive(getChefById(p.chefId)));
    if (allowed.length === 0) return [];

    const createdAt = new Date().toISOString();

    const created: ChefProposalEntity[] = allowed.map(p => ({
      id: crypto.randomUUID(),
      requestId,
      chefId: p.chefId,
      priceTotal: p.priceTotal,
      // @ts-ignore (si besoin selon ton type)
      pricePerPerson: p.pricePerPerson,
      message: p.message,
      status: 'sent',
      createdAt,
    }));

    const db = getProposalsDb();
    db.unshift(...created);
    saveProposalsDb(db);

    // met la request en review si new
    const rDb = getDb();
    const idx = rDb.findIndex(r => r.id === requestId);
    if (idx !== -1 && rDb[idx].status === 'new') {
      rDb[idx].status = 'in_review';
      saveDb(rDb);
    }

    return created;
  },

  async getProposal(id: string): Promise<ChefProposalEntity | undefined> {
    await delay(80);
    return getProposalsDb().find(p => p.id === id);
  },

  async listProposalsByRequest(requestId: string): Promise<ChefProposalEntity[]> {
    await delay(100);
    return getProposalsDb()
      .filter(p => p.requestId === requestId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getChefProposals(chefId: string): Promise<ChefProposalEntity[]> {
    await delay(100);

    // 🔒 un chef non actif ne voit aucune offer
    if (!isChefActive(getChefById(chefId))) return [];

    const requests = getDb();
    return getProposalsDb()
      .filter(p => p.chefId === chefId && p.status === 'sent')
      .filter(p => {
        const req = requests.find(r => r.id === p.requestId);
        return !!req && req.status !== 'assigned' && req.status !== 'closed';
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOfferDetail(proposalId: string): Promise<{
    proposal?: ChefProposalEntity;
    request?: RequestEntity;
  }> {
    await delay(120);

    const proposal = getProposalsDb().find(p => p.id === proposalId);
    if (!proposal) return {};

    const request = getDb().find(r => r.id === proposal.requestId);
    return { proposal, request };
  },

  /**
   * 🔒 IMPORTANT: même si quelqu’un “force”, on ne crée pas de mission
   * si le chef n’est pas validé (active).
   */
  async acceptProposal(proposalId: string): Promise<void> {
    await delay(120);

    const proposals = getProposalsDb();
    const target = proposals.find(p => p.id === proposalId);
    if (!target) return;

    const chef = getChefById(target.chefId);
    if (!isChefActive(chef)) {
      throw new Error('CHEF_NOT_ACTIVE');
    }

    const requests = getDb();
    const reqIdx = requests.findIndex(r => r.id === target.requestId);
    if (reqIdx === -1) return;

    const req = requests[reqIdx];
    if (req.status === 'assigned' || req.status === 'closed') return;

    // accepte celle-ci, décline les autres
    for (const p of proposals) {
      if (p.requestId !== target.requestId) continue;
      p.status = p.id === proposalId ? 'accepted' : 'declined';
    }

    req.status = 'assigned';

    saveProposalsDb(proposals);
    saveDb(requests);

    await this.createMission({
      chefId: target.chefId,
      requestId: req.id,
      title: req.missionType ? `Mission - ${req.missionType}` : 'Mission Chef Talents',
      location: req.location,
      startDate: req.dates.start,
      endDate: req.dates.end,
      guestCount: req.guestCount,
      serviceLevel: req.serviceLevel,
      estimatedAmount: target.priceTotal ?? 0,
      clientPhone: req.contact?.phone,
      status: 'offered',
    });
  },

  async selectProposal(requestId: string, proposalId: string): Promise<void> {
    await delay(80);

    const proposals = getProposalsDb();
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) throw new Error('PROPOSAL_NOT_FOUND');
    if (proposal.requestId !== requestId) throw new Error('PROPOSAL_REQUEST_MISMATCH');

    const req = getDb().find(r => r.id === requestId);
    if (!req) throw new Error('REQUEST_NOT_FOUND');
    if (req.status === 'assigned' || req.status === 'closed') throw new Error('REQUEST_ALREADY_ASSIGNED');

    await this.acceptProposal(proposalId);
  },

  async declineProposal(proposalId: string): Promise<void> {
    await delay(100);
    const proposals = getProposalsDb();
    const p = proposals.find(x => x.id === proposalId);
    if (p) {
      p.status = 'declined';
      saveProposalsDb(proposals);
    }
  },

  /* ---------- MISSIONS ---------- */

  async getChefMissions(chefId: string): Promise<Mission[]> {
    await delay(120);

    // 🔒 un chef non actif ne voit aucune mission
    if (!isChefActive(getChefById(chefId))) return [];

    const db = getMissionsDb();
    return db
      .filter(m => m.chefId === chefId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllMissions(): Promise<Mission[]> {
    await delay(120);
    return getMissionsDb().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateMissionStatus(missionId: string, status: MissionStatus): Promise<void> {
    await delay(120);
    const db = getMissionsDb();
    const idx = db.findIndex(m => m.id === missionId);
    if (idx !== -1) {
      db[idx].status = status;
      saveMissionsDb(db);
    }
  },

  async createMission(mission: Omit<Mission, 'id' | 'createdAt'>): Promise<Mission> {
    await delay(120);

    // 🔒 sécurité finale : pas de mission si chef non actif
    const chef = getChefById(mission.chefId);
    if (!isChefActive(chef)) {
      throw new Error('CHEF_NOT_ACTIVE');
    }

    const db = getMissionsDb();
    const newMission: Mission = {
      ...mission,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.push(newMission);
    saveMissionsDb(db);
    return newMission;
  },
};

/* =========================================================
   AUTH
========================================================= */

export const auth = {
  async registerChef(
    data: Pick<ChefUser, 'email' | 'password' | 'firstName' | 'lastName'>
  ): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(200);

    const db = getChefDb();
    if (db.find(u => u.email === data.email)) {
      return { success: false, error: 'Cet email est déjà utilisé.' };
    }

    const newUser: ChefUser = {
      id: crypto.randomUUID(),
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'chef',
      status: 'pending_validation',
      createdAt: new Date().toISOString(),
      profileCompleted: false,
      plan: 'free',
      planStatus: 'coming_soon',
      planUpdatedAt: new Date().toISOString(),
      adminNotes: '',
      profile: {
        images: [],
        unavailableDates: [],
        environments: [],
        specialties: [],
        coverageZones: [],
        acceptedMissions: ['dinner'],
        languages: [],
      },
    };
    // ✅ SCORE — simple & stable
computeChefScore(user: ChefUser): { score: number; badges: string[] } {
  const p: any = user.profile || {};
  let score = 0;
  const badges: string[] = [];

  // Profil
  if (p.bio) score += 10;
  if (p.yearsExperience) score += 10;
  if (p.baseCity) score += 8;
  if (p.profileType) score += 7;

  // Qualité du profil
  const images = Array.isArray(p.images) ? p.images.length : 0;
  if (images >= 1) score += 5;
  if (images >= 3) score += 10;

  const specialties = Array.isArray(p.specialties) ? p.specialties.length : 0;
  if (specialties >= 1) score += 8;
  if (specialties >= 3) score += 12;

  const coverage = Array.isArray(p.coverageZones) ? p.coverageZones.length : 0;
  if (coverage >= 1) score += 10;

  const langs = Array.isArray(p.languages) ? p.languages.length : 0;
  if (langs >= 1) score += 5;
  if (langs >= 2) score += 8;

  // Bonus “interview”
  if (p.interviewed === true) {
    score += 15;
    badges.push('Interviewé');
  }

  // Clamp 0–100
  score = Math.max(0, Math.min(100, score));

  return { score, badges };
},

    db.push(newUser);
    saveChefDb(db);
    setSessionUser(newUser);

    return { success: true, user: newUser };
  },

  async loginChef(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(200);
    ensureAdminSeed();

    const db = getChefDb();
    const user = db.find(u => u.email === email && u.password === password);

    if (!user) return { success: false, error: 'Identifiants invalides' };

    // 🔒 Si ce n’est pas l’admin, on bloque tant que pas active
    if (!isAdminUser(user) && user.role === 'chef' && user.status !== 'active') {
      return {
        success: false,
        error: "Ton compte est en attente de validation par l'équipe Chef Talents.",
      };
    }

    setSessionUser(user);
    return { success: true, user };
  },

  // ✅ ADMIN — list all chefs
  async getAllChefs(): Promise<ChefUser[]> {
    await delay(120);
    return getChefDb().filter(u => u.role === 'chef');
  },
  // ✅ SCORING (MVP) — simple, lisible, scalable
computeChefScore(chef: ChefUser): {
  score: number;
  badges: string[];
  breakdown: Array<{ label: string; points: number }>;
} {
  let score = 0;
  const badges: string[] = [];
  const breakdown: Array<{ label: string; points: number }> = [];

  const add = (label: string, points: number, badge?: string) => {
    if (!points) return;
    score += points;
    breakdown.push({ label, points });
    if (badge) badges.push(badge);
  };

  const profile = (chef as any).profile ?? {};

  // 1) Statuts & sécurité (ceux qui reçoivent des missions = active, mais le score peut s’afficher pour tous)
  if (chef.status === 'active') add('Chef actif', 10, '✅ Actif');
  if (chef.status === 'approved') add('Chef approuvé', 5, '🟦 Approuvé');
  if (chef.status === 'pending_validation') add('En attente de validation', 0, '🟨 À valider');

  // 2) Profil complété
  if (chef.profileCompleted) add('Profil complété', 20, '🧾 Profil complet');

  // 3) Signaux simples de qualité/fit (basés sur ce que tu as déjà dans profile)
  const imagesCount = Array.isArray(profile.images) ? profile.images.length : 0;
  if (imagesCount >= 3) add('Photos (≥ 3)', 10);

  const zonesCount = Array.isArray(profile.coverageZones) ? profile.coverageZones.length : 0;
  if (zonesCount >= 1) add('Zone de couverture renseignée', 10);

  const langsCount = Array.isArray(profile.languages) ? profile.languages.length : 0;
  if (langsCount >= 1) add('Langues renseignées', 5);

  const specsCount = Array.isArray(profile.specialties) ? profile.specialties.length : 0;
  if (specsCount >= 2) add('Spécialités (≥ 2)', 5);

  const envCount = Array.isArray(profile.environments) ? profile.environments.length : 0;
  if (envCount >= 1) add('Environnements', 3);

  // yearsExperience / baseCity / bio / profileType (si présents dans ton type)
  const years = Number(profile.yearsExperience ?? 0);
  if (years >= 5) add('Expérience (≥ 5 ans)', 10);
  else if (years >= 2) add('Expérience (≥ 2 ans)', 5);

  if (profile.baseCity) add('Ville de base', 3);
  if (profile.bio) add('Bio', 3);
  if (profile.profileType) add('Type de profil', 3);

  // 4) Badge “interviewé” (tu peux stocker ça dans profile.interviewed = true)
  // -> plus tard, tu coches ce champ depuis l’admin
  if (profile.interviewed === true) add('Interview validée', 15, '🎥 Interview');

  // 5) Bonus “premium” futur (désactivé pour l’instant)
  // if (chef.plan === 'pro' && chef.planStatus === 'active') add('Abonnement Pro', 10, '💎 Pro');

  // Garde-fou : limite le score
  if (score > 100) score = 100;

  return { score, badges, breakdown };
},

  // ✅ ADMIN — update chef status
  async updateChefStatus(userId: string, status: ChefUser['status']): Promise<void> {
    await delay(120);
    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db[idx].status = status;
      saveChefDb(db);

      // sync session si c’est lui
      const session = getSessionUser();
      if (session?.id === userId) setSessionUser(db[idx]);
    }
  },

  async updateChefProfile(
    userId: string,
    updates: Partial<ChefProfile>
  ): Promise<ChefUser | null> {
    await delay(200);

    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    const currentUser = db[idx];
    const updatedProfile = { ...(currentUser.profile ?? {}), ...updates };

    const isComplete = !!(
      updatedProfile.bio &&
      updatedProfile.yearsExperience &&
      updatedProfile.baseCity &&
      updatedProfile.profileType
    );

    const updatedUser: ChefUser = {
      ...currentUser,
      profile: updatedProfile,
      profileCompleted: isComplete,
    };

    db[idx] = updatedUser;
    saveChefDb(db);

    const session = getSessionUser();
    if (session?.id === userId) setSessionUser(updatedUser);

    return updatedUser;
  },

  getCurrentUser(): ChefUser | null {
    return getSessionUser();
  },

  async deleteChefAccount(userId: string): Promise<void> {
    await delay(120);

    saveChefDb(getChefDb().filter(u => u.id !== userId));
    saveProposalsDb(getProposalsDb().filter(p => p.chefId !== userId));
    saveMissionsDb(getMissionsDb().filter(m => m.chefId !== userId));

    const session = getSessionUser();
    if (session?.id === userId) clearSessionUser();
  },

  logout() {
    clearSessionUser();
  },
};
