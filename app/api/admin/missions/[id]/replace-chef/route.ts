// app/api/admin/missions/[id]/replace-chef/route.ts
//
// POST : remplace le chef en cours de mission avec calcul auto du split
// tarifaire au prorata des jours travaillés.
//
// Body : {
//   newChefId: string,                    // user_id du nouveau chef
//   newChefName: string,
//   newChefEmail: string,
//   replacementDate: string,              // YYYY-MM-DD = dernier jour travaillé
//                                            par l'ANCIEN chef (le nouveau prend
//                                            à partir de J+1)
//   reason?: string
// }
//
// Comportement :
//   1. Charge la mission (chef_amount, start_date, end_date)
//   2. Calcule :
//      - total_days = end_date - start_date + 1
//      - daily_rate = chef_amount / total_days
//      - old_chef_days = replacementDate - start_date + 1 (jours déjà faits)
//      - new_chef_days = end_date - replacementDate (jours restants)
//      - old_chef_amount = old_chef_days × daily_rate
//      - new_chef_amount = new_chef_days × daily_rate
//   3. Crée 2 rows mission_chef_assignments (ancien='replaced', nouveau='active')
//   4. Lien : ancien.replaced_by_assignment_id = nouveau.id
//   5. Update mission : chef_id/name/email = nouveau chef
//   6. Renvoie le split calculé pour info UI

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

function daysBetween(start: string, end: string): number {
  // Inclusif : start=2026-05-01, end=2026-05-03 → 3 jours
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  return Math.round((e - s) / 86400_000) + 1;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

  const newChefId = String(body.newChefId || '').trim();
  const newChefName = String(body.newChefName || '').trim();
  const newChefEmail = String(body.newChefEmail || '').trim().toLowerCase();
  const replacementDate = String(body.replacementDate || '').trim();
  const reason = String(body.reason || '').trim() || null;

  // ── Validations
  if (!newChefId || !newChefName || !newChefEmail) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_INPUT', message: 'Nouveau chef incomplet (id + name + email requis).' },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(replacementDate)) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_DATE', message: 'Date remplacement invalide (YYYY-MM-DD).' },
      { status: 400 },
    );
  }

  const supabase = supabaseAdmin();

  // Charge la mission
  const { data: mission, error: mErr } = await supabase
    .from('missions')
    .select('id, chef_id, chef_name, chef_email, chef_amount, start_date, end_date, status')
    .eq('id', missionId)
    .maybeSingle();

  if (mErr || !mission) {
    return NextResponse.json({ ok: false, error: 'Mission not found' }, { status: 404 });
  }

  if (!mission.chef_id || !mission.chef_name) {
    return NextResponse.json(
      { ok: false, error: 'NO_CURRENT_CHEF', message: 'La mission n\'a pas de chef actuel à remplacer.' },
      { status: 400 },
    );
  }
  if (!mission.start_date || !mission.end_date) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_DATES', message: 'La mission doit avoir une période start_date/end_date pour calculer le prorata.' },
      { status: 400 },
    );
  }
  if (mission.chef_amount == null || Number(mission.chef_amount) <= 0) {
    return NextResponse.json(
      { ok: false, error: 'NO_AMOUNT', message: 'La mission doit avoir un chef_amount > 0 pour calculer le split.' },
      { status: 400 },
    );
  }

  // ── Validations dates
  // Cas spécial "pré-démarrage" : si replacementDate < start_date, on
  // traite ça comme un swap pur (chef A n'a rien fait → 0€, chef B
  // prend la totalité). Sinon, prorata classique entre start_date et
  // end_date strict.
  const isPreStart = replacementDate < mission.start_date;
  if (replacementDate >= mission.end_date) {
    return NextResponse.json(
      { ok: false, error: 'DATE_AFTER_END', message: `La date de remplacement doit être < date de fin (${mission.end_date}).` },
      { status: 400 },
    );
  }
  if (newChefId === mission.chef_id) {
    return NextResponse.json(
      { ok: false, error: 'SAME_CHEF', message: 'Le nouveau chef est identique au chef actuel.' },
      { status: 400 },
    );
  }

  // ── Calcul prorata
  const chefAmount = Number(mission.chef_amount);
  const totalDays = daysBetween(mission.start_date, mission.end_date);
  const dailyRate = Math.round((chefAmount / totalDays) * 100) / 100;

  // Pré-démarrage : ancien chef = 0 jours, nouveau = totalité, start = mission.start_date.
  // En cours : prorata sur la date de remplacement saisie.
  const oldChefDays = isPreStart ? 0 : daysBetween(mission.start_date, replacementDate);
  const oldChefEndDate = isPreStart ? mission.start_date : replacementDate;
  const newChefStart = isPreStart ? mission.start_date : addDays(replacementDate, 1);
  const newChefDays = isPreStart ? totalDays : daysBetween(newChefStart, mission.end_date);

  const oldChefAmount = Math.round(oldChefDays * dailyRate * 100) / 100;
  // Évite les pertes de centimes : le solde est attribué au nouveau chef
  const newChefAmount = Math.round((chefAmount - oldChefAmount) * 100) / 100;

  // ── Création des 2 assignments en cascade
  // 1. Crée le nouvel assignment d'abord (status='active') pour avoir son ID
  const { data: newAssignment, error: e1 } = await supabase
    .from('mission_chef_assignments')
    .insert({
      mission_id: missionId,
      chef_id: newChefId,
      chef_name: newChefName,
      chef_email: newChefEmail,
      start_date: newChefStart,
      end_date: mission.end_date,
      days_worked: newChefDays,
      daily_rate_eur: dailyRate,
      chef_amount_eur: newChefAmount,
      status: 'active',
    })
    .select('id')
    .single();

  if (e1 || !newAssignment) {
    console.error('[replace-chef] insert new assignment error', e1?.message);
    return NextResponse.json({ ok: false, error: e1?.message || 'Insert failed' }, { status: 500 });
  }

  // 2. Crée l'assignment de l'ancien chef (status='replaced', lié au nouveau)
  const { data: oldAssignment, error: e2 } = await supabase
    .from('mission_chef_assignments')
    .insert({
      mission_id: missionId,
      chef_id: mission.chef_id,
      chef_name: mission.chef_name,
      chef_email: mission.chef_email,
      start_date: mission.start_date,
      end_date: oldChefEndDate,
      days_worked: oldChefDays,
      daily_rate_eur: dailyRate,
      chef_amount_eur: oldChefAmount,
      status: 'replaced',
      replacement_reason: reason,
      replaced_by_assignment_id: newAssignment.id,
    })
    .select('id')
    .single();

  if (e2) {
    console.error('[replace-chef] insert old assignment error', e2.message);
    // Best-effort cleanup
    await supabase.from('mission_chef_assignments').delete().eq('id', newAssignment.id);
    return NextResponse.json({ ok: false, error: e2.message }, { status: 500 });
  }

  // 3. Update la mission avec le nouveau chef principal
  const { error: e3 } = await supabase
    .from('missions')
    .update({
      chef_id: newChefId,
      chef_name: newChefName,
      chef_email: newChefEmail,
      updated_at: new Date().toISOString(),
    })
    .eq('id', missionId);

  if (e3) {
    console.error('[replace-chef] update mission error', e3.message);
    return NextResponse.json({ ok: false, error: e3.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    split: {
      totalDays,
      dailyRate,
      oldChef: {
        name: mission.chef_name,
        email: mission.chef_email,
        period: { start: mission.start_date, end: replacementDate },
        days: oldChefDays,
        amountEur: oldChefAmount,
        assignmentId: oldAssignment?.id,
      },
      newChef: {
        name: newChefName,
        email: newChefEmail,
        period: { start: newChefStart, end: mission.end_date },
        days: newChefDays,
        amountEur: newChefAmount,
        assignmentId: newAssignment.id,
      },
      totalAmount: chefAmount,
    },
  });
}
