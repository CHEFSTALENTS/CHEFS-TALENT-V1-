'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, auth } from '@/services/storage';
import type { ChefUser, RequestEntity } from '@/types';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [chefs, setChefs] = useState<ChefUser[]>([]);

  const refresh = async () => {
    setLoading(true);
    const [r, c] = await Promise.all([
      (api.getRequests?.() ?? Promise.resolve([])) as Promise<RequestEntity[]>,
      (auth.getAllChefs?.() ?? Promise.resolve([])) as Promise<ChefUser[]>,
    ]);
    setRequests(r ?? []);
    setChefs(c ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const b2bNew = requests.filter(r => r.userType === 'b2b' && r.status === 'new').length;
    const b2cNew = requests.filter(r => r.userType !== 'b2b' && r.status === 'new').length;
    const newAll = requests.filter(r => r.status === 'new').length;
    const inReview = requests.filter(r => r.status === 'in_review').length;

    // Chefs à valider : adapte si tes statuts sont "pending"/"submitted"/"approved"
    const chefsToValidate = chefs.filter(c =>
      (c.status as any) === 'pending' || (c.status as any) === 'submitted' || (c.status as any) === 'approved'
    ).length;

    return { b2bNew, b2cNew, newAll, inReview, chefsToValidate };
  }, [requests, chefs]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Bureau Admin</h1>
          <p className="text-sm text-stone-500">Tout ton back office Chef Talents au même endroit.</p>
        </div>
        <button onClick={refresh} className="px-3 py-2 rounded border text-sm">
          Rafraîchir
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-stone-500">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KpiCard
            title="Demandes B2B"
            value={counts.b2bNew}
            subtitle="Nouvelles conciergeries"
            href="/admin/requests?type=b2b&status=new"
          />
          <KpiCard
            title="Demandes B2C"
            value={counts.b2cNew}
            subtitle="Nouveaux clients privés"
            href="/admin/requests?type=b2c&status=new"
          />
          <KpiCard
            title="Nouvelles demandes"
            value={counts.newAll}
            subtitle="Toutes sources"
            href="/admin/requests?status=new"
          />
          <KpiCard
            title="En review"
            value={counts.inReview}
            subtitle="À traiter / matcher"
            href="/admin/requests?status=in_review"
          />
          <KpiCard
            title="Chefs à valider"
            value={counts.chefsToValidate}
            subtitle="Inscriptions à approuver"
            href="/admin/chefs"
          />
          <KpiCard
            title="Proposals / Missions"
            value="→"
            subtitle="Accéder aux modules"
            href="/admin/proposals"
          />
        </div>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  href,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link href={href} className="border rounded bg-white p-4 hover:bg-stone-50 transition">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-stone-500">{title}</div>
          <div className="text-3xl font-semibold mt-1">{value}</div>
          <div className="text-sm text-stone-500 mt-2">{subtitle}</div>
        </div>
        <div className="text-sm text-stone-400">Ouvrir →</div>
      </div>
    </Link>
  );
}
