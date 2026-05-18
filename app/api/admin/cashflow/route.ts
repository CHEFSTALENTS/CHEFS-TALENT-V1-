// app/api/admin/cashflow/route.ts
//
// GET /api/admin/cashflow
//   Agrège toutes les échéances mission_payments (status='pending') pour le
//   widget cashflow du dashboard /admin.
//
//   Retourne :
//     - upcoming30 : { count, totalEur } — échéances à venir dans 30 jours
//     - upcoming60 : idem pour 60 jours
//     - totalRemaining : tout ce qui est pending (peu importe la date)
//     - overdue : { count, totalEur, items } — échéances dépassées non payées
//                                              (avec détails pour la liste « à relancer »)
//     - upcomingNext10 : 10 prochaines échéances pending triées par due_date

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

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const supabase = supabaseAdmin();

  // On charge TOUS les pending. Volume modeste prévu (1-5 leads/jour → max ~150
  // missions actives), donc pas besoin de pagination ni d'agrégation SQL.
  const { data: rows, error } = await supabase
    .from('mission_payments')
    .select(`
      id, mission_id, amount_eur, due_date, label, status, last_reminded_at, reminder_count,
      missions:mission_id ( id, location, chef_name, request_id, status )
    `)
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in30 = addDays(now, 30);
  const in60 = addDays(now, 60);

  const upcoming30 = { count: 0, totalEur: 0 };
  const upcoming60 = { count: 0, totalEur: 0 };
  let totalRemaining = 0;
  const overdueItems: any[] = [];
  const upcomingItems: any[] = [];

  for (const r of (rows || []) as any[]) {
    const amt = Number(r.amount_eur);
    const mission = (r.missions || {}) as any;
    const item = {
      id: r.id,
      missionId: r.mission_id,
      amountEur: amt,
      dueDate: r.due_date,
      label: r.label,
      lastRemindedAt: r.last_reminded_at,
      reminderCount: r.reminder_count || 0,
      mission: mission
        ? {
            id: mission.id,
            location: mission.location,
            chefName: mission.chef_name,
            requestId: mission.request_id,
            status: mission.status,
          }
        : null,
    };

    totalRemaining += amt;

    if (r.due_date < today) {
      const daysOverdue = Math.ceil((Date.parse(today) - Date.parse(r.due_date)) / 86400_000);
      overdueItems.push({ ...item, daysOverdue });
    } else {
      if (r.due_date <= in30) {
        upcoming30.count += 1;
        upcoming30.totalEur += amt;
      }
      if (r.due_date <= in60) {
        upcoming60.count += 1;
        upcoming60.totalEur += amt;
      }
      upcomingItems.push(item);
    }
  }

  return NextResponse.json({
    ok: true,
    asOf: now.toISOString(),
    upcoming30,
    upcoming60,
    totalRemaining: Math.round(totalRemaining * 100) / 100,
    overdue: {
      count: overdueItems.length,
      totalEur: Math.round(overdueItems.reduce((s, i) => s + i.amountEur, 0) * 100) / 100,
      items: overdueItems,
    },
    upcomingNext10: upcomingItems.slice(0, 10),
  });
}
