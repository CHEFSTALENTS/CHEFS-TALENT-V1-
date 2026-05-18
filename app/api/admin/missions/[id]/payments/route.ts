// app/api/admin/missions/[id]/payments/route.ts
//
// GET  /api/admin/missions/[id]/payments
//   → liste les échéances d'une mission, triées par due_date ASC
//   → calcule isOverdue côté serveur (status='pending' + due_date < today)
//
// POST /api/admin/missions/[id]/payments
//   → crée une nouvelle échéance
//   body : { amount_eur, due_date, label?, notes? }

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
    .from('mission_payments')
    .select('*')
    .eq('mission_id', missionId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const today = todayISO();
  const items = (rows || []).map((r: any) => {
    const isOverdue = r.status === 'pending' && r.due_date < today;
    const daysOverdue = isOverdue
      ? Math.ceil((Date.parse(today) - Date.parse(r.due_date)) / 86400_000)
      : 0;
    return {
      id: r.id,
      missionId: r.mission_id,
      amountEur: Number(r.amount_eur),
      dueDate: r.due_date,
      label: r.label,
      status: r.status as 'pending' | 'paid' | 'cancelled',
      isOverdue,
      daysOverdue,
      paidAt: r.paid_at,
      paidAmountEur: r.paid_amount_eur != null ? Number(r.paid_amount_eur) : null,
      paymentMethod: r.payment_method,
      paymentReference: r.payment_reference,
      lastRemindedAt: r.last_reminded_at,
      reminderCount: r.reminder_count || 0,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  // Agrégations utiles côté UI : total dû / payé / restant / en retard
  const totals = items.reduce(
    (acc, p) => {
      if (p.status === 'cancelled') return acc;
      acc.totalDue += p.amountEur;
      if (p.status === 'paid') {
        acc.totalPaid += (p.paidAmountEur ?? p.amountEur);
      } else {
        acc.totalRemaining += p.amountEur;
        if (p.isOverdue) {
          acc.totalOverdue += p.amountEur;
          acc.overdueCount += 1;
        }
      }
      return acc;
    },
    { totalDue: 0, totalPaid: 0, totalRemaining: 0, totalOverdue: 0, overdueCount: 0 },
  );

  return NextResponse.json({ ok: true, items, totals });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOr401(req);
  if (auth instanceof NextResponse) return auth;

  const missionId = decodeURIComponent((await ctx.params).id || '').trim();
  if (!missionId) {
    return NextResponse.json({ ok: false, error: 'Missing mission id' }, { status: 400 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* empty OK */ }

  const amountEur = Number(body.amountEur ?? body.amount_eur);
  const dueDate = String(body.dueDate ?? body.due_date ?? '').trim();
  const label = String(body.label ?? '').trim() || null;
  const notes = String(body.notes ?? '').trim() || null;

  if (!Number.isFinite(amountEur) || amountEur <= 0) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_AMOUNT', message: 'Montant invalide (> 0 requis).' },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_DATE', message: 'Date d\'échéance invalide (format YYYY-MM-DD).' },
      { status: 400 },
    );
  }

  const supabase = supabaseAdmin();

  // Vérifie que la mission existe
  const { data: mission } = await supabase
    .from('missions')
    .select('id')
    .eq('id', missionId)
    .maybeSingle();
  if (!mission) {
    return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 });
  }

  const { data: row, error } = await supabase
    .from('mission_payments')
    .insert({
      mission_id: missionId,
      amount_eur: amountEur,
      due_date: dueDate,
      label,
      notes,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.error('[admin/missions/[id]/payments POST] insert error', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, payment: row });
}
