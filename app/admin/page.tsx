'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { api, auth } from '@/services/storage';
import type { ChefUser, RequestEntity } from '@/types';
import type { Mission } from '@/types';

type QuickItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  meta?: string;
  createdAt?: string; // pour trier proprement
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

const refresh = async () => {
  setLoading(true);

  const [r, c, m] = await Promise.all([
    (api.getRequests?.() ?? Promise.resolve([])) as Promise<RequestEntity[]>,
    (auth.getAllChefs?.() ?? Promise.resolve([])) as Promise<ChefUser[]>,
    (api.getAllMissions?.() ?? Promise.resolve([])) as Promise<Mission[]>,
  ]);

  setRequests(r ?? []);
  setChefs(c ?? []);
  setMissions(m ?? []);
  setLoading(false);
};

useEffect(() => {
  refresh();
}, []);

function byDateDesc<T extends { createdAt?: string }>(arr: T[]) {
  return [...arr].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );
}
const revenue = useMemo(() => {
  const amountOf = (m: any) =>
    Number(m?.priceTotal ?? m?.totalPrice ?? m?.amount ?? m?.total ?? 0) || 0;

  const now = new Date();

  // Début du jour
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Début du mois
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Début de semaine (lundi)
  const day = now.getDay(); // 0 dimanche
  const diffToMonday = (day + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const sumSince = (from: Date) =>
    (missions || []).reduce((acc, m: any) => {
      const d = new Date(m?.createdAt || m?.paidAt || m?.startAt || 0);
      if (!Number.isNaN(d.getTime()) && d >= from) acc += amountOf(m);
      return acc;
    }, 0);

  return {
    day: sumSince(startOfDay),
    week: sumSince(startOfWeek),
    month: sumSince(startOfMonth),
  };
}, [missions]);

const money = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
  
const quickLists = useMemo(() => {
  const chefsPending = byDateDesc(
    chefs.filter(
      c => c.role === 'chef' && c.status === 'pending_validation'
    )
  )
    .slice(0, 5)
    .map<QuickItem>(c => ({
      id: c.id,
      title:
        `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
        'Chef',
      subtitle: c.email || '',
      href: '/admin/chefs',
      meta: `Inscrit ${formatDate(c.createdAt)}`,
      createdAt: c.createdAt,
    }));

  const b2bUrgent = byDateDesc(
    requests.filter(
      r => r.userType === 'b2b' && r.status === 'new'
    )
  )
    .slice(0, 5)
    .map<QuickItem>(r => ({
      id: r.id,
      title: `B2B — ${r.location || 'Lieu non précisé'}`,
      subtitle:
        r.contact?.company ??
        r.contact?.name ??
        'Concierge',
      href: '/admin/requests?type=b2b&status=new',
      meta: `Créée ${formatDate(r.createdAt)}`,
      createdAt: r.createdAt,
    }));

  const fastInReview = byDateDesc(
    requests.filter(
      r =>
        r.userType !== 'b2b' &&
        r.status === 'in_review' &&
        r.mode === 'fast'
    )
  )
    .slice(0, 5)
    .map<QuickItem>(r => ({
      id: r.id,
      title: `Fast — ${r.location || 'Lieu non précisé'}`,
      subtitle: `${r.guestCount ?? '—'} pers • ${
        r.missionType || 'mission'
      }`,
      href: '/admin/requests?status=in_review',
      meta: `Créée ${formatDate(r.createdAt)}`,
      createdAt: r.createdAt,
    }));

  const recentActivity: QuickItem[] = [
    ...byDateDesc(requests)
      .slice(0, 4)
      .map(r => ({
        id: r.id,
        title: `Demande ${
          r.userType === 'b2b' ? 'B2B' : 'B2C'
        } — ${r.location || 'Lieu'}`,
        subtitle: `${String(r.status)} • ${String(
          r.mode || 'standard'
        )}`,
        href: `/admin/requests?status=${encodeURIComponent(
          String(r.status)
        )}`,
        meta: formatDate(r.createdAt),
        createdAt: r.createdAt,
      })),
    ...byDateDesc(chefs)
      .slice(0, 4)
      .map(c => ({
        id: c.id,
        title:
          `Chef — ${c.firstName || ''} ${
            c.lastName || ''
          }`.trim() || 'Chef',
        subtitle: `${String(c.status)} • ${c.email || ''}`,
        href: '/admin/chefs',
        meta: formatDate(c.createdAt),
        createdAt: c.createdAt,
      })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 8);

  return {
    chefsPending,
    b2bUrgent,
    fastInReview,
    recentActivity,
  };
}, [requests, chefs]);
  
        
 {/* KPI / CA */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <div className="border rounded-xl bg-white p-4">
    <div className="text-xs text-stone-500">CA jour</div>
    <div className="text-2xl font-semibold mt-1">{money(revenue.day)}</div>
    <div className="text-xs text-stone-500 mt-2">depuis minuit</div>
  </div>

  <div className="border rounded-xl bg-white p-4">
    <div className="text-xs text-stone-500">CA semaine</div>
    <div className="text-2xl font-semibold mt-1">{money(revenue.week)}</div>
    <div className="text-xs text-stone-500 mt-2">depuis lundi</div>
  </div>

  <div className="border rounded-xl bg-white p-4">
    <div className="text-xs text-stone-500">CA mois</div>
    <div className="text-2xl font-semibold mt-1">{money(revenue.month)}</div>
    <div className="text-xs text-stone-500 mt-2">depuis le 1er</div>
  </div>
</div>

{/* Stats cards */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  <StatCard
    title="Demandes B2B"
    value={counts.b2bNew}
    subtitle="Traitement manuel obligatoire"
    href="/admin/requests?type=b2b&status=new"
    tone="amber"
    icon={<IconBriefcase />}
  />
  <StatCard
    title="Demandes B2C"
    value={counts.b2cNew}
    subtitle="Nouveaux clients privés"
    href="/admin/requests?type=b2c&status=new"
    tone="blue"
    icon={<IconUser />}
  />
  <StatCard
    title="En review"
    value={counts.inReview}
    subtitle="À matcher / traiter"
    href="/admin/requests?status=in_review"
    tone="violet"
    icon={<IconSpark />}
  />
  <StatCard
    title="Chefs à valider"
    value={counts.chefsToValidate}
    subtitle="Pending + approuvés"
    href="/admin/chefs"
    tone="stone"
    icon={<IconShield />}
  />
</div>

{/* 2 colonnes */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
  {/* À traiter maintenant */}
  <div className="lg:col-span-2 space-y-4">
    <Panel
      title="À traiter maintenant"
      subtitle="Les points chauds du back-office"
      right={
        <Link
          href="/admin/requests?status=new"
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          Ouvrir l’inbox →
        </Link>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MiniList
          title="Chefs en attente"
          tone="amber"
          empty="Aucun chef en attente."
          items={quickLists.chefsPending}
          footerHref="/admin/chefs"
          footerLabel="Gérer les chefs"
        />
        <MiniList
          title="Demandes B2B (veto)"
          tone="amber"
          empty="Aucune demande B2B new."
          items={quickLists.b2bUrgent}
          footerHref="/admin/requests?type=b2b&status=new"
          footerLabel="Voir les B2B"
        />
        <MiniList
          title="Fast en review"
          tone="violet"
          empty="Aucune fast en review."
          items={quickLists.fastInReview}
          footerHref="/admin/requests?status=in_review"
          footerLabel="Traiter le matching"
        />
      </div>
    </Panel>

    <Panel title="Modules" subtitle="Accès rapide aux pages clés">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <BigLink
          href="/admin/requests?status=new"
          title="Demandes"
          desc="Inbox & détail demandes"
          icon={<IconInbox />}
        />
        <BigLink
          href="/admin/chefs"
          title="Chefs"
          desc="Validation • score • profils"
          icon={<IconChefHat />}
        />
        <BigLink
          href="/admin/proposals"
          title="Proposals / Missions"
          desc="Offers & suivi missions"
          icon={<IconBolt />}
        />
      </div>
    </Panel>
  </div>

  {/* Activité récente */}
  <div className="space-y-4">
    <Panel title="Activité récente" subtitle="Derniers événements (localStorage)">
      <div className="space-y-2">
        {quickLists.recentActivity.length === 0 ? (
          <div className="text-sm text-stone-500">Rien pour le moment.</div>
        ) : (
          quickLists.recentActivity.map(item => (
            <Link
              key={item.id + item.href}
              href={item.href}
              className="block rounded-lg border bg-white hover:bg-stone-50 transition p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-xs text-stone-500 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  )}
                </div>
                <div className="text-xs text-stone-400 whitespace-nowrap">
                  {item.meta || ''}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Panel>

    <Panel title="État système" subtitle="Sécurité & cohérence">
      <div className="space-y-2 text-sm">
        <Row label="Source" value="LocalStorage (MVP)" />
        <Row label="Auto-match" value="B2C fast uniquement" />
        <Row label="Veto" value="B2B / luxe multi-jour" />
      </div>
    </Panel>
  </div>
</div>
  
/* =========================
   UI Components
========================= */
function Panel({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-xl bg-white">
      <div className="p-4 border-b flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-stone-500 mt-0.5">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  href,
  icon,
  tone = 'stone',
}: {
  title: string;
  value: number | string;
  subtitle: string;
  href: string;
  icon?: React.ReactNode;
  tone?: 'stone' | 'blue' | 'violet' | 'amber' | 'green';
}) {
  const toneCls =
    tone === 'blue'
      ? 'bg-blue-50 border-blue-100'
      : tone === 'violet'
      ? 'bg-violet-50 border-violet-100'
      : tone === 'amber'
      ? 'bg-amber-50 border-amber-100'
      : tone === 'green'
      ? 'bg-green-50 border-green-100'
      : 'bg-stone-50 border-stone-100';

  return (
    <Link href={href} className={`border rounded-xl p-4 hover:shadow-sm transition ${toneCls}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-stone-600">{title}</div>
          <div className="text-3xl font-semibold mt-1">{value}</div>
          <div className="text-xs text-stone-500 mt-2 truncate">{subtitle}</div>
        </div>
        <div className="shrink-0 h-10 w-10 rounded-xl border bg-white flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-3 text-xs text-stone-600">Ouvrir →</div>
    </Link>
  );
}

function MiniList({
  title,
  items,
  empty,
  footerHref,
  footerLabel,
  tone = 'stone',
}: {
  title: string;
  items: QuickItem[];
  empty: string;
  footerHref: string;
  footerLabel: string;
  tone?: 'stone' | 'amber' | 'violet' | 'blue' | 'green';
}) {
  const pill =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-900'
      : tone === 'violet'
      ? 'bg-violet-100 text-violet-900'
      : tone === 'blue'
      ? 'bg-blue-100 text-blue-900'
      : tone === 'green'
      ? 'bg-green-100 text-green-900'
      : 'bg-stone-100 text-stone-900';

  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <span className={`text-[11px] px-2 py-1 rounded-full ${pill}`}>{items.length}</span>
      </div>

      <div className="p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-stone-500">{empty}</div>
        ) : (
          items.map(it => (
            <Link
              key={it.id + it.href}
              href={it.href}
              className="block rounded-lg border hover:bg-stone-50 transition p-2"
            >
              <div className="text-sm font-medium truncate">{it.title}</div>
              {it.subtitle && (
                <div className="text-xs text-stone-500 truncate mt-0.5">{it.subtitle}</div>
              )}
              {it.meta && <div className="text-[11px] text-stone-400 mt-1">{it.meta}</div>}
            </Link>
          ))
        )}
      </div>

      <div className="p-3 border-t">
        <Link href={footerHref} className="text-sm text-stone-700 hover:text-stone-900">
          {footerLabel} →
        </Link>
      </div>
    </div>
  );
}

function BigLink({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link href={href} className="border rounded-xl bg-white hover:bg-stone-50 transition p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl border bg-white flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-stone-500 mt-1">{desc}</div>
          <div className="text-xs text-stone-600 mt-3">Ouvrir →</div>
        </div>
      </div>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-stone-500">{label}</div>
      <div className="font-medium text-stone-900">{value}</div>
    </div>
  );
}
/* =========================
   Icons (inline SVG)
========================= */
function IconBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 12v2h4v-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M4 20V6a2 2 0 0 1 2-2h6v16M14 8h4a2 2 0 0 1 2 2v10M8 8h2M8 12h2M8 16h2M16 12h2M16 16h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M12 2 20 6v7c0 5-3.5 9-8 9s-8-4-8-9V6l8-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M4 4h16v12H15l-3 4-3-4H4V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChefHat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M7 10c-2.2 0-4-1.8-4-4s1.8-4 4-4c1.2 0 2.3.5 3 1.4C10.8 2.5 11.9 2 13 2c2.2 0 4 1.8 4 4 0 .4-.1.8-.2 1.2.4-.1.8-.2 1.2-.2 2.2 0 4 1.8 4 4s-1.8 4-4 4H7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 14v8h10v-8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-700">
      <path
        d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================
   Helpers
========================= */
function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
