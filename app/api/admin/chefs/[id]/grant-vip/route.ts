import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  CHEF_PLANS,
  computePlanEndsAt,
  type PlanKey,
} from '@/lib/chef-plans';
import { sendVipWelcome } from '@/lib/email/sendVipWelcome';
import { sendInternalUpsellNotification } from '@/lib/email/sendInternalUpsellNotification';

export const runtime = 'nodejs';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

function isAdminRequest(req: Request) {
  const email = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  return email === ADMIN_EMAIL.toLowerCase();
}

const MONTHS_TO_PLANKEY: Record<number, PlanKey> = {
  3: 'vip_3m',
  6: 'vip_6m',
  12: 'vip_12m',
};

async function patchProfile(userId: string, patch: Record<string, any>) {
  const admin = getSupabaseAdmin();

  // Le profile est stocké soit indexé par profile->>id (legacy) soit par user_id.
  // On essaye d'abord avec user_id (pattern majoritaire actuel).
  let { data: existing } = await admin
    .from('chef_profiles')
    .select('user_id, profile')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    // Fallback : lookup via profile->>id
    const { data: byProfileId } = await admin
      .from('chef_profiles')
      .select('user_id, profile')
      .eq('profile->>id', userId)
      .maybeSingle();
    if (byProfileId) existing = byProfileId;
  }

  const targetUserId = existing?.user_id || userId;
  const current =
    (existing?.profile && typeof existing.profile === 'object'
      ? existing.profile
      : {}) ?? {};

  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await admin
    .from('chef_profiles')
    .upsert({ user_id: targetUserId, profile: next }, { onConflict: 'user_id' });

  if (error) throw error;
  return next;
}

/**
 * POST /api/admin/chefs/[id]/grant-vip
 * Body: { months: 3 | 6 | 12 }
 * Auth: x-admin-email
 *
 * Active gratuitement un statut VIP "Offert par Chefs Talents" pour ce chef.
 * - plan = 'pro', planStatus = 'active', planKey = vip_Xm
 * - planEndsAt = now + months × 30 jours
 * - complimentary = true (différencie d'un VIP payant)
 * Aucun appel Stripe (pas de subscription créée).
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const months = Number(body?.months);

    if (!MONTHS_TO_PLANKEY[months]) {
      return NextResponse.json(
        { error: 'INVALID_MONTHS', detail: 'months must be 3, 6 or 12' },
        { status: 400 },
      );
    }

    const planKey = MONTHS_TO_PLANKEY[months];
    const planEndsAt = computePlanEndsAt(CHEF_PLANS[planKey].months);

    const next = await patchProfile(params.id, {
      plan: 'pro',
      planStatus: 'active',
      planKey,
      paymentMode: 'complimentary',
      planEndsAt,
      complimentary: true,
      complimentaryGrantedAt: new Date().toISOString(),
    });

    // Notifications (fire & forget)
    try {
      const email = (next.email || '').trim();
      const chefName =
        `${next.firstName ?? ''} ${next.lastName ?? ''}`.trim() ||
        next.name ||
        email ||
        'Chef';

      if (email) {
        await sendVipWelcome({
          email,
          firstName: next.firstName,
          planKey,
          isComplimentary: true,
          locale: next.preferredLocale,
        });
      }
      await sendInternalUpsellNotification({
        kind: 'vip_complimentary',
        chefId: params.id,
        chefName,
        chefEmail: email,
        planLabel: `${CHEF_PLANS[planKey].label} (offert)`,
        amountCents: 0,
      });
    } catch (e: any) {
      console.error('[grant-vip] notifications failed', e?.message);
    }

    return NextResponse.json({
      ok: true,
      plan: next.plan,
      planKey: next.planKey,
      planEndsAt: next.planEndsAt,
      complimentary: next.complimentary,
    });
  } catch (e: any) {
    console.error('[grant-vip] POST error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/chefs/[id]/grant-vip
 * Auth: x-admin-email
 *
 * Révoque le VIP offert. Ne touche pas aux abonnements payants Stripe.
 * Refuse de révoquer un VIP payant (utiliser le Billing Portal pour ça).
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    // Lecture pour vérifier que c'est bien un complimentary
    const admin = getSupabaseAdmin();
    let { data: existing } = await admin
      .from('chef_profiles')
      .select('user_id, profile')
      .eq('user_id', params.id)
      .maybeSingle();
    if (!existing) {
      const { data: byProfileId } = await admin
        .from('chef_profiles')
        .select('user_id, profile')
        .eq('profile->>id', params.id)
        .maybeSingle();
      if (byProfileId) existing = byProfileId;
    }

    const profile = (existing?.profile as any) ?? {};

    if (profile.plan === 'pro' && !profile.complimentary) {
      return NextResponse.json(
        {
          error: 'PAID_SUBSCRIPTION',
          detail:
            'Ce chef a un abonnement VIP payant. Utilisez le Stripe Billing Portal pour annuler.',
        },
        { status: 409 },
      );
    }

    const next = await patchProfile(params.id, {
      plan: 'free',
      planStatus: 'cancelled',
      complimentary: false,
      planEndsAt: new Date().toISOString(),
      complimentaryRevokedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      plan: next.plan,
      complimentary: next.complimentary,
    });
  } catch (e: any) {
    console.error('[grant-vip] DELETE error', e);
    return NextResponse.json(
      { error: 'SERVER_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
