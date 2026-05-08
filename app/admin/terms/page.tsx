'use client';

import React, { useEffect, useState } from 'react';

const ADMIN_EMAIL = 'thomas@chef-talents.com';

type Acceptance = {
  user_id: string;
  email: string | null;
  name: string | null;
  status: string | null;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsAcceptedVersion: string | null;
};

type ApiResponse = {
  ok: boolean;
  currentVersion: string;
  totals: {
    activeChefs: number;
    accepted: number;
    acceptedCurrent: number;
    pending: number;
  };
  acceptances: Acceptance[];
};

export default function AdminTermsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/terms/audit', {
          cache: 'no-store',
          headers: { 'x-admin-email': ADMIN_EMAIL },
        });
        const json = (await res.json()) as ApiResponse;
        if (!alive) return;
        if (!res.ok || !json.ok) {
          setErr('Lecture impossible.');
          return;
        }
        setData(json);
      } catch (e: any) {
        setErr(e?.message || 'Erreur réseau.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Conditions de collaboration — Chefs</h1>
          <p className="text-white/60 text-sm mt-1">
            Suivi des acceptations en base et version active du document.
          </p>
        </div>

        {/* Source de vérité */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <p className="text-xs uppercase tracking-widest text-white/50">Source de vérité</p>
          <p className="text-sm text-white/80 leading-relaxed">
            Le contenu des CGU chef est versionné dans le code source du site, dans le fichier
            <code className="mx-1 rounded bg-white/10 px-2 py-0.5 font-mono text-xs">
              app/chef/terms/terms-client.tsx
            </code>
            (constante <code className="font-mono text-xs">CURRENT_TERMS_VERSION</code>).
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            Pour publier une nouvelle version : modifier le contenu et bumper la constante
            <code className="mx-1 rounded bg-white/10 px-2 py-0.5 font-mono text-xs">CURRENT_TERMS_VERSION</code>.
            Les chefs verront un écran d'acceptation forcée à leur prochaine connexion.
          </p>
          {data && (
            <p className="text-sm">
              <span className="text-white/50">Version active :</span>{' '}
              <span className="font-mono text-white">{data.currentVersion}</span>
            </p>
          )}
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Chefs actifs" value={data.totals.activeChefs} />
            <Stat label="Ont déjà accepté (toutes versions)" value={data.totals.accepted} />
            <Stat label="Acceptent la version courante" value={data.totals.acceptedCurrent} highlight />
            <Stat label="En attente d'acceptation" value={data.totals.pending} warn={data.totals.pending > 0} />
          </div>
        )}

        {/* Tableau des acceptations */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-white/50">Acceptations enregistrées</p>
            {loading && <p className="text-xs text-white/40">Chargement…</p>}
          </div>
          {err ? (
            <div className="p-5 text-sm text-red-400">{err}</div>
          ) : data && data.acceptances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-white/50 text-xs uppercase tracking-widest">
                  <tr>
                    <th className="text-left px-5 py-3 font-normal">Chef</th>
                    <th className="text-left px-5 py-3 font-normal">Statut</th>
                    <th className="text-left px-5 py-3 font-normal">Version acceptée</th>
                    <th className="text-left px-5 py-3 font-normal">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.acceptances.map((row) => {
                    const onCurrent = row.termsAcceptedVersion === data.currentVersion;
                    return (
                      <tr key={row.user_id} className="border-t border-white/5">
                        <td className="px-5 py-3">
                          <div className="text-white">{row.name || '—'}</div>
                          <div className="text-xs text-white/40">{row.email || '—'}</div>
                        </td>
                        <td className="px-5 py-3 text-white/70">{row.status || '—'}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`font-mono text-xs px-2 py-0.5 rounded ${
                              onCurrent ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                            }`}
                          >
                            {row.termsAcceptedVersion || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-white/70">
                          {row.termsAcceptedAt
                            ? new Date(row.termsAcceptedAt).toLocaleString('fr-FR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : !loading ? (
            <div className="p-5 text-sm text-white/50">Aucune acceptation enregistrée.</div>
          ) : null}
        </div>

        {/* Note */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs uppercase tracking-widest text-amber-300/80 mb-2">Note légale</p>
          <p className="text-sm text-white/80 leading-relaxed">
            La preuve d'acceptation est aujourd'hui stockée dans <code className="font-mono text-xs">chef_profiles.profile</code>{' '}
            (champs <code className="font-mono text-xs">termsAccepted</code>, <code className="font-mono text-xs">termsAcceptedAt</code>,{' '}
            <code className="font-mono text-xs">termsAcceptedVersion</code>). Une table d'audit dédiée
            <code className="font-mono text-xs"> chef_terms_acceptances</code> est en cours de mise en place pour renforcer la
            traçabilité juridique (immuabilité, journal d'événements). En attendant, ne supprimez jamais ces champs sur un profil chef.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, warn }: { label: string; value: number; highlight?: boolean; warn?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? 'border-emerald-500/30 bg-emerald-500/5' : warn ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-white/50">{label}</p>
      <p className={`text-3xl font-semibold mt-2 ${highlight ? 'text-emerald-300' : warn ? 'text-amber-300' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
