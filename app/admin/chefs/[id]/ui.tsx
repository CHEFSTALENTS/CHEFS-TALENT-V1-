'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type MissionRow = {
  id: string;
  created_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  city?: string | null;
  status?: string | null;
  amount?: number | null;
  total?: number | null;
  total_price?: number | null;
  price_total?: number | null;
};

function amountOf(m: MissionRow) {
  return Number(m.price_total ?? m.total_price ?? m.total ?? m.amount ?? 0) || 0;
}

function money(n: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function pillClass(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'done') return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20';
  if (s === 'in_review' || s === 'pending') return 'bg-sky-500/15 text-sky-200 border-sky-500/20';
  if (s === 'cancelled' || s === 'canceled') return 'bg-rose-500/15 text-rose-200 border-rose-500/20';
  return 'bg-white/10 text-white/70 border-white/10';
}

function getName(profile: any) {
  if (profile?.name) return profile.name;
  const fn = profile?.firstName || '';
  const ln = profile?.lastName || '';
  const full = `${fn} ${ln}`.trim();
  return full || 'Chef';
}

function getAvatar(profile: any) {
  return profile?.avatarUrl || profile?.photoUrl || null;
}
function AdminActions({
  chefId,
  name,
  email,
  phone,
  status,
  onStatusSaved,
}: {
  chefId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  onStatusSaved?: (newStatus: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState(status || 'approved');

  // WhatsApp: format simple (FR), tu peux adapter
  const waPhone = (phone || '').replace(/[^\d+]/g, '');
  const waText = encodeURIComponent(
    `Hello ${name},\n\nIci Thomas / Chef Talents.\nJe te contacte au sujet d’une mission.\nTu es dispo pour en parler ?`
  );
  const waHref = waPhone ? `https://wa.me/${waPhone.startsWith('+') ? waPhone.slice(1) : waPhone}?text=${waText}` : '';

  // Mailto (admin)
  const mailSubject = encodeURIComponent(`[Chef Talents] Mission / dispo — ${name}`);
  const mailBody = encodeURIComponent(
    `Bonjour ${name},\n\nJ’ai une mission potentielle à te proposer.\nPeux-tu me confirmer :\n- tes dispos (dates)\n- ta mobilité\n- ton tarif à jour\n\nMerci,\nThomas — Chef Talents`
  );
  const mailHref = email ? `mailto:${email}?subject=${mailSubject}&body=${mailBody}` : '';

  async function togglePause() {
    // Exemple: si status = paused -> approved, sinon paused
    const target = (status || '').toLowerCase() === 'paused' ? 'approved' : 'paused';
    await saveStatus(target);
  }

  async function saveStatus(s: string) {
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/chefs/${encodeURIComponent(chefId)}/status`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: s }),
      });
      if (!r.ok) throw new Error(`status update failed: ${r.status}`);
      setOpen(false);
      onStatusSaved?.(s);
    } catch (e) {
      console.error(e);
      alert("Impossible de mettre à jour le statut (endpoint à brancher ?).");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-white/70">
          Actions rapides (admin)
          <div className="text-xs text-white/40 mt-0.5">
            WhatsApp / Mail / statut / mission
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Créer mission */}
          <Link
            href={`/admin/missions/new?chefId=${encodeURIComponent(chefId)}`}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
          >
            + Créer mission
          </Link>

          {/* WhatsApp */}
          <a
            href={waHref || '#'}
            target="_blank"
            rel="noreferrer"
            className={[
              'px-3 py-2 rounded-xl border text-sm transition',
              waHref
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                : 'border-white/10 bg-white/5 text-white/40 cursor-not-allowed',
            ].join(' ')}
            onClick={(e) => {
              if (!waHref) e.preventDefault();
            }}
            title={waHref ? 'Ouvrir WhatsApp' : 'Pas de numéro'}
          >
            WhatsApp
          </a>

          {/* Mail */}
          <a
            href={mailHref || '#'}
            className={[
              'px-3 py-2 rounded-xl border text-sm transition',
              mailHref
                ? 'border-sky-500/20 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15'
                : 'border-white/10 bg-white/5 text-white/40 cursor-not-allowed',
            ].join(' ')}
            onClick={(e) => {
              if (!mailHref) e.preventDefault();
            }}
            title={mailHref ? 'Envoyer un email' : 'Pas d’email'}
          >
            Mail
          </a>

          {/* Pause */}
          <button
            onClick={togglePause}
            disabled={saving}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition disabled:opacity-50"
          >
            {String(status || '').toLowerCase() === 'paused' ? 'Activer' : 'Mettre en pause'}
          </button>

          {/* Changer statut */}
          <button
            onClick={() => setOpen(true)}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            Changer status
          </button>
        </div>
      </div>

      {/* Modal status */}
      {open ? (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Changer le statut</div>
                <div className="text-xs text-white/45 mt-0.5">Chef: {name}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
              >
                Fermer ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs text-white/50">Statut</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none"
              >
                <option value="pending_validation">pending_validation</option>
                <option value="approved">approved</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="rejected">rejected</option>
              </select>

              <button
                onClick={() => saveStatus(nextStatus)}
                disabled={saving}
                className="w-full mt-3 px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>

              <div className="text-[11px] text-white/40 mt-2">
                Endpoint attendu : <span className="font-mono">POST /api/admin/chefs/[id]/status</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
export default function ChefProfileClient({
  chefId,
  chefEmail,
  profile,
  missions,
  kpis,
}: {
  chefId: string;
  chefEmail: string | null;
  profile: any;
  missions: MissionRow[];
  kpis: {
    missionCount: number;
    totalRevenue: number;
    avgBasket: number;
    lastMission: MissionRow | null;
  };
}) {
  const name = getName(profile);
  const avatar = getAvatar(profile);
  const baseCity = profile?.baseCity || profile?.location?.baseCity || '—';
  const status = profile?.status || '—';
  const languages = Array.isArray(profile?.languages) ? profile.languages : [];
  const cuisines = Array.isArray(profile?.cuisines) ? profile.cuisines : [];
  const images = (profile?.images ?? []) as string[];

  const residenceRate =
    profile?.pricing?.residence?.dailyRate ??
    profile?.pricing?.dailyRate ??
    null;

  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });

  const topMeta = useMemo(() => {
    const flags = profile?.pricing?.flags || {};
    const parts: string[] = [];
    if (profile?.internationalMobility || flags?.international) parts.push('International');
    if (flags?.highSeason) parts.push('High season');
    if (flags?.yacht) parts.push('Yacht');
    if (flags?.brigade) parts.push('Brigade');
    const radius = profile?.travelRadiusKm || profile?.location?.travelRadiusKm;
    if (radius) parts.push(`${radius}km`);
    return parts;
  }, [profile]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 overflow-hidden shrink-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-white">{name}</h1>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${pillClass(status)}`}>
                {String(status)}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/70">
                {baseCity}
              </span>
            </div>

            <div className="text-sm text-white/55 mt-1">
              {chefEmail || profile?.email || '—'} {profile?.phone ? ` • ${profile.phone}` : ''}
            </div>

            {topMeta.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {topMeta.map((t: string) => (
                  <span key={t} className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/70">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/map"
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            ← Retour map
          </Link>
          <Link
            href="/admin/chefs"
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
          >
            Tous les chefs
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi title="Missions" value={kpis.missionCount} subtitle="total" />
        <Kpi title="CA généré" value={money(kpis.totalRevenue)} subtitle="somme missions" />
        <Kpi title="Panier moyen" value={money(kpis.avgBasket)} subtitle="≈ par mission" />
        <Kpi
          title="Dernière mission"
          value={kpis.lastMission ? fmtDate(kpis.lastMission.created_at || kpis.lastMission.start_date) : '—'}
          subtitle={kpis.lastMission ? (kpis.lastMission.location || kpis.lastMission.city || '') : '—'}
        />
      </div>

      {/* Infos + Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Profil">
          <div className="space-y-2 text-sm">
            <Row label="ID" value={chefId} mono />
            <Row label="Base" value={baseCity} />
            <Row label="Langues" value={languages.length ? languages.join(', ') : '—'} />
            <Row label="Expérience" value={profile?.yearsExperience ? `${profile.yearsExperience} ans` : '—'} />
            <Row label="Seniorité" value={profile?.seniorityLevel || '—'} />
            <Row label="Types" value={Array.isArray(profile?.missionTypes) ? profile.missionTypes.join(', ') : '—'} />
          </div>
        </Panel>

        <Panel title="Offre">
          <div className="space-y-2 text-sm">
            <Row label="Cuisine" value={cuisines.length ? cuisines.slice(0, 8).join(', ') : '—'} />
            <Row label="Spécialités" value={Array.isArray(profile?.specialties) ? profile.specialties.slice(0, 8).join(', ') : '—'} />
            <Row label="Environnements" value={Array.isArray(profile?.environments) ? profile.environments.join(', ') : '—'} />
          </div>
        </Panel>

        <Panel title="Tarifs">
          <div className="space-y-2 text-sm">
            <Row label="Tier" value={profile?.pricing?.tier || '—'} />
            <Row label="Résidence / jour" value={residenceRate ? money(Number(residenceRate)) : '—'} />
            <Row
              label="Event / pax"
              value={profile?.pricing?.event?.pricePerPerson ? money(Number(profile.pricing.event.pricePerPerson)) : '—'}
            />
            <Row
              label="Min pax"
              value={profile?.pricing?.event?.minGuests ? String(profile.pricing.event.minGuests) : '—'}
            />
          </div>
        </Panel>
      </div>

      {/* Portfolio */}
      <Panel title="Portfolio" subtitle={images.length ? `${images.length} photo(s)` : 'Aucune photo'}>
        <PortfolioGrid
          urls={images}
          onOpen={(index) => setLightbox({ open: true, index })}
        />
      </Panel>

      {/* Missions list */}
      <Panel title="Missions" subtitle={missions.length ? `${missions.length} ligne(s)` : 'Aucune mission'}>
        {missions.length === 0 ? (
          <div className="text-sm text-white/50">Aucune mission liée pour l’instant.</div>
        ) : (
          <div className="space-y-2">
            {missions.slice(0, 50).map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${pillClass(m.status)}`}>
                        {String(m.status || '—')}
                      </span>
                      <span className="text-sm text-white font-medium truncate">
                        {m.location || m.city || '—'}
                      </span>
                    </div>

                    <div className="text-xs text-white/50 mt-1">
                      {fmtDate(m.start_date)} {m.end_date ? `→ ${fmtDate(m.end_date)}` : ''} • ID: {m.id}
                    </div>
                  </div>

                  <div className="text-sm text-white/85 font-semibold whitespace-nowrap">
                    {money(amountOf(m))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      
{/* CTA Admin */}
<AdminActions
  chefId={chefId}
  name={name}
  email={chefEmail || profile?.email || ''}
  phone={profile?.phone || ''}
  status={String(profile?.status || '')}
  onStatusSaved={(newStatus) => {
    // Option: tu peux aussi refresh via router.refresh()
    // ici on ne modifie pas le profile en local pour rester simple
  }}
/>
      {/* Lightbox */}
      {lightbox.open ? (
        <Lightbox
          urls={images}
          index={lightbox.index}
          onClose={() => setLightbox({ open: false, index: 0 })}
          onPrev={() => setLightbox((s) => ({ ...s, index: Math.max(0, s.index - 1) }))}
          onNext={() => setLightbox((s) => ({ ...s, index: Math.min(images.length - 1, s.index + 1) }))}
        />
      ) : null}
    </div>
  );
}

/* ---------------- UI ---------------- */

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        {subtitle ? <div className="text-xs text-white/45 mt-0.5">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Kpi({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/55">{title}</div>
      <div className="text-2xl font-semibold text-white mt-1">{value}</div>
      {subtitle ? <div className="text-xs text-white/40 mt-1">{subtitle}</div> : null}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-white/45">{label}</div>
      <div className={`text-white/85 text-right ${mono ? 'font-mono text-[12px] break-all' : 'font-medium'}`}>
        {value || '—'}
      </div>
    </div>
  );
}

function PortfolioGrid({ urls, onOpen }: { urls: string[]; onOpen: (index: number) => void }) {
  if (!urls?.length) return <div className="text-sm text-white/50">Aucune photo portfolio.</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {urls.map((src, i) => (
        <button
          key={src + i}
          onClick={() => onOpen(i)}
          className="group block rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition text-left"
          title="Ouvrir"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`portfolio-${i}`} className="h-32 w-full object-cover group-hover:scale-[1.02] transition" />
        </button>
      ))}
    </div>
  );
}

function Lightbox({
  urls,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  urls: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const src = urls[index];

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-white/70">
            {index + 1} / {urls.length}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
          >
            Fermer ✕
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="portfolio" className="w-full max-h-[75vh] object-contain bg-black" />
        </div>

        <div className="flex justify-between mt-3">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition disabled:opacity-40"
          >
            ← Précédente
          </button>
          <button
            onClick={onNext}
            disabled={index === urls.length - 1}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition disabled:opacity-40"
          >
            Suivante →
          </button>
        </div>
      </div>
    </div>
  );
}
