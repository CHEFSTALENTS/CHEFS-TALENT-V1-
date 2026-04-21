// app/api/admin/remind-chefs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendChefReminder, type MissingField } from '@/lib/sendChefReminder';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vérifie si un chef a un profil incomplet et retourne les champs manquants
function detectMissingFields(chef: any): MissingField[] {
  const p = chef.profile ?? {};
  const loc = typeof p.location === 'object' ? p.location : {};
  const missing: MissingField[] = [];

  // Ville de base
  const baseCity = loc.baseCity || p.baseCity || p.city || p.ville || '';
  if (!String(baseCity).trim()) missing.push('baseCity');

  // Bio
  const bio = p.bio || p.about || p.description || '';
  if (!String(bio).trim()) missing.push('bio');

  // Langues
  const langs = p.languages ?? [];
  const hasLangs = Array.isArray(langs) ? langs.length > 0 : !!langs;
  if (!hasLangs) missing.push('languages');

  // Spécialités
  const specs = p.specialties ?? p.cuisines ?? [];
  const hasSpecs = Array.isArray(specs) ? specs.length > 0 : !!specs;
  if (!hasSpecs) missing.push('specialties');

  // Téléphone
  const phone = p.phone || p.phoneNumber || p.tel || p.telephone || '';
  if (!String(phone).trim()) missing.push('phone');

  // Photo
  const photo = p.photoUrl || p.avatar || p.photo || p.profilePicture || chef.avatar_url || '';
  if (!String(photo).trim()) missing.push('photo');

  return missing;
}

export async function POST(req: NextRequest) {
  // Vérification admin basique
  const adminEmail = req.headers.get('x-admin-email');
  if (adminEmail !== 'thomas@chef-talents.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true; // mode test sans envoi réel
    const onlyStatus = body?.onlyStatus as string | undefined; // filtrer par statut

    // Récupère tous les chefs depuis Supabase
    const { data: profiles, error } = await supabase
      .from('chef_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
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

    for (const chef of profiles ?? []) {
      const status = String(chef.status || '').toLowerCase();
      const email = chef.email || chef.contact_email || '';

      // Filtrer : seulement active ou pending_validation
      const eligibleStatuses = ['active', 'pending_validation', 'approved'];
      if (!eligibleStatuses.includes(status)) continue;
      if (onlyStatus && status !== onlyStatus) continue;
      if (!email) continue;

      const firstName = chef.first_name || chef.firstName || chef.full_name?.split(' ')[0] || '';
      const missingFields = detectMissingFields(chef);

      // Si profil complet → on skip
      if (missingFields.length === 0) {
        results.push({ email, name: firstName, status, missingFields: [], sent: false, skipped: true });
        continue;
      }

      if (dryRun) {
        // Mode test — on log sans envoyer
        results.push({ email, name: firstName, status, missingFields, sent: false, skipped: false });
        continue;
      }

      try {
        await sendChefReminder({ email, firstName, missingFields });
        results.push({ email, name: firstName, status, missingFields, sent: true, skipped: false });
        // Petite pause pour éviter le rate limit Resend
        await new Promise(r => setTimeout(r, 120));
      } catch (err: any) {
        results.push({ email, name: firstName, status, missingFields, sent: false, skipped: false, error: err?.message });
      }
    }

    const sent = results.filter(r => r.sent).length;
    const skipped = results.filter(r => r.skipped).length;
    const errors = results.filter(r => r.error).length;
    const toSend = results.filter(r => !r.skipped).length;

    return NextResponse.json({
      dryRun,
      total: profiles?.length ?? 0,
      eligible: results.length,
      toSend,
      sent,
      skipped,
      errors,
      results: dryRun ? results : results.map(r => ({
        email: r.email,
        name: r.name,
        missingCount: r.missingFields.length,
        sent: r.sent,
        skipped: r.skipped,
        error: r.error,
      })),
    });

  } catch (err: any) {
    console.error('remind-chefs error:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
