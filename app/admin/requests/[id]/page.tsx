'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, auth } from '@/services/storage';
import type { ChefUser, RequestEntity } from '@/types';
import { matchChefsForFastRequest } from '@/services/fastMatch';

export default function AdminRequestDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<RequestEntity | null>(null);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [q, setQ] = useState('');

  const refresh = async () => {
    setLoading(true);

    const [r, c] = await Promise.all([
      (api.getRequest?.(id) ?? Promise.resolve(null)) as Promise<RequestEntity | null>,
      (auth.getAllChefs?.() ?? Promise.resolve([])) as Promise<ChefUser[]>,
    ]);

    setReq(r ?? null);
    setChefs(c ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (id) refresh();
  }, [id]);

  const matched = useMemo(() => {
    if (!req) return [];

    // 1) base: chefs actifs uniquement
    const active = chefs.filter(c => c.role === 'chef' && c.status === 'active');

    // 2) matching: on réutilise ton moteur existant
    // (on l’utilise aussi en "standard" pour l’instant → simple et efficace)
    const m = matchChefsForFastRequest(req, active);

    // 3) tri score
    const withScore = m
      .map(c => {
        const sc = auth.computeChefScore(c);
        return { chef: c, score: sc.score, badges: sc.badges };
      })
      .sort((a, b) => b.score - a.score);

    // 4) recherche
    const needle = q.trim().toLowerCase();
    const filtered = !needle
      ? withScore
      : withScore.filter(x => {
          const name = `${x.chef.firstName || ''} ${x.chef.lastName || ''}`.toLowerCase();
          const email = (x.chef.email || '').toLowerCase();
          return name.includes(needle) || email.includes(needle);
        });

    return filtered;
  }, [req, chefs, q]);

  if (loading) {
    return <div className="p-6 text-sm text-stone-500">Chargement…</div>;
  }

  if (!req) {
    return (
      <div className="p-6">
        <div className="text-sm text-stone-500">Demande introuvable.</div>
        <Link href="/admin/requests" className="text-sm underline">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/requests" className="text-sm text-stone-600 hover:text-stone-900">
            ← Retour aux demandes
          </Link>

          <h1 className="text-xl font-semibold mt-2">
            Demande {req.userType === 'b2b' ? 'B2B' : 'B2C'} — {req.location || 'Lieu'}
          </h1>

          <div className="text-sm text-stone-500 mt-1">
            {formatDates(req)} • {req.guestCount ?? '—'} pers • {formatBudget(req.budgetRange)}
            {req.mode === 'fast' ? ' • Fast' : ''}
          </div>
        </div>

        <button
          onClick={refresh}
          className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-stone-50"
        >
          Rafraîchir
        </button>
      </div>

      {/* 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fiche demande */}
        <div className="lg:col-span-1 border rounded-xl bg-white p-4">
          <div className="text-sm font-semibold">Fiche demande</div>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Client" value={req.contact?.company || req.contact?.name || '—'} />
            <Row label="Email" value={req.contact?.email || '—'} />
            <Row label="Téléphone" value={req.contact?.phone || '—'} />
            <Row label="Lieu" value={req.location || '—'} />
            <Row label="Pax" value={String(req.guestCount ?? '—')} />
            <Row label="Budget" value={formatBudget(req.budgetRange)} />
            <Row label="Type" value={String(req.missionType || '—')} />
            <Row label="Service" value={String(req.serviceLevel || '—')} />
            <Row label="Statut" value={String(req.status || '—')} />
          </div>

          {req.notes ? (
            <div className="mt-4">
              <div className="text-xs font-semibold text-stone-600">Notes</div>
              <div className="text-sm text-stone-700 mt-1 whitespace-pre-wrap">{req.notes}</div>
            </div>
          ) : null}
        </div>

        {/* Matching chefs */}
        <div className="lg:col-span-2 border rounded-xl bg-white overflow-hidden">
          <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Chefs matchables</div>
              <div className="text-xs text-stone-500 mt-0.5">
                Filtrés (actifs) + triés par score. (On branchera les filtres avancés ensuite.)
              </div>
            </div>

            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Recherche chef (nom/email)…"
              className="w-full md:w-[280px] px-3 py-2 rounded-lg border text-sm"
            />
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-3">Chef</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Badges</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {matched.map(x => (
                  <tr key={x.chef.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">
                        {(x.chef.firstName || '')} {(x.chef.lastName || '')}
                      </div>
                      <div className="text-xs text-stone-500">
                        {x.chef.profileCompleted ? 'Profil complet' : 'Profil incomplet'}
                      </div>
                    </td>

                    <td className="p-3">{x.chef.email || '—'}</td>

                    <td className="p-3">
                      <span className="font-semibold">{x.score}</span>
                      <span className="text-stone-400"> / 100</span>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {x.badges.length ? (
                          x.badges.map(b => (
                            <span key={b} className="text-xs px-2 py-1 rounded-full bg-stone-100">
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-stone-500">—</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      {/* IMPORTANT : ici on branchera l’action “Sélectionner / Créer mission”.
                         Pour l’instant, on met un bouton neutre pour ne pas casser ton build. */}
                      <button className="px-3 py-2 rounded-lg border text-sm hover:bg-stone-50">
                        Sélectionner (à brancher)
                      </button>
                    </td>
                  </tr>
                ))}

                {matched.length === 0 && (
                  <tr>
                    <td className="p-3 text-stone-500" colSpan={5}>
                      Aucun chef matchable (actifs) pour cette demande.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t text-xs text-stone-500">
            Prochaine étape : on branche “Sélectionner” → création mission + statut request.
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-stone-500">{label}</div>
      <div className="font-medium text-stone-900 text-right">{value}</div>
    </div>
  );
}

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
