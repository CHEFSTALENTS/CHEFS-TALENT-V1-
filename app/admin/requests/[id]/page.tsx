'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, auth } from '@/services/storage';
import type { ChefUser, RequestEntity } from '@/types';
import { matchChefsForFastRequest } from '@/services/fastMatch';

type MatchedChef = {
  chef: ChefUser;
  score: number;
  badges: string[];
};

export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<RequestEntity | null>(null);
  const [chefs, setChefs] = useState<ChefUser[]>([]);
  const [q, setQ] = useState('');
  const [selectingChefId, setSelectingChefId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const refresh = async () => {
    setError('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const matched: MatchedChef[] = useMemo(() => {
    if (!req) return [];

    // 1) chefs actifs uniquement
    const active = chefs.filter(c => c.role === 'chef' && c.status === 'active');

    // 2) matching via moteur existant
    const m = matchChefsForFastRequest(req, active);

    // 3) tri score
    const withScore = m
      .map(chef => {
        const sc = auth.computeChefScore(chef);
        return { chef, score: sc.score, badges: sc.badges };
      })
      .sort((a, b) => b.score - a.score);

    // 4) recherche
    const needle = q.trim().toLowerCase();
    if (!needle) return withScore;

    return withScore.filter(x => {
      const name = `${x.chef.firstName || ''} ${x.chef.lastName || ''}`.toLowerCase();
      const email = (x.chef.email || '').toLowerCase();
      return name.includes(needle) || email.includes(needle);
    });
  }, [req, chefs, q]);

  const onSelectChef = async (chefId: string) => {
    if (!req) return;

    setError('');

    const ok = confirm('Confirmer ce chef pour cette demande ?');
    if (!ok) return;

    try {
      setSelectingChefId(chefId);

      // 1) Créer mission (si dispo)
      if (typeof (api as any).createMission === 'function') {
        await (api as any).createMission({
          requestId: req.id,
          chefId,
          status: 'pending', // "pending" côté chef, puis "accepted/declined"
          location: req.location,
          guestCount: req.guestCount,
          missionType: req.missionType,
          startDate: req.dates?.start,
          endDate: req.dates?.end,
          serviceLevel: req.serviceLevel,
          budgetRange: req.budgetRange,
          createdFrom: 'admin_select',
        });
      }

      // 2) Mettre le statut de la request en assigned
      if (typeof (api as any).updateStatus === 'function') {
        await (api as any).updateStatus(req.id, 'assigned');
      }

      // 3) Optionnel : si tu as updateMissionStatus, tu peux gérer une mission déjà existante
      // (on le laissera plus tard)

      // 4) Refresh + redirect doux si tu veux
      await refresh();

      // Si tu veux rediriger vers Missions après sélection, décommente :
      // router.push('/admin/missions');
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Erreur lors de la sélection.');
    } finally {
      setSelectingChefId(null);
    }
  };

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
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <Link href="/admin/requests" className="text-sm text-stone-600 hover:text-stone-900">
              ← Retour aux demandes
            </Link>

            <h1 className="text-xl font-semibold mt-2 truncate">
              Demande {req.userType === 'b2b' ? 'B2B' : 'B2C'} — {req.location || 'Lieu'}
            </h1>

            <div className="text-sm text-stone-500 mt-1">
              {formatDates(req)} • {req.guestCount ?? '—'} pers • {formatBudget(req.budgetRange)}
              {req.mode === 'fast' ? ' • Fast' : ''}
            </div>

            {error ? (
              <div className="mt-2 text-sm text-red-600">{error}</div>
            ) : null}
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => router.push('/admin/missions')}
              className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-stone-50"
            >
              Voir missions
            </button>
            <button
              onClick={refresh}
              className="px-3 py-2 rounded-lg border text-sm bg-stone-900 text-white hover:bg-stone-800"
            >
              Rafraîchir
            </button>
          </div>
        </div>

        {/* Layout 12 colonnes */}
        <div className="grid grid-cols-12 gap-4">
          {/* Fiche demande */}
          <div className="col-span-12 lg:col-span-4 min-w-0">
            <div className="border rounded-xl bg-white p-4">
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
          </div>

          {/* Matching chefs */}
          <div className="col-span-12 lg:col-span-8 min-w-0">
            <div className="border rounded-xl bg-white overflow-hidden">
              <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Chefs matchables</div>
                  <div className="text-xs text-stone-500 mt-0.5 truncate">
                    Actifs uniquement • tri score • recherche simple (MVP).
                  </div>
                </div>

                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Rechercher (nom/email)…"
                  className="w-full md:w-[320px] px-3 py-2 rounded-lg border text-sm"
                />
              </div>

              <div className="p-4">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-[820px] w-full text-sm">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="text-left p-3">Chef</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3 w-[130px]">Score</th>
                        <th className="text-left p-3">Badges</th>
                        <th className="text-right p-3 w-[190px]">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {matched.map(x => (
                        <tr key={x.chef.id} className="border-t">
                          <td className="p-3 min-w-0">
                            <div className="font-medium truncate">
                              {(x.chef.firstName || '')} {(x.chef.lastName || '')}
                            </div>
                            <div className="text-xs text-stone-500 truncate">
                              {x.chef.profileCompleted ? 'Profil complet' : 'Profil incomplet'}
                            </div>
                          </td>

                          <td className="p-3 min-w-0">
                            <div className="truncate">{x.chef.email || '—'}</div>
                          </td>

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

                          <td className="p-3 text-right">
                            <button
                              onClick={() => onSelectChef(x.chef.id)}
                              disabled={selectingChefId === x.chef.id}
                              className="px-3 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
                            >
                              {selectingChefId === x.chef.id ? 'Sélection…' : 'Sélectionner'}
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

                <div className="mt-3 text-xs text-stone-500">
                  Sélection = création mission + request en <span className="font-semibold">assigned</span>.
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* end grid */}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-stone-500">{label}</div>
      <div className="font-medium text-stone-900 text-right truncate max-w-[60%]">
        {value}
      </div>
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
