'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, auth } from '@/services/storage';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [chefs, setChefs] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);

  const refresh = async () => {
    setLoading(true);
    const [r, c, m] = await Promise.all([
      api.getRequests?.() ?? [],
      auth.getAllChefs?.() ?? [],
      api.getAllMissions?.() ?? [],
    ]);
    setRequests(r);
    setChefs(c);
    setMissions(m);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    const b2b = requests.filter(r => r.userType === 'b2b').length;
    const b2c = requests.filter(r => r.userType !== 'b2b').length;
    const newCount = requests.filter(r => r.status === 'new').length;
    const pendingChefs = chefs.filter(c => c.status === 'pending' || c.status === 'pending_validation').length;
    return { b2b, b2c, newCount, pendingChefs };
  }, [requests, chefs]);

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded p-6 flex items-center justify-between">
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
        <div className="grid grid-cols-2 gap-4">
          <Card title="Demandes B2B" value={stats.b2b} href="/admin/requests?type=b2b" />
          <Card title="Demandes B2C" value={stats.b2c} href="/admin/requests?type=b2c" />
          <Card title="Nouvelles demandes" value={stats.newCount} href="/admin/requests?status=new" />
          <Card title="Chefs à valider" value={stats.pendingChefs} href="/admin/chefs" />
        </div>
      )}
    </div>
  );
}

function Card({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <Link href={href} className="bg-white border rounded p-5 hover:bg-stone-50 block">
      <div className="text-sm text-stone-500">{title}</div>
      <div className="text-3xl font-semibold mt-2">{value}</div>
      <div className="text-sm text-stone-500 mt-2">Ouvrir →</div>
    </Link>
  );
}
