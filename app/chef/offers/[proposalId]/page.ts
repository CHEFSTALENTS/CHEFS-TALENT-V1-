'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, auth } from '@/services/storage';
import type { RequestEntity } from '@/types';

export default function ChefOfferDetailsPage() {
  const router = useRouter();
  const params = useParams<{ proposalId: string }>();
  const proposalId = params?.proposalId;

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<RequestEntity | null>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useMemo(() => auth.getCurrentUser(), []);

  useEffect(() => {
    const run = async () => {
      try {
        if (!proposalId) return;

        const p = await api.getProposal(proposalId);
        if (!p) {
          setError('Proposition introuvable.');
          setLoading(false);
          return;
        }

        // sécurité simple : un chef ne doit voir que ses offres
        if (user?.id && p.chefId !== user.id) {
          setError("Accès refusé.");
          setLoading(false);
          return;
        }

        const r = await api.getRequest(p.requestId);
        if (!r) {
          setError("Request introuvable.");
          setLoading(false);
          return;
        }

        setProposal(p);
        setReq(r);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Erreur de chargement.");
        setLoading(false);
      }
    };

    run();
  }, [proposalId, user?.id]);

  const proximityLabel = useMemo(() => {
    if (!user?.profile || !req) return 'Proximité: inconnue';
    const base = user.profile.baseCity;
    const zones = user.profile.coverageZones || [];

    if (base && base === req.location) return 'Proximité: sur place';
    if (zones.includes(req.location)) return 'Proximité: zone couverte';
    return 'Proximité: à confirmer';
  }, [user?.profile, req]);

  const accept = async () => {
    if (!req || !proposal) return;
    try {
      await api.selectProposal(req.id, proposal.id);
      router.push('/chef/missions'); // adapte si ton chemin est différent
    } catch (e: any) {
      if (String(e?.message).includes('REQUEST_ALREADY_ASSIGNED')) {
        alert("Trop tard — cette mission a déjà été acceptée par un autre chef.");
      } else {
        alert("Erreur lors de l’acceptation.");
      }
    }
  };

  const decline = async () => {
    // V1 simple: on décline juste cette proposal
    // (si tu veux, je te rajoute api.declineProposal pour être propre)
    alert("OK — à faire : décliner proprement (je te le code juste après).");
  };

  if (loading) return <p>Chargement…</p>;
  if (error) return <p>{error}</p>;
  if (!req || !proposal) return <p>Introuvable.</p>;

  return (
    <div className="space-y-6">
      <button className="underline" onClick={() => router.back()}>
        ← Retour
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Détails de la proposition</h1>
          <p className="text-sm text-gray-500">{proximityLabel}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Statut</div>
          <div className="px-2 py-1 rounded bg-gray-100 inline-block text-sm">
            {proposal.status}
          </div>
        </div>
      </div>

      <div className="border rounded p-4 bg-white">
        <h2 className="font-semibold mb-2">Résumé</h2>
        <p><b>Lieu:</b> {req.location}</p>
        <p><b>Date:</b> {req.dates.start}{req.dates.end ? ` → ${req.dates.end}` : ''}</p>
        <p><b>Convives:</b> {req.guestCount}</p>
        <p><b>Mission:</b> {req.missionType}</p>
        <p><b>Service:</b> {req.serviceLevel}</p>
        <p><b>Budget:</b> {req.budgetRange ?? '-'}</p>
      </div>

      <div className="border rounded p-4 bg-white">
        <h2 className="font-semibold mb-2">Préférences</h2>
        <p><b>Cuisine:</b> {req.preferences?.cuisine ?? '-'}</p>
        <p><b>Allergies:</b> {req.preferences?.allergies ?? '-'}</p>
        <p><b>Langue:</b> {req.preferences?.languages ?? '-'}</p>
      </div>

      <div className="border rounded p-4 bg-white">
        <h2 className="font-semibold mb-2">Notes / Commentaires</h2>
        <p className="whitespace-pre-wrap text-gray-700">{req.notes || '-'}</p>
      </div>

      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded bg-black text-white"
          onClick={accept}
        >
          Accepter
        </button>
        <button
          className="px-4 py-2 rounded border"
          onClick={decline}
        >
          Refuser
        </button>
      </div>
    </div>
  );
}
