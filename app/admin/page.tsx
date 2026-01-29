'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { api, auth } from '@/services/storage';
import type { ChefUser, RequestEntity, Mission } from '@/types';

type QuickItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  meta?: string;
  createdAt?: string;
};

type StatusKey = 'new' | 'in_review' | 'assigned' | 'closed';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

 const refresh = async () => {
  setLoading(true);

  try {
    // ✅ source unique : Supabase via ton API admin
    const json = await fetch('/api/admin/requests', { cache: 'no-store' }).then((x) => x.json());

    // ⚠️ ton endpoint renvoie { items: [...] }
    setRequests(json.items ?? []);

    // ✅ on garde chefs + missions comme avant (si tu veux)
    const [c, m] = await Promise.all([
      (auth.getAllChefs?.() ?? Promise.resolve([])) as Promise<ChefUser[]>,
      (api.getAllMissions?.() ?? Promise.resolve([])) as Promise<Mission[]>,
    ]);

    setChefs(c ?? []);
    setMissions(m ?? []);
  } catch (e) {
    console.error('Admin refresh error', e);
    setRequests([]);
    setChefs([]);
    setMissions([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    refresh();
  }, []);

  /* =========================
     Utils
  ========================= */

  function byDateDesc<T extends { createdAt?: string }>(arr: T[]) {
    return [...arr].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  const money = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

  const amountOf = (m: any) => Number(m?.priceTotal ?? m?.totalPrice ?? m?.amount ?? m?.total ?? m?.estimatedAmount ?? 0) || 0;

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function safeDate(iso?: string) {
    const d = new Date(iso || '');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /* =========================
     KPI + Trends
  ========================= */

  const kpi = useMemo(() => {
    const todo = requests.filter(r => r.status === 'new' || r.status === 'in_review');
    const b2bNew = requests.filter(r => r.userType === 'b2b' && r.status === 'new');
    const b2cNew = requests.filter(r => r.userType !== 'b2b' && r.status === 'new');
    const inReview = requests.filter(r => r.status === 'in_review');
    const chefsPending = chefs.filter(c => c.role === 'chef' && c.status === 'pending_validation');

    // Revenus
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const revenueMonth = missions.reduce((acc, mm: any) => {
      const d = safeDate(mm?.createdAt || mm?.paidAt || mm?.startAt);
      if (d && d >= startOfMonth) acc += amountOf(mm);
      return acc;
    }, 0);

    // Delta requests (7 derniers jours vs 7 jours avant)
    const last7From = daysAgo(6);
    const prev7From = daysAgo(13);

    const createdInRange = (arr: any[], from: Date, to: Date) =>
      arr.filter(x => {
        const d = safeDate(x?.createdAt);
        return d && d >= from && d <= to;
      }).length;

    const last7 = createdInRange(requests as any, last7From, new Date());
    const prev7 = createdInRange(requests as any, prev7From, daysAgo(7));

    const delta = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);

    return {
      todo: todo.length,
      b2bNew: b2bNew.length,
      b2cNew: b2cNew.length,
      inReview: inReview.length,
      chefsPending: chefsPending.length,
      revenueMonth,
      reqDeltaPct: delta,
      reqLast7: last7,
    };
  }, [requests, chefs, missions]);

  /* =========================
     Charts data
  ========================= */

  const requestsSeries14 = useMemo(() => {
    // 14 jours (incl today)
    const points = Array.from({ length: 14 }).map((_, i) => {
      const day = daysAgo(13 - i);
      const label = day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      return { day, label, value: 0 };
    });

    for (const r of requests) {
      const d = safeDate(r.createdAt);
      if (!d) continue;

      // trouver index by day (00:00)
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const idx = points.findIndex(p => p.day.getTime() === key);
      if (idx >= 0) points[idx].value += 1;
    }

    return points.map(p => ({ label: p.label, value: p.value }));
  }, [requests]);

  const statusBreakdown = useMemo(() => {
    const base: Record<StatusKey, number> = { new: 0, in_review: 0, assigned: 0, closed: 0 };
    for (const r of requests) {
      const s = (r.status || 'new') as StatusKey;
      if (base[s] !== undefined) base[s] += 1;
    }
    return base;
  }, [requests]);

  const chefsBreakdown = useMemo(() => {
    const base = {
      pending_validation: 0,
      approved: 0,
      active: 0,
      paused: 0,
    };
    for (const c of chefs) {
      const s = c.status || 'pending_validation';
      if ((base as any)[s] !== undefined) (base as any)[s] += 1;
    }
    return base;
  }, [chefs]);

  /* =========================
     Inbox (priorité)
  ========================= */

  const inbox = useMemo(() => {
    const priority = (r: RequestEntity) => {
      if (r.status === 'new') return 0;
      if (r.status === 'in_review') return 1;
      if (r.status === 'assigned') return 2;
      return 3;
    };

    return [...requests]
      .sort((a, b) => {
        const pa = priority(a);
        const pb = priority(b);
        if (pa !== pb) return pa - pb;
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      })
      .slice(0, 12);
  }, [requests]);

  /* =========================
     Render
  ========================= */

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <IconGrid />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-white">Cockpit Admin</h1>
              <p className="text-sm text-white/50 mt-1">Vision rapide : demandes, chefs, missions — source Supabase</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/requests"
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 hover:bg-white/10 transition"
          >
            Voir demandes
          </Link>
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-sm text-white hover:bg-white/15 transition"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-white/60">Chargement…</div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <KpiCard
              title="À traiter"
              value={kpi.todo}
              subtitle="new + in_review"
              tone="amber"
              right={<DeltaBadge value={kpi.reqDeltaPct} label="7j" />}
              href="/admin/requests?status=new"
            />
            <KpiCard
              title="B2B (new)"
              value={kpi.b2bNew}
              subtitle="veto / manuel"
              tone="amber"
              href="/admin/requests?type=b2b&status=new"
            />
            <KpiCard
              title="B2C (new)"
              value={kpi.b2cNew}
              subtitle="fast"
              tone="blue"
              href="/admin/requests?type=b2c&status=new"
            />
            <KpiCard
              title="Chefs pending"
              value={kpi.chefsPending}
              subtitle="à valider"
              tone="violet"
              href="/admin/chefs"
            />
            <KpiCard
              title="CA mois"
              value={money(kpi.revenueMonth)}
              subtitle="missions"
              tone="green"
              href="/admin/proposals"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Panel title="Demandes / jour (14j)" subtitle="Volume entrant">
              <Sparkline values={requestsSeries14.map(x => x.value)} />
              <div className="mt-3 flex justify-between text-[11px] text-white/40">
                <span>{requestsSeries14[0]?.label}</span>
                <span>{requestsSeries14.at(-1)?.label}</span>
              </div>
            </Panel>

            <Panel title="Répartition demandes" subtitle="Statuts">
              <StackBar
                items={[
                  { label: 'new', value: statusBreakdown.new, tone: 'amber' },
                  { label: 'in_review', value: statusBreakdown.in_review, tone: 'blue' },
                  { label: 'assigned', value: statusBreakdown.assigned, tone: 'green' },
                  { label: 'closed', value: statusBreakdown.closed, tone: 'stone' },
                ]}
              />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60">
                <Line label="new" value={statusBreakdown.new} />
                <Line label="in_review" value={statusBreakdown.in_review} />
                <Line label="assigned" value={statusBreakdown.assigned} />
                <Line label="closed" value={statusBreakdown.closed} />
              </div>
            </Panel>

            <Panel title="Répartition chefs" subtitle="Qualité réseau">
              <StackBar
                items={[
                  { label: 'pending', value: chefsBreakdown.pending_validation, tone: 'amber' },
                  { label: 'approved', value: chefsBreakdown.approved, tone: 'blue' },
                  { label: 'active', value: chefsBreakdown.active, tone: 'green' },
                  { label: 'paused', value: chefsBreakdown.paused, tone: 'stone' },
                ]}
              />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60">
                <Line label="pending" value={chefsBreakdown.pending_validation} />
                <Line label="approved" value={chefsBreakdown.approved} />
                <Line label="active" value={chefsBreakdown.active} />
                <Line label="paused" value={chefsBreakdown.paused} />
              </div>
            </Panel>
          </div>

          {/* Inbox + Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <Panel
                title="Inbox prioritaire"
                subtitle="Les 12 demandes à ouvrir maintenant"
                right={
                  <Link href="/admin/requests" className="text-sm text-white/60 hover:text-white transition">
                    Ouvrir toutes →
                  </Link>
                }
              >
                {inbox.length === 0 ? (
                  <div className="text-sm text-white/60">Aucune demande.</div>
                ) : (
                  <div className="space-y-2">
                    {inbox.map(r => (
                      <Link
                        key={r.id}
                        href={`/admin/requests/${encodeURIComponent(r.id)}`}
                        className="block rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge tone={r.userType === 'b2b' ? 'amber' : 'blue'}>{r.userType === 'b2b' ? 'B2B' : 'B2C'}</Badge>
                              <Badge tone={r.mode === 'fast' ? 'violet' : 'stone'}>{r.mode === 'fast' ? 'Fast' : 'Standard'}</Badge>
                              <StatusPill status={String(r.status || 'new')} />
                            </div>

                            <div className="mt-2 text-white font-medium truncate">
                              {r.location || 'Lieu'} • {r.guestCount ?? '—'} pax • {shortText(String(r.budgetRange || '—'), 40)}
                            </div>
                            <div className="text-xs text-white/45 mt-1 truncate">
                              {(r.contact?.company || r.contact?.name || 'Client')} • {r.contact?.email || ''}
                            </div>
                          </div>

                          <div className="text-xs text-white/40 whitespace-nowrap">
                            {formatDate(r.createdAt)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <div className="space-y-3">
              <Panel title="Modules" subtitle="Accès rapide">
                <div className="grid grid-cols-1 gap-2">
                  <QuickLink href="/admin/requests" title="Demandes" desc="Inbox & matching" icon={<IconInbox />} />
                  <QuickLink href="/admin/chefs" title="Chefs" desc="Validation & profils" icon={<IconChefHat />} />
                  <QuickLink href="/admin/proposals" title="Missions" desc="Suivi & offres" icon={<IconBolt />} />
                </div>
              </Panel>

              <Panel title="Qualité data" subtitle="Contrôles rapides">
                <div className="space-y-2 text-sm text-white/70">
                  <Row label="Source" value="Supabase" />
                  <Row label="B2C" value="Fast match" />
                  <Row label="B2B" value="Concierge match" />
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================
   UI components
========================= */

function Panel({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle ? <div className="text-xs text-white/45 mt-0.5">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  tone,
  right,
  href,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  tone: 'stone' | 'blue' | 'violet' | 'amber' | 'green';
  right?: ReactNode;
  href?: string;
}) {
  const toneCls =
    tone === 'blue'
      ? 'from-blue-500/10 to-white/5'
      : tone === 'violet'
      ? 'from-violet-500/10 to-white/5'
      : tone === 'amber'
      ? 'from-amber-500/10 to-white/5'
      : tone === 'green'
      ? 'from-emerald-500/10 to-white/5'
      : 'from-white/10 to-white/5';

  const Card = (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-b ${toneCls} p-4 hover:bg-white/10 transition`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-white/55">{title}</div>
          <div className="text-2xl font-semibold text-white mt-1">{value}</div>
          {subtitle ? <div className="text-xs text-white/40 mt-1 truncate">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );

  return href ? <Link href={href}>{Card}</Link> : Card;
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${
      up ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/20 bg-rose-500/10 text-rose-200'
    }`}>
      {up ? '▲' : '▼'} {Math.abs(value)}% <span className="text-white/40">{label}</span>
    </span>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: 'stone' | 'amber' | 'blue' | 'violet' }) {
  const cls =
    tone === 'amber'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : tone === 'blue'
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : tone === 'violet'
      ? 'bg-violet-500/15 text-violet-200 border-violet-500/20'
      : 'bg-white/10 text-white/70 border-white/10';

  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{children}</span>;
}

function StatusPill({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const cls =
    s === 'new'
      ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
      : s === 'in_review'
      ? 'bg-sky-500/15 text-sky-200 border-sky-500/20'
      : s === 'assigned'
      ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20'
      : 'bg-white/10 text-white/60 border-white/10';

  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${cls}`}>{s}</span>;
}

/** Mini sparkline SVG sans dépendance */
function Sparkline({ values }: { values: number[] }) {
  const w = 240;
  const h = 56;
  const max = Math.max(1, ...values);
  const step = w / Math.max(1, values.length - 1);

  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * (h - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/30 p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
        <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80" />
      </svg>
      <div className="mt-2 text-xs text-white/45">max: {max}</div>
    </div>
  );
}

/** Barre empilée simple */
function StackBar({ items }: { items: { label: string; value: number; tone: 'stone' | 'amber' | 'blue' | 'green' }[] }) {
  const total = items.reduce((a, b) => a + (b.value || 0), 0) || 1;
  const toneCls = (t: any) =>
    t === 'amber'
      ? 'bg-amber-500/40'
      : t === 'blue'
      ? 'bg-sky-500/40'
      : t === 'green'
      ? 'bg-emerald-500/40'
      : 'bg-white/20';

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/30 overflow-hidden">
      <div className="h-3 flex">
        {items.map(it => (
          <div key={it.label} className={toneCls(it.tone)} style={{ width: `${Math.round((it.value / total) * 100)}%` }} />
        ))}
      </div>
      <div className="p-3 flex flex-wrap gap-2 text-xs text-white/60">
        {items.map(it => (
          <span key={it.label} className="inline-flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${toneCls(it.tone)}`} />
            {it.label}: <b className="text-white/80">{it.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1">
      <span>{label}</span>
      <b className="text-white/85">{value}</b>
    </div>
  );
}

function QuickLink({ href, title, desc, icon }: { href: string; title: string; desc: string; icon?: ReactNode }) {
  return (
    <Link href={href} className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shrink-0">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-white/45 mt-0.5">{desc}</div>
        </div>
      </div>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-white/45">{label}</div>
      <div className="text-white/85 font-medium">{value}</div>
    </div>
  );
}

function shortText(s: string, max: number) {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

/* =========================
   Icons
========================= */

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/80">
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/80">
      <path d="M4 4h16v12H15l-3 4-3-4H4V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconChefHat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/80">
      <path d="M7 10c-2.2 0-4-1.8-4-4s1.8-4 4-4c1.2 0 2.3.5 3 1.4C10.8 2.5 11.9 2 13 2c2.2 0 4 1.8 4 4 0 .4-.1.8-.2 1.2.4-.1.8-.2 1.2-.2 2.2 0 4 1.8 4 4s-1.8 4-4 4H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 14v8h10v-8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/80">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
