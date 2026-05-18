// app/api/admin/missions/[id]/chef-assignments/route.ts
//
// GET → liste l'historique des chefs assignés à une mission, triés par start_date.
// Renvoie {items, totalAmount} pour affichage UI.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const missionId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!missionId) {
    return NextResponse.json({ ok: false, error: 'Missing mission id' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: rows, error } = await supabase
    .from('mission_chef_assignments')
    .select('*')
    .eq('mission_id', missionId)
    .order('start_date', { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const items = (rows || []).map((r: any) => ({
    id: r.id,
    chefId: r.chef_id,
    chefName: r.chef_name,
    chefEmail: r.chef_email,
    startDate: r.start_date,
    endDate: r.end_date,
    daysWorked: r.days_worked,
    dailyRateEur: Number(r.daily_rate_eur),
    chefAmountEur: Number(r.chef_amount_eur),
    status: r.status as 'active' | 'replaced' | 'completed',
    replacementReason: r.replacement_reason,
    replacedByAssignmentId: r.replaced_by_assignment_id,
    createdAt: r.created_at,
  }));

  const totalAmount = items.reduce((s, i) => s + i.chefAmountEur, 0);

  return NextResponse.json({ ok: true, items, totalAmount: Math.round(totalAmount * 100) / 100 });
}
