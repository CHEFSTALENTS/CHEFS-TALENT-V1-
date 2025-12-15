import {
  RequestEntity,
  RequestForm,
  RequestStatus,
  ChefUser,
  ChefProfile,
  SubscriptionPlan,
  Mission,
  MissionStatus
} from '../types';

/**
 * ✅ Fallback types (à déplacer dans ../types si tu veux)
 */
export type ProposalStatus = 'sent' | 'accepted' | 'declined' | 'expired';

export type ChefProposalEntity = {
  id: string;
  requestId: string;
  chefId: string;
  priceTotal?: number;
  pricePerPerson?: number;
  message?: string;
  status: ProposalStatus;
  createdAt: string;
};

const DB_KEY = 'chef_talents_requests_db';
const CHEF_USERS_KEY = 'chef_talents_users_db';
const MISSIONS_KEY = 'chef_talents_missions_db';

// ✅ NEW: proposals db
const PROPOSALS_KEY = 'chef_talents_proposals_db';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- INTERNAL DB HELPERS ---

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const getDb = (): RequestEntity[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(DB_KEY);
  return safeParse<RequestEntity[]>(raw, []);
};

const saveDb = (data: RequestEntity[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

const getChefDb = (): ChefUser[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CHEF_USERS_KEY);
  return safeParse<ChefUser[]>(raw, []);
};

const saveChefDb = (data: ChefUser[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHEF_USERS_KEY, JSON.stringify(data));
};

const getMissionsDb = (): Mission[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(MISSIONS_KEY);
  return safeParse<Mission[]>(raw, []);
};

const saveMissionsDb = (data: Mission[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
};

// ✅ NEW: proposals helpers
const getProposalsDb = (): ChefProposalEntity[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(PROPOSALS_KEY);
  return safeParse<ChefProposalEntity[]>(raw, []);
};

const saveProposalsDb = (data: ChefProposalEntity[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROPOSALS_KEY, JSON.stringify(data));
};

// --- API LAYER ---

export const api = {
  // --------------------
  // Requests
  // --------------------
  async createRequest(form: RequestForm): Promise<RequestEntity> {
    await delay(600);
    const db = getDb();
    const isB2B = form.clientType === 'concierge';

    const entity: RequestEntity = {
      id: crypto.randomUUID(),
      mode: form.mode,
      userType: isB2B ? 'b2b' : 'b2c',
      location: form.location,
      dates: { start: form.startDate, end: form.endDate, type: form.dateMode },
      guestCount: form.guestCount,
      missionType: form.assignmentType,
      serviceLevel: form.serviceExpectations,
      preferences: {
        cuisine: form.cuisinePreferences,
        allergies: form.dietaryRestrictions,
        languages: form.preferredLanguage
      },
      budgetRange: form.budgetRange,
      notes: form.notes,
      contact: { name: form.fullName, email: form.email, phone: form.phone, company: form.companyName },
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    db.unshift(entity);
    saveDb(db);
    return entity;
  },

  async getRequests(): Promise<RequestEntity[]> {
    await delay(400);
    return getDb();
  },

  async getRequest(id: string): Promise<RequestEntity | undefined> {
    await delay(200);
    return getDb().find(r => r.id === id);
  },

  async updateStatus(id: string, status: RequestStatus): Promise<void> {
  await delay(300);
  const db = getDb();
  const index = db.findIndex(r => r.id === id);
  if (index !== -1) {
    db[index].status = status;
    saveDb(db);
  }
},

async closeRequest(id: string): Promise<void> {
  await delay(250);
  const db = getDb();
  const idx = db.findIndex(r => r.id === id);
  if (idx !== -1) {
    db[idx].status = 'closed';
    saveDb(db);
  }
},


  // --------------------
  // Proposals (NEW)
  // --------------------
  async createProposals(
    requestId: string,
    proposals: Array<{ chefId: string; priceTotal?: number; pricePerPerson?: number; message?: string }>
  ): Promise<ChefProposalEntity[]> {
    await delay(300);
    const pDb = getProposalsDb();

    const created: ChefProposalEntity[] = proposals.map(p => ({
      id: crypto.randomUUID(),
      requestId,
      chefId: p.chefId,
      priceTotal: p.priceTotal,
      pricePerPerson: p.pricePerPerson,
      message: p.message,
      status: 'sent',
      createdAt: new Date().toISOString()
    }));

    // newest first
    pDb.unshift(...created);
    saveProposalsDb(pDb);

    // optional: update request status to "proposed" if your RequestStatus supports it
    // Otherwise keep as-is.
    const rDb = getDb();
    const idx = rDb.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      // @ts-ignore (au cas où 'proposed' n’existe pas dans ton union RequestStatus)
      if (rDb[idx].status === 'new') rDb[idx].status = rDb[idx].status;
      saveDb(rDb);
    }

    return created;
  },

  async listProposalsByRequest(requestId: string): Promise<ChefProposalEntity[]> {
    await delay(200);
    return getProposalsDb()
      .filter(p => p.requestId === requestId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async selectProposal(requestId: string, proposalId: string): Promise<void> {
    await delay(300);

    // 1) Mark accepted/declined in proposals
    const pDb = getProposalsDb();
    let accepted: ChefProposalEntity | undefined;

    for (const p of pDb) {
      if (p.requestId !== requestId) continue;
      if (p.id === proposalId) {
        p.status = 'accepted';
        accepted = p;
      } else {
        // decline all other proposals of this request
        if (p.status !== 'declined') p.status = 'declined';
      }
    }
    saveProposalsDb(pDb);

    // 2) Update request status (confirmed if your RequestStatus supports it)
    const rDb = getDb();
    const rIdx = rDb.findIndex(r => r.id === requestId);
    const req = rIdx !== -1 ? rDb[rIdx] : undefined;

    if (rIdx !== -1) {
      // @ts-ignore (si 'confirmed' n’existe pas dans ton union RequestStatus, adapte)
      rDb[rIdx].status = 'confirmed';
      saveDb(rDb);
    }

    // 3) Create a mission for the selected chef (optional but very useful)
    if (accepted && req) {
      await this.createMission({
        chefId: accepted.chefId,
        title: req.missionType ? `Mission - ${req.missionType}` : 'Mission Chef Talents',
        location: req.location,
        startDate: req.dates?.start,
        endDate: req.dates?.end,
        guestCount: req.guestCount,
        serviceLevel: req.serviceLevel,
        estimatedAmount: accepted.priceTotal ?? 0,
        clientPhone: req.contact?.phone,
        status: 'offered'
      });
    }
  },

  // --------------------
  // Missions
  // --------------------
  async getChefMissions(chefId: string): Promise<Mission[]> {
    await delay(300);
    const db = getMissionsDb();
    return db
      .filter(m => m.chefId === chefId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getAllMissions(): Promise<Mission[]> {
    await delay(300);
    return getMissionsDb().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateMissionStatus(missionId: string, status: MissionStatus): Promise<void> {
    await delay(400);
    const db = getMissionsDb();
    const idx = db.findIndex(m => m.id === missionId);
    if (idx !== -1) {
      db[idx].status = status;
      saveMissionsDb(db);
    }
  },

  async createMission(mission: Omit<Mission, 'id' | 'createdAt'>): Promise<Mission> {
    await delay(400);
    const db = getMissionsDb();
    const newMission: Mission = { ...mission, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    db.push(newMission);
    saveMissionsDb(db);
    return newMission;
  }
};

// --- CHEF AUTH / PROFILE ---

export const auth = {
  async registerChef(
    data: Pick<ChefUser, 'email' | 'password' | 'firstName' | 'lastName'>
  ): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(800);
    const db = getChefDb();

    if (db.find(u => u.email === data.email)) {
      return { success: false, error: "Cet email est déjà utilisé." };
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
      profile: {
        images: [],
        unavailableDates: [],
        environments: [],
        specialties: [],
        coverageZones: [],
        acceptedMissions: ['dinner'],
        languages: []
      }
    };

    db.push(newUser);
    saveChefDb(db);

    if (typeof window !== 'undefined') {
      localStorage.setItem('chef_session_user', JSON.stringify(newUser));
    }

    return { success: true, user: newUser };
  },

  async loginChef(email: string, password: string): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(800);
    const db = getChefDb();
    const user = db.find(u => u.email === email && u.password === password);

    if (!user) return { success: false, error: "Identifiants invalides." };

    const missionsDb = getMissionsDb();
    if (missionsDb.filter(m => m.chefId === user.id).length === 0) seedChefMissions(user.id);

    if (typeof window !== 'undefined') {
      localStorage.setItem('chef_session_user', JSON.stringify(user));
    }

    return { success: true, user };
  },

  async updateChefProfile(userId: string, updates: Partial<ChefProfile>): Promise<ChefUser | null> {
    await delay(500);
    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    const currentUser = db[idx];
    const updatedProfile = { ...currentUser.profile, ...updates };
    const isComplete = !!(updatedProfile.bio && updatedProfile.yearsExperience && updatedProfile.baseCity && updatedProfile.profileType);

    const updatedUser = { ...currentUser, profileCompleted: isComplete, profile: updatedProfile };
    db[idx] = updatedUser;
    saveChefDb(db);

    const sessionUser = this.getCurrentUser();
    if (sessionUser && sessionUser.id === userId && typeof window !== 'undefined') {
      localStorage.setItem('chef_session_user', JSON.stringify(updatedUser));
    }

    return updatedUser;
  },

  async updateChef(userId: string, updates: Partial<ChefUser>): Promise<ChefUser | null> {
    await delay(400);
    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    const updatedUser = { ...db[idx], ...updates };
    db[idx] = updatedUser;
    saveChefDb(db);

    return updatedUser;
  },

  async updateChefSubscription(userId: string, plan: SubscriptionPlan): Promise<ChefUser | null> {
    await delay(600);
    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx === -1) return null;

    const currentUser = db[idx];
    const updatedUser: ChefUser = {
      ...currentUser,
      plan,
      planStatus: 'coming_soon',
      planUpdatedAt: new Date().toISOString()
    };

    db[idx] = updatedUser;
    saveChefDb(db);

    const sessionUser = this.getCurrentUser();
    if (sessionUser && sessionUser.id === userId && typeof window !== 'undefined') {
      localStorage.setItem('chef_session_user', JSON.stringify(updatedUser));
    }

    return updatedUser;
  },

  async updateChefStatus(userId: string, status: ChefUser['status']): Promise<void> {
    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);

    if (idx !== -1) {
      db[idx].status = status;
      saveChefDb(db);

      const sessionUser = this.getCurrentUser();
      if (sessionUser && sessionUser.id === userId && typeof window !== 'undefined') {
        localStorage.setItem('chef_session_user', JSON.stringify(db[idx]));
      }
    }
  },

  async deleteChefAccount(userId: string): Promise<void> {
    const db = getChefDb();
    const newDb = db.filter(u => u.id !== userId);
    saveChefDb(newDb);

    if (typeof window !== 'undefined') localStorage.removeItem('chef_session_user');
  },

  async getAllChefs(): Promise<ChefUser[]> {
    await delay(400);
    return getChefDb();
  },

  getCurrentUser(): ChefUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('chef_session_user');
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    if (typeof window !== 'undefined') localStorage.removeItem('chef_session_user');
  }
};

function seedChefMissions(chefId: string) {
  const missions: Mission[] = [
    {
      id: crypto.randomUUID(),
      chefId,
      title: 'Dîner Privé - Villa K',
      location: 'Saint-Tropez, FR',
      startDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      guestCount: 8,
      serviceLevel: 'Chef Seul',
      estimatedAmount: 850,
      clientPhone: '33612345678',
      status: 'offered',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      chefId,
      title: 'Résidence été - Famille B',
      location: 'Megève, FR',
      startDate: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 35).toISOString().split('T')[0],
      guestCount: 12,
      serviceLevel: 'Chef + Service',
      estimatedAmount: 12500,
      clientPhone: '33698765432',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: crypto.randomUUID(),
      chefId,
      title: 'Cocktail Dinatoire',
      location: 'Paris 16, FR',
      startDate: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
      guestCount: 30,
      serviceLevel: 'Brigade',
      estimatedAmount: 2400,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
    },
    {
      id: crypto.randomUUID(),
      chefId,
      title: 'Dîner Anniversaire',
      location: 'Neuilly, FR',
      startDate: new Date(Date.now() - 86400000 * 45).toISOString().split('T')[0],
      guestCount: 6,
      serviceLevel: 'Chef Seul',
      estimatedAmount: 600,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 50).toISOString()
    }
  ];

  const db = getMissionsDb();
  db.push(...missions);
  saveMissionsDb(db);
}
function matchChefsForFastRequest(
  request: RequestEntity,
  chefs: ChefUser[]
): ChefUser[] {
  return chefs.filter(chef => {
    if (chef.status !== 'active') return false;
    if (!chef.profileCompleted || !chef.profile) return false;

    const profile = chef.profile;

    // Ville / zone
    const locationMatch =
      profile.baseCity === request.location ||
      profile.coverageZones?.includes(request.location);

    if (!locationMatch) return false;

    // Guest count
    if (profile.maxGuestCount && request.guestCount > profile.maxGuestCount) {
      return false;
    }

    // Dates indisponibles
    if (profile.unavailableDates?.includes(request.dates.start)) {
      return false;
    }

    return true;
  });
}
async function autoProcessFastRequest(request: RequestEntity) {
  const chefs = getChefDb();

  const matchedChefs = matchChefsForFastRequest(request, chefs);

  if (matchedChefs.length === 0) {
    console.warn('No chefs matched – escalate to concierge');
    return;
  }

  // On limite à 5 chefs max (important)
  const selectedChefs = matchedChefs.slice(0, 5);

  const proposals: ChefProposalEntity[] = [];
  const notifications: any[] = [];

  const createdAt = new Date().toISOString();

  for (const chef of selectedChefs) {
    const proposalId = crypto.randomUUID();

    proposals.push({
      id: proposalId,
      requestId: request.id,
      chefId: chef.id,
      status: 'sent',
      createdAt
    });

    notifications.push({
      id: crypto.randomUUID(),
      chefId: chef.id,
      type: 'mission_offer',
      requestId: request.id,
      proposalId,
      title: 'Nouvelle mission disponible',
      message: `Prestation à ${request.location} – ${request.guestCount} convives`,
      status: 'unread',
      createdAt
    });
  }

  // Save proposals
  const pDb = getProposalsDb();
  pDb.unshift(...proposals);
  saveProposalsDb(pDb);

  // Save notifications
  const nDb = safeParse<any[]>(
    localStorage.getItem('chef_talents_notifications_db'),
    []
  );
  nDb.unshift(...notifications);
  localStorage.setItem(
    'chef_talents_notifications_db',
    JSON.stringify(nDb)
  );

  // Update request status
  const rDb = getDb();
  const idx = rDb.findIndex(r => r.id === request.id);
  if (idx !== -1) {
    rDb[idx].status = 'in_review';
    saveDb(rDb);
  }
}
