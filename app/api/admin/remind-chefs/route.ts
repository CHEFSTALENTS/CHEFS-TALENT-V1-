export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendChefReminder, type MissingField } from '@/lib/sendChefReminder';

const ADMIN_EMAIL = 'thomas@chef-talents.com';
const TABLE = 'chef_profiles';

// ── Copié exactement de /api/admin/chefs/route.ts ─────────────
function safeObj(v: any) {
  if (!v) return {};
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
  if (typeof v === 'object') return v;
  return {};
}

function normalizeProfile(raw: any) {
  const p = safeObj(raw);
  return safeObj(p.profile || p.data || p.user || p);
}

const ALLOWED_STATUS = new Set(['pending_validation', 'approved', 'active', 'paused']);

function normalizeStatus(s: any) {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'pending') return 'pending_validation';
  return ALLOWED_STATUS.has(v) ? v : '';
}

function pickStatus(p: any) {
  const s = normalizeStatus(p.status || p.chefStatus || p.state || '');
  return s || 'pending_validation';
}

function pickName(p: any) {
  const firstName = p.firstName || p.firstname || p.first_name || p.prenom || p.name?.first || '';
  const lastName = p.lastName || p.lastname || p.last_name || p.nom || p.name?.last || '';
  return { firstName: String(firstName || ''), lastName: String(lastName || '') };
}
// ─────────────────────────────────────────────────────────────

function detectMissingFields(p: any): MissingField[] {
  const missing: MissingField[] = [];

  // Ville de base
  const loc = typeof p.location === 'object' ? (p.location ?? {}) : {};
  const baseCity = loc.baseCity || p.baseCity || p.city || p.ville || loc.city || '';
  if (!String(baseCity).trim()) missing.push('baseCity');

  // Bio
  const bio = p.bio || p.about || p.description || '';
  if (!String(bio).trim()) missing.push('bio');

  // Langues
  const langs = p.languages ?? [];
  const hasLangs = Array.isArray(langs) ? langs.length > 0 : !!String(langs).trim();
  if (!hasLangs) missing.push('languages');

  // Spécialités
  const specs = p.specialties ?? p.cuisines ?? [];
  const hasSpecs = Array.isArray(specs) ? specs.length > 0 : !!String(specs).trim();
  if (!hasSpecs) missing.push('specialties');

  // Téléphone
  const phone = p.phone || p.phoneNumber || p.tel || p.telephone || '';
  if (!String(phone).trim()) missing.push('phone');

  // Photo
  const photo = p.avatarUrl || p.photoUrl || p.avatar || p.photo || p.profilePicture || '';
  if (!String(photo).trim()) missing.push('photo');

  return missing;
}

export async function POST(req: NextRequest) {
  const adminEmail = req.headers.get('x-admin-email');
  if (adminEmail?.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;
    const onlyStatus = body?.onlyStatus as string | undefined;

    // Récupère tous les profils — même select que /api/admin/chefs
    const { data: rows, error } = await supabase
      .from(TABLE)
      .select('user_id,email,profile,created_at,updated_at')
      .order('email', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: {
      email: string;
      name: string;
      status: string;
      missingFields: MissingField[];
      sent: boolean;
      skipped: boolean;
      error?: string;
    }[] = [];

    for (const row of rows ?? []) {
      const email = String(row.email || '').trim().toLowerCase();
      if (!email) continue;

      // Normalise le profile exactement comme /api/admin/chefs
      const p = normalizeProfile(row.profile);
      const status = pickStatus(p);
      const { firstName } = pickName(p);

      // Filtre par statut éligible
      const eligibleStatuses = ['active', 'pending_validation', 'approved'];
      if (!eligibleStatuses.includes(status)) continue;
      if (onlyStatus && status !== onlyStatus) continue;

      const missingFields = detectMissingFields(p);

      // Profil complet → on skip
      if (missingFields.length === 0) {
        results.push({ email, name: firstName, status, missingFields: [], sent: false, skipped: true });
        continue;
      }

      if (dryRun) {
        results.push({ email, name: firstName, status, missingFields, sent: false, skipped: false });
        continue;
      }

      try {
        await sendChefReminder({ email, firstName, missingFields });
        results.push({ email, name: firstName, status, missingFields, sent: true, skipped: false });
        await new Promise(r => setTimeout(r, 120));
      } catch (err: any) {
        results.push({ email, name: firstName, status, missingFields, sent: false, skipped: false, error: err?.message });
      }
    }

    const sent    = results.filter(r => r.sent).length;
    const skipped = results.filter(r => r.skipped).length;
    const errors  = results.filter(r => r.error).length;
    const toSend  = results.filter(r => !r.skipped).length;

    return NextResponse.json({
      dryRun,
      total: rows?.length ?? 0,
      eligible: results.length,
      toSend,
      sent,
      skipped,
      errors,
      results,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
