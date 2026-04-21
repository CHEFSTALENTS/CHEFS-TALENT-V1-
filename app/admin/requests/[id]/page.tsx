'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/storage';
import type { ChefUser, RequestEntity, Mission } from '@/types';
import { matchChefsForRequestV2, chefIsEligibleForRequest } from '@/services/matching';
import { buildWhatsappBriefForChef, buildInternalBrief, openWhatsappWithText, calcTarif } from '@/lib/whatsappBrief';

type MatchedChef = import('@/services/matching').MatchedChefV2;

function mapRowToRequestEntity(x: any): RequestEntity {
  const userType: RequestEntity['userType'] =
    x.client_type === 'concierge' || x.user_type === 'b2b' ? 'b2b' : 'b2c';
  const mode: RequestEntity['mode'] = 'concierge';

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
    location:
      typeof x.location === 'string'
        ? x.location
        : x.location?.destination ?? x.location?.city ?? x.city ?? x.destination ?? '—',
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
    notes: x.message ?? x.notes ?? null,
    contact: {
      name: x.full_name ?? x.fullName ?? x.first_name ?? x.firstName ?? 'Client',
      company: x.company_name ?? x.companyName ?? '',
      email: x.email ?? '',
      phone: x.phone ?? '',
    } as any,
  } as RequestEntity;
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT TARIF + BRIEFS
// ─────────────────────────────────────────────────────────────
function BriefSection({ req }: { req: RequestEntity }) {
  const [copiedChef, setCopiedChef] = useState(false);
  const [copiedInternal, setCopiedInternal] = useState(false);
  const [showInternal, setShowInternal] = useState(false);
  const [showChefBrief, setShowChefBrief] = useState(false);

  const tarif = useMemo(() => calcTarif(req), [req]);
  const chefBrief = useMemo(() => buildWhatsappBriefForChef(req), [req]);
  const internalBrief = useMemo(() => buildInternalBrief(req), [req]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  const copyChef = async () => {
    await navigator.clipboard.writeText(chefBrief).catch(() => {});
    setCopiedChef(true);
    setTimeout(() => setCopiedChef(false), 2000);
  };

  const copyInternal = async () => {
    await navigator.clipboard.writeText(internalBrief).catch(() => {});
    setCopiedInternal(true);
    setTimeout(() => setCopiedInternal(false), 2000);
  };

  return (
    <div className="mt-4 space-y-3">

      {/* ── DÉCOMPOSITION TARIFAIRE ── */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
        <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
          Décomposition tarifaire
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
            <div className="text-white/40 mb-1">Profil</div>
            <div className="text-white font-semibold">{tarif.levelLabel}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
            <div className="text-white/40 mb-1">Service</div>
            <div className="text-white font-semibold">{tarif.hoursPerDay}h/jour</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
            <div className="text-white/40 mb-1">Durée</div>
            <div className="text-white font-semibold">{tarif.days}j</div>
          </div>
        </div>

        {/* Tableau financier */}
        <div className="border border-white/10 rounded-xl overflow-hidden text-xs">
          <div className="flex justify-between px-3 py-2.5 bg-emerald-500/5 border-b border-white/10">
            <span className="text-white/55">TJ chef net / jour</span>
            <span className="text-emerald-300 font-semibold">
              {fmt(tarif.chefTJMin)} — {fmt(tarif.chefTJMax)}
            </span>
          </div>
          <div className="flex justify-between px-3 py-2.5 bg-emerald-500/5 border-b border-white/10">
            <span className="text-white/55">Total chef net ({tarif.days}j)</span>
            <span className="text-emerald-300 font-bold">
              {fmt(tarif.chefTotalMin)} — {fmt(tarif.chefTotalMax)}
            </span>
          </div>
          <div className="flex justify-between px-3 py-2.5 border-b border-white/10">
            <span className="text-white/55">Frais CT ({tarif.ctFeePct}%)</span>
            <span className="text-amber-300 font-semibold">
              + {fmt(tarif.ctFeesMin)} — {fmt(tarif.ctFeesMax)}
            </span>
          </div>
          <div className="flex justify-between px-3 py-2.5 bg-white/10">
            <span className="text-white font-semibold">TOTAL CLIENT</span>
            <span className="text-white font-bold">
              {fmt(tarif.clientTotalMin)} — {fmt(tarif.clientTotalMax)}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-white/30 text-center">
          Hors matières premières · Base {tarif.hoursPerDay}h/12h ref · Ratio {Math.round(tarif.dayRatio * 100)}%
        </div>
      </div>

      {/* ── BRIEF CHEF — TJ net uniquement, jamais frais CT ── */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">
              Brief chef
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">
              TJ net uniquement — frais CT non visibles
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowChefBrief(v => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition"
            >
              {showChefBrief ? 'Masquer' : 'Aperçu'}
            </button>
            <button
              onClick={copyChef}
              className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 transition"
            >
              {copiedChef ? '✓ Copié' : 'Copier'}
            </button>
            <button
              onClick={() => openWhatsappWithText(chefBrief)}
              className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 transition"
            >
              WhatsApp →
            </button>
          </div>
        </div>
        {showChefBrief && (
          <pre className="text-xs text-white/65 whitespace-pre-wrap font-mono leading-relaxed max-h-72 overflow-y-auto bg-black/20 rounded-xl p-3 mt-2">
            {chefBrief}
          </pre>
        )}
      </div>

      {/* ── BRIEF INTERNE — décomposition complète ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">
              Brief interne
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">
              Usage admin uniquement — contient les frais CT
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInternal(v => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition"
            >
              {showInternal ? 'Masquer' : 'Afficher'}
            </button>
            <button
              onClick={copyInternal}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition"
            >
              {copiedInternal ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
        {showInternal && (
          <pre className="text-xs text-white/55 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto bg-black/20 rounded-xl p-3 mt-2">
            {internalBrief}
          </pre>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id || '');

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<RequestEntity | null>(null);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [q, setQ] = useState('');
  const [actionChefId, setActionChefId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const onViewChefProfile = (chef: ChefUser) => {
    const profileId = (chef as any)?.profile?.id || chef.id;
    router.push(`/admin/chefs/${profileId}`);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const [rReq, rChefsJson, rMissions] = await Promise.all([
        fetch(`/api/admin/requests/${encodeURIComponent(id)}`, { cache: 'no-store' }),
        fetch(`/api/admin/chefs`, {
          cache: 'no-store',
          headers: { 'x-admin-email': 'thomas@chef-talents.com' },
        }).then(async (r) => {
          const j = await r.json().catch(() => ({}));
          if (!r.ok) { console.error('ADMIN CHEFS API ERROR', r.status, j); return { chefs: [] }; }
          return j;
        }),
        ((api as any).getAllMissions?.() ?? Promise.resolve([])) as Promise<Mission[]>,
      ]);

      setChefs(Array.isArray(rChefsJson?.chefs) ? rChefsJson.chefs : []);
      setMissions(rMissions ?? []);

      if (!rReq.ok) { setReq(null); return; }
      const json = await rReq.json();
      const row = json?.normalized ?? json?.item ?? json;
      setReq(mapRowToRequestEntity(row));
    } catch (e) {
      console.error('Admin request detail refresh error', e);
      setReq(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) refresh(); }, [id]);

  const matchedAll: MatchedChef[] = useMemo(() => {
    if (!req) return [];
    const activeChefs = chefs.filter((c) => {
      const status = String(c.status || (c as any)?.profile?.status || '').toLowerCase();
      return status === 'active';
    });
    const eligibleChefs = activeChefs.filter((c) => chefIsEligibleForRequest(req, c));
    return matchChefsForRequestV2(req, eligibleChefs);
  }, [req, chefs]);

  const matched: MatchedChef[] = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = !needle
      ? matchedAll
      : matchedAll.filter((x) => {
          const name = `${x.chef.firstName || ''} ${x.chef.lastName || ''}`.toLowerCase();
          const email = (x.chef.email || '').toLowerCase();
          return name.includes(needle) || email.includes(needle);
        });
    return showAll ? filtered : filtered.slice(0, 15);
  }, [matchedAll, q, showAll]);

  const revenue = useMemo(() => {
    const amountOf = (m: any) =>
      Number(m?.priceTotal ?? m?.amount ?? m?.revenue ?? m?.total ?? m?.estimatedAmount ?? 0) || 0;
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const inRange = (iso: any, start: Date) => {
      const d = new Date(iso || 0);
      return !Number.isNaN(d.getTime()) && d.getTime() >= start.getTime();
    };
    return {
      daySum: missions.filter((m) => inRange((m as any).createdAt, startOfDay)).reduce((s, m) => s + amountOf(m), 0),
      weekSum: missions.filter((m) => inRange((m as any).createdAt, startOfWeek)).reduce((s, m) => s + amountOf(m), 0),
      monthSum: missions.filter((m) => inRange((m as any).createdAt, startOfMonth)).reduce((s, m) => s + amountOf(m), 0),
    };
  }, [missions]);

  const humanMissionType = (v?: string | null) => {
    const map: Record<string, string> = {
      daily: 'Présence quotidienne', event: 'Événement',
      residence: 'Résidence', yacht: 'Yacht', dinner: 'Dîner',
    };
    return v ? (map[v] ?? v) : '—';
  };

  const onSelectChef = async (chef: ChefUser) => {
    try {
      const profileId = (chef as any)?.profile?.id || chef.id;
      setActionChefId(profileId);
      router.push(`/admin/chefs/${profileId}?requestId=${id}`);
    } finally {
      setActionChefId(null);
    }
  };

  if (loading) return <div className="p-6 text-sm text-white/60">Chargement…</div>;

  if (!req) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-sm text-white/60">Demande introuvable.</div>
        <Link href="/admin/requests" className="text-sm text-white/80 hover:text-white underline">← Retour</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">

      {/* HEADER */}
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
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/requests?status=${encodeURIComponent(String(req.status || ''))}`}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            Statut : {String(req.status || '—')}
          </Link>
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
          >
            Rafraîchir
          </button>
          {/* Bouton copie rapide brief chef depuis le header */}
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(buildWhatsappBriefForChef(req)).catch(() => {});
            }}
            className="px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-100 hover:bg-emerald-500/15 transition"
          >
            📋 Brief chef
          </button>
          <button
            onClick={() => openWhatsappWithText(buildWhatsappBriefForChef(req))}
            className="px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/15 text-sm text-emerald-100 hover:bg-emerald-500/20 transition"
          >
            WhatsApp →
          </button>
        </div>
      </div>

      {/* GRILLE PRINCIPALE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* COLONNE GAUCHE — Fiche + Tarifs + Briefs */}
        <Panel
          title="Fiche demande"
          subtitle="Résumé client + décomposition tarifaire"
          className="xl:col-span-1"
          right={<StatusBadge status={String(req.status || '')} />}
        >
          {/* Infos mission */}
          <div className="space-y-2 text-sm">
            <Row label="Client" value={req.contact?.company || req.contact?.name || '—'} />
            <Row label="Lieu" value={req.location || '—'} />
            <Row label="Dates" value={formatDates(req)} />
            <Row label="Pax" value={String(req.guestCount ?? '—')} />
            <Row label="Budget client" value={formatBudget(req.budgetRange)} />
            <Row label="Type de mission" value={humanMissionType(req.missionType)} />
            <Row label="Service" value={String(req.serviceLevel || '—')} />
            <Row label="Cuisine" value={String(req.preferences?.cuisine || '—')} />
            <Row label="Restrictions" value={String(req.preferences?.allergies || '—')} />
            <Row label="Langues" value={String(req.preferences?.languages || '—')} />
          </div>

          {/* SECTION TARIF + BRIEFS */}
          <BriefSection req={req} />
        </Panel>

        {/* COLONNE DROITE — Chefs matchables */}
        <div className="xl:col-span-2 space-y-4">
          <Panel
            title="Chefs matchables"
            subtitle="Chefs éligibles, triés pour décision rapide"
            right={
              <div className="flex items-center gap-2">
                <div className="text-xs text-white/50 hidden sm:block">{matched.length} chef(s)</div>
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
                >
                  {showAll ? 'Afficher moins' : 'Afficher +'}
                </button>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Recherche (nom/email)…"
                  className="w-[240px] max-w-full px-3 py-2 rounded-xl border border-white/10 bg-neutral-950/40 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/45 mb-4">
              <span>{matchedAll.length} chefs actifs éligibles</span>
              <span className="text-white/20">•</span>
              <span>{showAll ? 'Tous les profils affichés' : 'Top 15 affichés'}</span>
              <span className="text-white/20">•</span>
              <span>Triés par compatibilité</span>
            </div>

            <div className="space-y-3">
              {matched.map((x) => (
                <ChefMatchCard
                  key={x.chef.id}
                  chef={x.chef}
                  fitScore={x.fitScore}
                  confidence={x.confidence}
                  reasons={x.reasons}
                  baseLabel={getChefBaseLabel(x.chef)}
                  contactLabel={getChefContactLabel(x.chef)}
                  availability={getChefAvailabilityLabel(x.chef)}
                  profileState={isChefProfileComplete(x.chef) ? 'Profil complet' : 'Profil incomplet'}
                  loading={actionChefId === ((x.chef as any)?.profile?.id || x.chef.id)}
                  onViewProfile={() => onViewChefProfile(x.chef)}
                  onSelect={() => onSelectChef(x.chef)}
                  req={req}
                />
              ))}
              {matched.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                  Aucun chef matchable pour cette demande.
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-white/45">
              "Sélectionner" = création d'une proposal ou mission + update statut request.
            </div>
          </Panel>
        </div>
      </div>

      <div className="text-xs text-white/35">
        CA jour : {Math.round(revenue.daySum)}€ • semaine : {Math.round(revenue.weekSum)}€ • mois : {Math.round(revenue.monthSum)}€
      </div>
    </div>
  );
}

/* ─── UI Components ─── */

function Panel({ title, subtitle, right, children, className = '' }: {
  title: string; subtitle?: string; right?: React.ReactNode;
  children: React.ReactNode; className?: string;
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
    s === 'new' ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
    : s === 'in_review' ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
    : s === 'assigned' ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
    : 'bg-white/10 text-white/60 border-white/10';
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{s || '—'}</span>;
}

function SmallBadge({ children, tone = 'default' }: {
  children: React.ReactNode; tone?: 'default' | 'ok' | 'warn' | 'bad';
}) {
  const cls =
    tone === 'ok' ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
    : tone === 'warn' ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
    : tone === 'bad' ? 'bg-red-500/15 text-red-200 border-red-500/20'
    : 'bg-white/10 text-white/70 border-white/10';
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{children}</span>;
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cls =
    confidence === 'high' ? 'bg-emerald-500/10 text-emerald-100 border-emerald-500/20'
    : confidence === 'medium' ? 'bg-amber-500/10 text-amber-100 border-amber-500/20'
    : 'bg-white/5 text-white/60 border-white/10';
  const label = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low';
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{label}</span>;
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="text-sm text-white/85 mt-1 break-words">{value}</div>
    </div>
  );
}

function ChefMatchCard({
  chef, fitScore, confidence, reasons, baseLabel, contactLabel,
  availability, profileState, loading, onViewProfile, onSelect, req,
}: {
  chef: ChefUser; fitScore: number; confidence: 'high' | 'medium' | 'low';
  reasons: string[]; baseLabel: string; contactLabel: string;
  availability: { label: string; tone: 'default' | 'ok' | 'warn' | 'bad' };
  profileState: string; loading: boolean;
  onViewProfile: () => void; onSelect: () => void;
  req: RequestEntity;
}) {
  const [copiedWA, setCopiedWA] = useState(false);
  const fullName = `${chef.firstName || ''} ${chef.lastName || ''}`.trim() || 'Chef';
  const initials = getChefInitials(chef);

  // Brief personnalisé pour ce chef — TJ net uniquement
  const chefBrief = useMemo(() => buildWhatsappBriefForChef(req), [req]);
  const chefPhone = (chef as any)?.profile?.phone || (chef as any)?.profile?.phoneNumber || null;

  const copyAndWA = async () => {
    await navigator.clipboard.writeText(chefBrief).catch(() => {});
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2000);
    openWhatsappWithText(chefBrief, chefPhone);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition p-4">
      <div className="flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-12 w-12 shrink-0 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-semibold text-base truncate">{fullName}</div>
            <div className="text-sm text-white/55 truncate">{chef.email || '—'}</div>
            <div className="text-xs text-white/40 mt-1">{profileState}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 xl:gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center min-w-[96px]">
            <div className="text-white text-2xl font-semibold leading-none">{fitScore}</div>
            <div className="text-xs text-white/45 mt-1">/100</div>
            <div className="mt-2"><ConfidenceBadge confidence={confidence} /></div>
          </div>

          <div className="flex flex-col gap-2 min-w-[140px]">
            <button
              onClick={onViewProfile}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 transition"
            >
              Voir profil
            </button>
            <button
              onClick={copyAndWA}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-100 hover:bg-emerald-500/20 transition"
            >
              {copiedWA ? '✓ Copié' : '📲 Contacter'}
            </button>
            <button
              onClick={onSelect}
              disabled={loading}
              className={[
                'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm transition',
                'border-white/10 bg-white text-black hover:opacity-90',
                loading ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              Sélectionner →
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoLine label="Base" value={baseLabel} />
        <InfoLine label="Disponibilité" value={<SmallBadge tone={availability.tone}>{availability.label}</SmallBadge>} />
        <InfoLine label="Contact" value={contactLabel} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {reasons?.length ? (
          reasons.slice(0, 3).map((r) => (
            <span key={r} className="text-xs px-2.5 py-1.5 rounded-full border border-white/10 bg-white/10 text-white/80">{r}</span>
          ))
        ) : (
          <span className="text-xs text-white/45">—</span>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

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

function isChefProfileComplete(chef: ChefUser) {
  const p: any = chef.profile ?? {};
  const checks = [
    Boolean((chef.firstName || p.firstName) && (chef.lastName || p.lastName)),
    Boolean(chef.email || p.email),
    Boolean(p.phone || p.phoneNumber || p.tel || p.telephone),
    Array.isArray(p.languages) ? p.languages.length > 0 : Boolean(p.languages),
    Array.isArray(p.specialties) ? p.specialties.length > 0 : Boolean(p.specialties || p.cuisines),
    Boolean(p.location || p.baseCity || p.city || p.ville),
    Boolean(p.bio || p.about || p.description),
  ];
  return checks.filter(Boolean).length >= 5;
}

function getChefBaseLabel(chef: ChefUser) {
  const p: any = chef.profile ?? {};
  return (p.location ?? {}).baseCity || p.baseCity || p.city || p.ville || '—';
}

function getChefContactLabel(chef: ChefUser) {
  const p: any = chef.profile ?? {};
  return p.phone || p.phoneNumber || p.tel || p.telephone || chef.email || '—';
}

function getChefAvailabilityLabel(chef: ChefUser) {
  const p: any = chef.profile ?? {};
  const availability = p.availability ?? p.availableDates ?? p.calendar ?? null;
  if (!availability) return { label: 'À confirmer', tone: 'warn' as const };
  if (typeof availability === 'object') {
    if (availability.availableNow === true) return { label: 'Disponible', tone: 'ok' as const };
    if (availability.availableNow === false) return { label: 'Indispo', tone: 'bad' as const };
  }
  return { label: 'À confirmer', tone: 'warn' as const };
}

function getChefInitials(chef: ChefUser) {
  const a = String(chef.firstName || '').trim().charAt(0);
  const b = String(chef.lastName || '').trim().charAt(0);
  return `${a}${b}`.trim() || 'CH';
}
