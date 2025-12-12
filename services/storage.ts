
import { RequestEntity, RequestForm, RequestStatus, ChefUser, ChefProfile, SubscriptionPlan, Mission, MissionStatus } from '../types';

const DB_KEY = 'chef_talents_requests_db';
const CHEF_USERS_KEY = 'chef_talents_users_db';
const MISSIONS_KEY = 'chef_talents_missions_db';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- INTERNAL DB HELPERS ---

const getDb = (): RequestEntity[] => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("DB Error", e);
    return [];
  }
};

const saveDb = (data: RequestEntity[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

const getChefDb = (): ChefUser[] => {
  try {
    const raw = localStorage.getItem(CHEF_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveChefDb = (data: ChefUser[]) => {
  localStorage.setItem(CHEF_USERS_KEY, JSON.stringify(data));
};

const getMissionsDb = (): Mission[] => {
  try {
    const raw = localStorage.getItem(MISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveMissionsDb = (data: Mission[]) => {
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
};

// --- API LAYER ---

export const api = {
  /**
   * POST /api/requests
   */
  async createRequest(form: RequestForm): Promise<RequestEntity> {
    await delay(600);
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
        type: form.dateMode
      },
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
      contact: {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        company: form.companyName
      },
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

  // --- MISSION API ---

  async getChefMissions(chefId: string): Promise<Mission[]> {
    await delay(300);
    const db = getMissionsDb();
    return db.filter(m => m.chefId === chefId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    const newMission: Mission = {
      ...mission,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    db.push(newMission);
    saveMissionsDb(db);
    return newMission;
  }
};

// --- AUTH LAYER (MOCKED) ---

export const auth = {
  async registerChef(data: Pick<ChefUser, 'email' | 'password' | 'firstName' | 'lastName'>): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(800);
    const db = getChefDb();
    
    if (db.find(u => u.email === data.email)) {
      return { success: false, error: "Cet email est déjà utilisé." };
    }

    const newUser: ChefUser = {
      id: crypto.randomUUID(),
      email: data.email,
      password: data.password, // In a real app, hash this!
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'chef',
      status: 'pending_validation',
      createdAt: new Date().toISOString(),
      profileCompleted: false,
      
      // Default Subscription: Free (Coming Soon)
      plan: 'free',
      planStatus: 'coming_soon',
      planUpdatedAt: new Date().toISOString(),

      profile: {
        // Init default empty profile
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

    // Mock Session
    localStorage.setItem('chef_session_user', JSON.stringify(newUser));
    return { success: true, user: newUser };
  },

  async loginChef(email: string, password: string): Promise<{ success: boolean; user?: ChefUser; error?: string }> {
    await delay(800);
    const db = getChefDb();
    const user = db.find(u => u.email === email && u.password === password);

    if (!user) {
      return { success: false, error: "Identifiants invalides." };
    }

    // Seed Data Check: If no missions exist for this user, create some fake ones for the demo
    const missionsDb = getMissionsDb();
    const userMissions = missionsDb.filter(m => m.chefId === user.id);
    if (userMissions.length === 0) {
      seedChefMissions(user.id);
    }

    localStorage.setItem('chef_session_user', JSON.stringify(user));
    return { success: true, user };
  },

  async updateChefProfile(userId: string, updates: Partial<ChefProfile>): Promise<ChefUser | null> {
    await delay(500);
    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    
    if (idx === -1) return null;

    // Merge updates
    const currentUser = db[idx];
    const updatedProfile = { ...currentUser.profile, ...updates };
    
    // Check completion logic
    const isComplete = !!(
      updatedProfile.bio && 
      updatedProfile.yearsExperience && 
      updatedProfile.baseCity &&
      updatedProfile.profileType // profileType is now required for completion
    );

    const updatedUser = {
      ...currentUser,
      profileCompleted: isComplete,
      profile: updatedProfile
    };

    db[idx] = updatedUser;
    saveChefDb(db);
    
    // Update session if it's the current user
    const sessionUser = this.getCurrentUser();
    if (sessionUser && sessionUser.id === userId) {
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
    // This is essentially placeholder logic now as subscription is "coming soon"
    await delay(600); 
    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    
    if (idx === -1) return null;

    const currentUser = db[idx];
    const updatedUser: ChefUser = {
      ...currentUser,
      plan: plan,
      planStatus: 'coming_soon', // Ensure we stick to coming_soon for now
      planUpdatedAt: new Date().toISOString()
    };

    db[idx] = updatedUser;
    saveChefDb(db);

    // Update session
    const sessionUser = this.getCurrentUser();
    if (sessionUser && sessionUser.id === userId) {
      localStorage.setItem('chef_session_user', JSON.stringify(updatedUser));
    }

    return updatedUser;
  },

  async updateChefStatus(userId: string, status: ChefUser['status']): Promise<void> {
    // Admin only function essentially
    const db = getChefDb();
    const idx = db.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db[idx].status = status;
      saveChefDb(db);
      
      const sessionUser = this.getCurrentUser();
      if (sessionUser && sessionUser.id === userId) {
        localStorage.setItem('chef_session_user', JSON.stringify(db[idx]));
      }
    }
  },

  async deleteChefAccount(userId: string): Promise<void> {
     const db = getChefDb();
     const newDb = db.filter(u => u.id !== userId);
     saveChefDb(newDb);
     localStorage.removeItem('chef_session_user');
  },

  async getAllChefs(): Promise<ChefUser[]> {
    await delay(400);
    return getChefDb();
  },

  getCurrentUser(): ChefUser | null {
    const raw = localStorage.getItem('chef_session_user');
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem('chef_session_user');
  }
};

// --- DATA SEEDER ---
function seedChefMissions(chefId: string) {
  const missions: Mission[] = [
    {
      id: crypto.randomUUID(),
      chefId,
      title: 'Dîner Privé - Villa K',
      location: 'Saint-Tropez, FR',
      startDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // +3 days
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