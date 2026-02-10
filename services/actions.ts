import type {
  RequestForm,
  FastMatchResult,
  ChefApplicationForm,
  RequestStatus,
  ChefUser,
  ChefProfile,
  Mission,
  MissionStatus,
} from '../types';

import { api, auth } from './storage';
import type { ChefProposalEntity } from './storage';

// --------------------
// Helpers (request payload safety)
// --------------------

const toNullIfEmpty = (v: any): string | null => {
  const s = String(v ?? '').trim();
  return s ? s : null;
};

const toISODateOrNull = (v: any): string | null => {
  const s = String(v ?? '').trim();
  if (!s) return null;

  // accepte uniquement YYYY-MM-DD (Supabase "date")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
};

const toNumberOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toBudgetRangeText = (data: RequestForm): string | null => {
  if (data.mode === 'fast') {
    const n = (data as any).budgetPerPerson;
    const nNum = toNumberOrNull(n);
    if (nNum === null) return null;
    return `${nNum} € / pers (hors frais de service)`;
  }

  // concierge
  const s = (data as any).budgetRange;
  return toNullIfEmpty(s);
};

// --------------------
// PUBLIC ACTIONS
// --------------------

export const submitRequest = async (data: RequestForm): Promise<FastMatchResult> => {
  // 1) firstName depuis fullName
  const fullName = (data.fullName || '').trim();
  const firstName = fullName ? fullName.split(' ')[0] : undefined;

  // 2) message lisible (brief)
  const message =
    data.mode === 'fast'
      ? [
          `MODE: FAST`,
          `Lieu: ${data.location}`,
          `Date: ${data.startDate}`,
          `Convives: ${data.guestCount}`,
          `Budget/pers: ${(data as any).budgetPerPerson ?? ''}`,
          `Préférences: ${data.cuisinePreferences || ''}`,
          `Téléphone: ${data.phone || ''}`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `MODE: CONCIERGE`,
          `ClientType: ${(data as any).clientType ?? ''}`,
          `Société: ${(data as any).companyName || ''}`,
          `Lieu: ${data.location}`,
          `Start: ${data.startDate}`,
          `End: ${(data as any).endDate || ''}`,
          `Assignation: ${(data as any).assignmentType || ''}`,
          `Convives: ${data.guestCount}`,
          `Budget: ${(data as any).budgetRange || ''}`,
          `Notes: ${(data as any).notes || ''}`,
          `Téléphone: ${data.phone || ''}`,
        `Langues: ${(data as any).preferredLanguage ?? ''}`,
`Restrictions: ${(data as any).dietaryRestrictions ?? ''}`,
`Cuisine: ${(data as any).cuisinePreferences ?? ''}`,
        ]
          .filter(Boolean)
          .join('\n');

  // 3) payload structuré (⚠️ dates safe)
    const payload = {
    email: toNullIfEmpty(data.email),
    firstName: toNullIfEmpty(firstName),

    matchType: data.mode,
    message: toNullIfEmpty(message),

    phone: toNullIfEmpty((data as any).phone),

    clientType: toNullIfEmpty((data as any).clientType),
    companyName: toNullIfEmpty((data as any).companyName),

    location: toNullIfEmpty((data as any).location),

    startDate: toISODateOrNull((data as any).startDate),
    endDate: toISODateOrNull((data as any).endDate),

    guestCount: toNumberOrNull((data as any).guestCount),

    budgetRange: toBudgetRangeText(data),

    assignmentType: toNullIfEmpty((data as any).assignmentType),

    // ✅ AJOUTS : CE SONT EUX QUI REMPLISSENT TES COLONNES
    // On supporte string OU array (ton backend joinIfArray gère les deux)
    preferredLanguage:
      data.mode === 'concierge'
        ? ((data as any).preferredLanguage ?? (data as any).languages ?? (data as any).language)
        : null,

    dietaryRestrictions:
      data.mode === 'concierge'
        ? ((data as any).dietaryRestrictions ?? (data as any).restrictions ?? (data as any).allergies)
        : null,

    cuisinePreferences:
      data.mode === 'concierge'
        ? ((data as any).cuisinePreferences ?? (data as any).cuisineStyle ?? (data as any).cuisines)
        : null,
  };

  // (optionnel) garde-fou: si fast => endDate null ok, si startDate null => laisse passer mais tu verras "—"
  // if (data.mode === 'fast' && !payload.startDate) throw new Error('Start date required');

  const r = await fetch('/api/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    console.error('API /api/request error', r.status, txt);
    throw new Error(`API request failed: ${r.status}`);
  }

  const json = (await r.json().catch(() => ({}))) as { ok?: boolean; requestId?: string };

  // 4) retour UI
  if (data.mode === 'fast') {
    return {
      success: true,
      mode: 'instant_match',
      referenceId: json.requestId || crypto.randomUUID(),
      matchedChef: 'Chef Selection Pending',
    };
  }

  return {
    success: true,
    mode: 'concierge_manual',
    referenceId: json.requestId || crypto.randomUUID(),
  };
};

/**
 * Chef application unchanged
 */
export const submitChefApplication = async (data: ChefApplicationForm) => {
  const parts = (data.fullName || '').trim().split(' ');
  const firstName = parts.shift() || 'Chef';
  const lastName = parts.join(' ') || '';

  const res = await auth.registerChef({
    email: data.email,
    password: crypto.randomUUID().slice(0, 10),
    firstName,
    lastName,
  });

  if (!res.success || !res.user) return res;

  await auth.updateChefProfile(res.user.id, {
    phone: data.phone,
    baseCity: data.baseCity,
    travelRadiusKm: extractKm(data.travelRange),
    languages: splitList(data.languages),
    specialties: splitList(data.specialties),
    bio: data.availabilityNotes || '',
    environments: [
      ...(data.background?.yacht ? ['yacht'] : []),
      ...(data.background?.palace ? ['hotel'] : []),
      ...(data.background?.privateHousehold ? ['private_household'] : []),
      ...(data.background?.michelin ? ['restaurant'] : []),
    ],
  });

  return { success: true, id: res.user.id };
};

// --------------------
// BACKOFFICE: REQUESTS
// --------------------

export const boListRequests = async (): Promise<any[]> => {
  // si encore utilisé: renvoie direct ce que retourne l'API storage
  return (await api.getRequests()) ?? [];
};

export const boGetRequest = async (id: string) => api.getRequest(id);
export const boUpdateRequestStatus = async (id: string, status: RequestStatus) => api.updateStatus(id, status);
export const boCloseRequest = async (id: string) => api.closeRequest(id);

// ... le reste inchangé

function splitList(value: string): string[] {
  if (!value) return [];
  return value
    .split(/,|\n|;|\|/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractKm(value: string): number {
  if (!value) return 0;
  const m = value.match(/(\d{1,4})/);
  return m ? Number(m[1]) : 0;
}
