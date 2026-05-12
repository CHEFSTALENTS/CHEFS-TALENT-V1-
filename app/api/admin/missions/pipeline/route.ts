export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminOr401 } from '@/lib/auth/requireAdmin';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function startOfPrevMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
}

// Type allégé renvoyé au front (on n'expose pas les colonnes inutiles)
type MissionLite = {
  id: string;
  chef_name: string | null;
  chef_email: string | null;
  location: string | null;
  start_date: string | null;
  chef_amount: number | null;
  client_amount: number | null;
  commission_amount: number | null;
  paid_amount: number | null;
  payment_method: string | null;
  paid_at: string | null;
  confirmed_at: string | null;
};

const LITE_FIELDS =
  'id, chef_name, chef_email, location, start_date, chef_amount, client_amount, commission_amount, paid_amount, payment_method, paid_at, confirmed_at';

// =============================================================
// GET /api/admin/missions/pipeline
//
// Retourne tout ce qu'il faut pour le bloc « Missions » du dashboard
// admin (option A) :
//
//   confirmedMonth   : missions confirmées ce mois (count + montants)
//   paidMonth        : missions payées ce mois (count + montants)
//   paidPrevMonth    : idem mois précédent (pour le delta MoM)
//   pendingPayment   : missions confirmées toutes périodes en attente de
//                      paiement (count + total à encaisser chef)
//   latestPaid       : 5 dernières missions payées (paid_at desc)
//   upcomingToCollect: 5 prochaines à encaisser (confirmed + pending,
//                      start_date asc à venir)
//
// La fonction tolère l'absence de colonne payment_status (rétrocompat
// si migration pas appliquée) en retournant des 0.
// =============================================================
export async function GET(req: Request) {
  try {
    const auth = await requireAdminOr401(req);
    if (auth instanceof NextResponse) return auth;

    const supabase = supabaseAdmin();

    const monthStartIso = startOfMonth().toISOString();
    const prevMonthStartIso = startOfPrevMonth().toISOString();
    const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // ---------- 1) Missions confirmées ce mois ----------
    // confirmed_at >= startOfMonth, statut 'confirmed' (peut aussi avoir
    // payment_status='paid' = pas grave, on compte confirmation pas paiement)
    const confirmedMonthQ = await supabase
      .from('missions')
      .select('chef_amount, commission_amount, confirmed_at, status')
      .gte('confirmed_at', monthStartIso)
      .eq('status', 'confirmed')
      .limit(2000);

    let confirmedMonth = { count: 0, chefTotal: 0, commission: 0 };
    if (!confirmedMonthQ.error) {
      for (const row of confirmedMonthQ.data ?? []) {
        confirmedMonth.count++;
        confirmedMonth.chefTotal += Number(row.chef_amount || 0);
        confirmedMonth.commission += Number(row.commission_amount || 0);
      }
    }

    // ---------- 2) Missions payées ce mois ----------
    let paidMonth = {
      count: 0,
      chefTotal: 0,
      commission: 0,
      missingColumn: false,
    };
    const paidMonthQ = await supabase
      .from('missions')
      .select(
        'paid_amount, commission_amount, paid_at, payment_status, chef_amount',
      )
      .gte('paid_at', monthStartIso)
      .eq('payment_status', 'paid')
      .limit(2000);

    if (paidMonthQ.error) {
      const msg = String(paidMonthQ.error.message || '').toLowerCase();
      if (msg.includes('column') && msg.includes('does not exist')) {
        paidMonth.missingColumn = true;
      } else {
        console.error('[pipeline] paidMonth error', paidMonthQ.error.message);
      }
    } else {
      for (const row of paidMonthQ.data ?? []) {
        paidMonth.count++;
        paidMonth.chefTotal += Number(
          row.paid_amount || row.chef_amount || 0,
        );
        paidMonth.commission += Number(row.commission_amount || 0);
      }
    }

    // ---------- 3) Missions payées mois précédent (pour comparaison) ----------
    let paidPrevMonth = { count: 0, chefTotal: 0, commission: 0 };
    if (!paidMonth.missingColumn) {
      const paidPrevQ = await supabase
        .from('missions')
        .select(
          'paid_amount, commission_amount, paid_at, payment_status, chef_amount',
        )
        .gte('paid_at', prevMonthStartIso)
        .lt('paid_at', monthStartIso)
        .eq('payment_status', 'paid')
        .limit(2000);

      if (!paidPrevQ.error) {
        for (const row of paidPrevQ.data ?? []) {
          paidPrevMonth.count++;
          paidPrevMonth.chefTotal += Number(
            row.paid_amount || row.chef_amount || 0,
          );
          paidPrevMonth.commission += Number(row.commission_amount || 0);
        }
      }
    }

    // ---------- 4) Missions en attente paiement (toutes périodes) ----------
    // confirmed + payment_status pending : à encaisser
    let pendingPayment = { count: 0, chefTotal: 0, commission: 0 };
    if (!paidMonth.missingColumn) {
      const pendingQ = await supabase
        .from('missions')
        .select('chef_amount, commission_amount, payment_status, status')
        .eq('status', 'confirmed')
        .eq('payment_status', 'pending')
        .limit(2000);

      if (!pendingQ.error) {
        for (const row of pendingQ.data ?? []) {
          pendingPayment.count++;
          pendingPayment.chefTotal += Number(row.chef_amount || 0);
          pendingPayment.commission += Number(row.commission_amount || 0);
        }
      }
    } else {
      // Fallback si payment_status n'existe pas : compter toutes les
      // missions confirmées qui n'ont pas de paid_at
      const fallbackQ = await supabase
        .from('missions')
        .select('chef_amount, commission_amount, status')
        .eq('status', 'confirmed')
        .limit(2000);
      if (!fallbackQ.error) {
        for (const row of fallbackQ.data ?? []) {
          pendingPayment.count++;
          pendingPayment.chefTotal += Number(row.chef_amount || 0);
          pendingPayment.commission += Number(row.commission_amount || 0);
        }
      }
    }

    // ---------- 5) Listes : 5 dernières payées + 5 prochaines à encaisser ----------
    let latestPaid: MissionLite[] = [];
    let upcomingToCollect: MissionLite[] = [];

    if (!paidMonth.missingColumn) {
      const latestPaidQ = await supabase
        .from('missions')
        .select(LITE_FIELDS)
        .eq('payment_status', 'paid')
        .order('paid_at', { ascending: false, nullsFirst: false })
        .limit(5);
      if (!latestPaidQ.error) {
        latestPaid = (latestPaidQ.data || []) as MissionLite[];
      }

      // Prochaines à encaisser : missions confirmées en attente paiement,
      // priorité aux start_date à venir d'abord, puis par confirmed_at desc
      const upcomingQ = await supabase
        .from('missions')
        .select(LITE_FIELDS)
        .eq('status', 'confirmed')
        .eq('payment_status', 'pending')
        .order('start_date', { ascending: true, nullsFirst: false })
        .limit(5);
      if (!upcomingQ.error) {
        upcomingToCollect = (upcomingQ.data || []) as MissionLite[];
      }
    }

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      missingPaymentColumn: paidMonth.missingColumn,
      confirmedMonth: {
        count: confirmedMonth.count,
        chefTotalEur: round2(confirmedMonth.chefTotal),
        commissionEur: round2(confirmedMonth.commission),
      },
      paidMonth: {
        count: paidMonth.count,
        chefTotalEur: round2(paidMonth.chefTotal),
        commissionEur: round2(paidMonth.commission),
      },
      paidPrevMonth: {
        count: paidPrevMonth.count,
        chefTotalEur: round2(paidPrevMonth.chefTotal),
        commissionEur: round2(paidPrevMonth.commission),
      },
      pendingPayment: {
        count: pendingPayment.count,
        chefTotalEur: round2(pendingPayment.chefTotal),
        commissionEur: round2(pendingPayment.commission),
      },
      latestPaid,
      upcomingToCollect,
    });
  } catch (e: any) {
    console.error('[admin/missions/pipeline] fatal', e?.message);
    return NextResponse.json(
      { error: e?.message || 'Server error' },
      { status: 500 },
    );
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
