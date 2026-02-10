'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { auth, api } from '@/services/storage';
import type { ChefUser, RequestEntity, Mission } from '@/types';
import { matchChefsForFastRequest } from '@/services/fastMatch';
import { buildWhatsappBriefForChef, openWhatsappWithText } from '@/lib/whatsappBrief';

type MatchedChef = { chef: ChefUser; score: number; badges: string[] };

/**
 * Map DB row -> RequestEntity (admin)
 * ⚠️ On remplit bien preferences + notes pour que whatsappBrief ait tout.
 */
function mapRowToRequestEntity(x: any): RequestEntity {
  const userType: RequestEntity['userType'] =
    x.client_type === 'concierge' || x.user_type === 'b2b' ? 'b2b' : 'b2c';

  const mode: RequestEntity['mode'] =
    (x.match_type ?? x.mode ?? 'concierge') === 'fast' ? 'fast' : 'concierge';

  const budgetRange =
    x.budget_range ??
    x.budgetRange ??
    (x.budget_per_person ? `${x.budget_per_person}€ / pers` : null) ??
    (x.budget_per_day ? `${x.budget_per_day}€ / jour` : null) ??
    (x.budget ? String(x.budget) : null) ??
    '';

  return {
    id: x.id,
    status: (x.status ?? 'new') as any,
    mode,
    userType,
    createdAt: x.created_at ?? x.createdAt ?? null,

    location: x.location ?? x.city ?? '—',
    guestCount: x.guest_count ?? x.guestCount ?? x.guests ?? null,
    budgetRange: budgetRange || undefined,

    dates: {
      start: x.start_date ?? x.startDate ?? null,
      end: x.end_date ?? x.endDate ?? null,
      type: x.date_mode ?? (x.end_date ? 'multi' : 'single'),
    } as any,

    missionType: x.assignment_type ?? x.assignmentType ?? '',
    serviceLevel: x.service_expectations ?? x.service_level ?? x.serviceLevel ?? '',

    preferences: {
      cuisine: x.cuisine_preferences ?? x.cuisinePreferences ?? '',
      allergies: x.dietary_restrictions ?? x.dietaryRestrictions ?? '',
      languages: x.preferred_language ?? x.preferredLanguage ?? '',
    },

    // ✅ Notes = brief/message global
    notes: x.message ?? x.notes ?? null,

    // ⚠️ On garde pour l’admin, mais on ne doit PAS l’envoyer au chef via WhatsApp.
    contact: {
      name: x.full_name ?? x.fullName ?? x.first_name ?? x.firstName ?? 'Client',
      company: x.company_name ?? x.companyName ?? '',
      email: x.email ?? '',
      phone: x.phone ?? '',
    } as any,
  } as RequestEntity;
}

export default function AdminRequestDetailPage() {
  const params = useParams();
  const id = String((params as any)?.id || '');

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<RequestEntity | null>(null);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [q, setQ] = useState('');
  const [actionChefId, setActionChefId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);

    try {
      const [rReq, rChefs, rMissions] = await Promise.all([
        fetch(`/api/admin/requests/${encodeURIComponent(id)}`, { cache: 'no-store' }),
        (auth.getAllChefs?.() ?? Promise.resolve([])) as Promise<ChefUser[]>,
        ((api as any).getAllMissions?.() ?? Promise.resolve([])) as Promise<Mission[]>,
      ]);

      setChefs(rChefs ?? []);
      setMissions(rMissions ?? []);

      if (!rReq.ok) {
        setReq(null);
        return;
      }

      const json = await rReq.json();
      const row = json?.normalized ?? json?.item ?? json; // tolérant
      setReq(mapRowToRequestEntity(row));
    } catch (e) {
      console.error('Admin request detail refresh error', e);
      setReq(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const matched: MatchedChef[] = useMemo(() => {
    if (!req) return [];

    const active = chefs.filter((c) => c.role === 'chef' && c.status === 'active');
    const m = matchChefsForFastRequest(req, active);

    const withScore = m
      .map((c) => {
        const sc = auth.computeChefScore(c);
        return { chef: c, score: sc.score, badges: sc.badges };
      })
      .sort((a, b) => b.score - a.score);

    const needle = q.trim().toLowerCase();
    if (!needle) return withScore;

    return withScore.filter((x) => {
      const name = `${x.chef.firstName || ''} ${x.chef.lastName || ''}`.toLowerCase();
      const email = (x.chef.email || '').toLowerCase();
      return name.includes(needle) || email.includes(needle);
    });
  }, [req, chefs, q]);

  const revenue = useMemo(() => {
    const amountOf = (m: any) =>
      Number(m?.priceTotal ?? m?.amount ?? m?.revenue ?? m?.total ?? m?.estimatedAmount ?? 0) || 0;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    const day = (startOfWeek.getDay() + 6) % 7; // 0=lundi
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const inRange = (iso: any, start: Date) => {
      const d = new Date(iso || 0);
      if (Number.isNaN(d.getTime())) return false;
      return d.getTime() >= start.getTime();
    };

    const daySum = missions
      .filter((m) => inRange((m as any).createdAt, startOfDay))
      .reduce((s, m) => s + amountOf(m), 0);

    const weekSum = missions
      .filter((m) => inRange((m as any).createdAt, startOfWeek))
      .reduce((s, m) => s + amountOf(m), 0);

    const monthSum = missions
      .filter((m) => inRange((m as any).createdAt, startOfMonth))
      .reduce((s, m) => s + amountOf(m), 0);

    return { daySum, weekSum, monthSum };
  }, [missions]);

  const humanMissionType = (v?: string | null) => {
    if (!v) return '—';
    if (v === 'daily') return 'Présence quotidienne';
    if (v === 'event') return 'Événement';
    if (v === 'residence') return 'Résidence';
    if (v === 'yacht') return 'Yacht';
    if (v === 'dinner') return 'Dîner';
    return v;
  };

  // ✅ Brief WhatsApp (uniquement quand req est dispo)
  const whatsappBrief = useMemo(() => {
    if (!req) return '';
    // garde-fou : buildWhatsappBriefForChef ne doit pas inclure contact client/conciergerie
    return buildWhatsappBriefForChef(req);
  }, [req]);

  const onCopyBrief = async () => {
    if (!whatsappBrief) return;
    try {
      await navigator.clipboard.writeText(whatsappBrief);
    } catch (e) {
      console.error('clipboard error', e);
    }
  };

  const onOpenWhatsapp = () => {
    if (!whatsappBrief) return;
    openWhatsappWithText(whatsappBrief);
  };

  const onSelectChef = async (chefId: string) => {
    try {
      setActionChefId(chefId);
      console.log('SELECT_CHEF_FOR_REQUEST', { requestId: id, chefId });
      // TODO: call API to create proposal/mission and update status
      await refresh();
    } finally {
      setActionChefId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-white/60">Chargement…</div>;
  }

  if (!req) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-sm text-white/60">Demande introuvable.</div>
        <Link href="/admin/requests" className="text-sm text-white/80 hover:text-white underline">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <Link href="/admin/requests" className="text-sm text-white/60 hover:text-white/90">
            ← Retour aux demandes
          </Link>

          <h1 className="text-xl font-semibold text-white mt-2">
            {req.userType === 'b2b' ? 'B2B' : 'B2C'} — {req.location || 'Lieu'}
          </h1>

          <div className="text-sm text-white/55 mt-1">
            {formatDates(req)} • {req.guestCount ?? '—'} pers • {formatBudget(req.budgetRange)}
            {req.mode === 'fast' ? ' • Fast' : ' • Standard'}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/requests?status=${encodeURIComponent(String(req.status || ''))}`}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            Voir statut ({String(req.status || '—')})
          </Link>

          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
          >
            Rafraîchir
          </button>

          <button
            onClick={onCopyBrief}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
          >
            Copier brief
          </button>

          <button
            onClick={onOpenWhatsapp}
            className="px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-100 hover:bg-emerald-500/15 transition"
          >
            WhatsApp →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Fiche demande */}
        <Panel
          title="Fiche demande"
          subtitle="Résumé client + critères"
          className="xl:col-span-1"
          right={<StatusBadge status={String(req.status || '')} />}
        >
          <div className="space-y-2 text-sm">
            {/* ⚠️ On affiche en admin, mais pas dans le brief WhatsApp */}
            <Row label="Client" value={req.contact?.company || req.contact?.name || '—'} />
            <Row label="Lieu" value={req.location || '—'} />
            <Row label="Dates" value={formatDates(req)} />
            <Row label="Pax" value={String(req.guestCount ?? '—')} />
            <Row label="Budget" value={formatBudget(req.budgetRange)} />
            <Row label="Type de mission" value={humanMissionType(req.missionType)} />
            <Row label="Service" value={String(req.serviceLevel || '—')} />
            <Row label="Cuisine" value={String(req.preferences?.cuisine || '—')} />
            <Row label="Restrictions" value={String(req.preferences?.allergies || '—')} />
            <Row label="Langues" value={String(req.preferences?.languages || '—')} />
          </div>

          {req.notes ? (
            <div className="mt-4">
              <div className="text-xs font-semibold text-white/70">Notes / Brief</div>
              <div className="text-sm text-white/80 mt-1 whitespace-pre-wrap">{req.notes}</div>
            </div>
          ) : null}
        </Panel>

        {/* Matching */}
        <div className="xl:col-span-2 space-y-4">
          <Panel
            title="Chefs matchables"
            subtitle="Actifs + tri score (moteur existant)"
            right={
              <div className="flex items-center gap-2">
                <div className="text-xs text-white/50 hidden sm:block">{matched.length} chef(s)</div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Recherche (nom/email)…"
                  className="w-[240px] max-w-full px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
            }
          >
            <div className="overflow-auto -mx-4 px-4">
              <table className="min-w-full text-sm">
                <thead className="text-white/70">
                  <tr>
                    <th className="text-left py-3">Chef</th>
                    <th className="text-left py-3">Score</th>
                    <th className="text-left py-3">Badges</th>
                    <th className="text-right py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {matched.map((x) => (
                    <tr key={x.chef.id} className="hover:bg-white/5 transition">
                      <td className="py-3 pr-4">
                        <div className="text-white font-medium leading-tight">
                          {(x.chef.firstName || '')} {(x.chef.lastName || '')}
                        </div>
                        <div className="text-xs text-white/45 mt-0.5">
                          {x.chef.email || '—'}
                          <span className="text-white/25"> • </span>
                          {x.chef.profileCompleted ? 'Profil complet' : 'Profil incomplet'}
                        </div>
                      </td>

                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className="text-white font-semibold">{x.score}</span>
                        <span className="text-white/45"> / 100</span>
                      </td>

                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          {x.badges?.length ? (
                            x.badges.map((b) => (
                              <span
                                key={b}
                                className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/10 text-white/80"
                              >
                                {b}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-white/45">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectChef(x.chef.id)}
                          disabled={actionChefId === x.chef.id}
                          className={[
                            'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition',
                            'border-white/10 bg-white/10 text-white hover:bg-white/15',
                            actionChefId === x.chef.id ? 'opacity-60 cursor-not-allowed' : '',
                          ].join(' ')}
                        >
                          Sélectionner <span aria-hidden>→</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {matched.length === 0 && (
                    <tr>
                      <td className="py-4 text-white/60" colSpan={4}>
                        Aucun chef matchable (actifs) pour cette demande.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-white/45">
              Prochaine étape : “Sélectionner” = création d’une proposal OU création d’une mission + update statut request.
            </div>
          </Panel>
        </div>
      </div>

      {/* Debug revenue (optionnel) */}
      <div className="text-xs text-white/35">
        CA jour: {Math.round(revenue.daySum)}€ • semaine: {Math.round(revenue.weekSum)}€ • mois: {Math.round(revenue.monthSum)}€
      </div>
    </div>
  );
}

/* ---------- UI ---------- */

function Panel({
  title,
  subtitle,
  right,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-white/10 rounded-2xl bg-white/5 backdrop-blur overflow-hidden ${className}`}>
      <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle ? <div className="text-xs text-white/45 mt-0.5">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-white/55">{label}</div>
      <div className="font-medium text-white text-right">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();

  const cls =
    s === 'new'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : s === 'in_review'
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : s === 'assigned'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : s === 'closed'
      ? 'bg-white/10 text-white/60 border-white/10'
      : 'bg-white/10 text-white/60 border-white/10';

  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{s || '—'}</span>;
}

/* ---------- Helpers ---------- */

function formatDates(r: RequestEntity) {
  const start = r.dates?.start ? new Date(r.dates.start).toLocaleDateString('fr-FR') : '—';
  const end = r.dates?.end ? new Date(r.dates.end).toLocaleDateString('fr-FR') : '';
  return end ? `${start} → ${end}` : start;
}

function formatBudget(b: any) {
  if (!b) return '—';
  if (typeof b === 'string') return b;
  const min = b?.min ?? b?.from;
  const max = b?.max ?? b?.to;
  if (min && max) return `${min}–${max}`;
  if (min) return `≥ ${min}`;
  if (max) return `≤ ${max}`;
  return '—';
}
