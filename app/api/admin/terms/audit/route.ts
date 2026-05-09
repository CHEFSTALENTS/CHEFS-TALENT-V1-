// app/api/admin/terms/audit/route.ts
// GET → renvoie la liste des acceptations CGU chef + stats agrégées.
// Auth : Supabase Bearer token (admin allowlist).
// Lecture-seule : aucune écriture en DB.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// La constante CURRENT_TERMS_VERSION est dupliquée ici pour éviter l'import
// d'un client component depuis un endpoint serveur. Doit être maintenue en
// cohérence avec app/chef/terms/terms-client.tsx (CURRENT_TERMS_VERSION) et
// app/api/chef/terms/accept/route.ts (default).
const CURRENT_TERMS_VERSION = '08/05/2026';

function safeProfile(v: any) {
  if (!v) return {};
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  if (typeof v === 'object') return v;
  return {};
}

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const supabase = getSupabaseAdmin();

    // Lecture : tous les chef_profiles avec leur user_id, profile et status
    const { data, error } = await supabase
      .from('chef_profiles')
      .select('user_id, profile')
      .order('user_id', { ascending: true });

    if (error) {
      console.error('[admin/terms/audit] read error', error);
      return NextResponse.json(
        { ok: false, error: 'READ_ERROR', detail: error.message },
        { status: 500 },
      );
    }

    const acceptances = (data ?? []).map((row) => {
      const p = safeProfile(row.profile);
      return {
        user_id: row.user_id as string,
        email: (p?.email as string | undefined) ?? null,
        name: ((p?.name as string | undefined) ??
          (p?.fullName as string | undefined) ??
          [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() ??
          null) || null,
        status: (p?.status as string | undefined) ?? null,
        termsAccepted: Boolean(p?.termsAccepted),
        termsAcceptedAt: (p?.termsAcceptedAt as string | undefined) ?? null,
        termsAcceptedVersion: (p?.termsAcceptedVersion as string | undefined) ?? null,
      };
    });

    const activeChefs = acceptances.filter((a) => a.status === 'active').length;
    const accepted = acceptances.filter((a) => a.termsAccepted).length;
    const acceptedCurrent = acceptances.filter(
      (a) => a.termsAccepted && a.termsAcceptedVersion === CURRENT_TERMS_VERSION,
    ).length;
    const pending = acceptances.filter(
      (a) => a.status === 'active' && a.termsAcceptedVersion !== CURRENT_TERMS_VERSION,
    ).length;

    // Tri pour l'affichage : les acceptations les plus récentes d'abord,
    // puis les profils sans acceptation à la fin.
    const sorted = acceptances.slice().sort((a, b) => {
      const ta = a.termsAcceptedAt ? Date.parse(a.termsAcceptedAt) : 0;
      const tb = b.termsAcceptedAt ? Date.parse(b.termsAcceptedAt) : 0;
      return tb - ta;
    });

    return NextResponse.json({
      ok: true,
      currentVersion: CURRENT_TERMS_VERSION,
      totals: {
        activeChefs,
        accepted,
        acceptedCurrent,
        pending,
      },
      acceptances: sorted,
    });
  } catch (e: any) {
    console.error('[admin/terms/audit] unexpected', e);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
