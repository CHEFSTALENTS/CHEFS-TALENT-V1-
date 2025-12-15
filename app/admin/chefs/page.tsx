'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/services/storage';
import type { ChefUser } from '@/types';

export default function AdminChefsPage() {
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [loading, setLoading] = useState(true);

  const pending = useMemo(
    () => chefs.filter(c => c.status === 'pending_validation'),
    [chefs]
  );

  const active = useMemo(
    () => chefs.filter(c => c.status === 'active'),
    [chefs]
  );

  const refresh = async () => {
    setLoading(true);
    const data = await auth.getAllChefs();
    setChefs(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const setStatus = async (id: string, status: ChefUser['status']) => {
    await auth.updateChefStatus(id, status);
    await refresh();
  };

  const remove = async (id: string) => {
    const ok = confirm('Supprimer ce chef ?');
    if (!ok) return;
    await auth.deleteChefAccount(id);
    await refresh();
  };

  if (loading) return <div style={{ padding: 24 }}>Chargement…</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1>Admin — Chefs</h1>

      <section style={{ marginTop: 24 }}>
        <h2>En attente ({pending.length})</h2>
        {pending.length === 0 ? (
          <p>Aucun chef en attente.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {pending.map(c => (
              <div key={c.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div><b>{c.firstName} {c.lastName}</b> — {c.email}</div>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>
                      profileCompleted: {String(c.profileCompleted)} • plan: {c.plan}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setStatus(c.id, 'active')}>✅ Valider (active)</button>
                    <button onClick={() => setStatus(c.id, 'paused')}>⏸ Pause</button>
                    <button onClick={() => remove(c.id)}>🗑 Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Actifs ({active.length})</h2>
        {active.length === 0 ? (
          <p>Aucun chef actif.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {active.map(c => (
              <div key={c.id} style={{ border: '1px solid #ddd', padding: 12, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div><b>{c.firstName} {c.lastName}</b> — {c.email}</div>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>
                      baseCity: {c.profile?.baseCity ?? '—'} • zones: {(c.profile?.coverageZones ?? []).join(', ') || '—'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setStatus(c.id, 'paused')}>⏸ Mettre en pause</button>
                    <button onClick={() => remove(c.id)}>🗑 Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
