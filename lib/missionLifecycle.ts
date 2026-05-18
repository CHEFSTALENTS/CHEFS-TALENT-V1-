// lib/missionLifecycle.ts
//
// Helpers de cycle de vie mission : phase auto basée sur les dates,
// validation contrats signés via signature_requests, alerte paiement chef
// en retard. Partagé entre routes API et composants UI.

export type MissionLifecyclePhase =
  | 'draft'         // pas encore active (offered / pending)
  | 'upcoming'      // confirmée, début dans le futur
  | 'in_progress'   // début passé, fin pas encore
  | 'completed'     // fin passée
  | 'cancelled';    // annulée / déclinée / expirée

export type SignatureRequestSlim = {
  kind: 'essai' | 'chef' | 'client' | 'ncc' | string;
  status: 'draft' | 'ongoing' | 'done' | 'declined' | 'expired' | 'cancelled' | 'error' | string;
};

export type MissionForLifecycle = {
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  cancelled_at?: string | null;
  chef_paid_at?: string | null;
  paid_at?: string | null;
};

/**
 * Calcule la phase auto d'une mission selon ses dates.
 * NB : si la mission est cancelled/declined/expired, on retourne 'cancelled'
 * (le statut DB prime sur la date).
 */
export function computeMissionLifecyclePhase(
  m: MissionForLifecycle,
  now: Date = new Date(),
): MissionLifecyclePhase {
  const status = String(m.status || '').toLowerCase();
  if (['cancelled', 'canceled', 'declined', 'expired'].includes(status)) {
    return 'cancelled';
  }

  // Pas encore confirmée → 'draft'
  if (['offered', 'pending', 'pitched'].includes(status)) {
    return 'draft';
  }

  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const start = m.start_date ? m.start_date.slice(0, 10) : null;
  const end = m.end_date ? m.end_date.slice(0, 10) : null;

  if (start && today < start) return 'upcoming';
  if (end && today > end) return 'completed';
  // start passé et fin pas encore → en cours
  // OU pas de date définie → on retombe sur le status DB (draft par défaut)
  if (start && today >= start) {
    if (!end || today <= end) return 'in_progress';
  }

  return 'draft';
}

/**
 * Détermine si le contrat est entièrement signé.
 *
 * Règle : tous les `signature_requests` de kind ∈ {'chef', 'client'} doivent
 * avoir `status='done'`. Les essais et NCC sont **exclus** (l'admin a dit que
 * l'essai ne compte pas comme contrat de mission).
 *
 * Au moins un contrat (chef OU client) doit exister sinon retourne false
 * (= pas encore envoyé).
 */
export function isContractFullySigned(
  signatureRequests: SignatureRequestSlim[],
): boolean {
  const missionContracts = signatureRequests.filter(
    (s) => s.kind === 'chef' || s.kind === 'client',
  );
  if (missionContracts.length === 0) return false;
  return missionContracts.every((s) => s.status === 'done');
}

/**
 * Liste les types de contrats encore non signés (pour affichage UI).
 * Retourne par exemple ['chef'] si seul le contrat chef reste à signer.
 */
export function pendingContractKinds(
  signatureRequests: SignatureRequestSlim[],
): Array<'chef' | 'client'> {
  const missionContracts = signatureRequests.filter(
    (s) => s.kind === 'chef' || s.kind === 'client',
  );
  // Groupe par kind, prend le statut le plus récent (signature_requests trié DESC)
  const byKind: Record<string, string> = {};
  for (const s of missionContracts) {
    if (!byKind[s.kind]) byKind[s.kind] = s.status;
  }
  const pending: Array<'chef' | 'client'> = [];
  for (const k of ['chef', 'client'] as const) {
    if (byKind[k] !== 'done') pending.push(k);
  }
  return pending;
}

/**
 * Mission terminée mais chef pas encore payé → affichage rouge.
 * Critère : phase='completed' ET chef_paid_at IS NULL.
 */
export function needsChefPaymentValidation(
  m: MissionForLifecycle,
  now: Date = new Date(),
): boolean {
  if (m.chef_paid_at) return false;
  const phase = computeMissionLifecyclePhase(m, now);
  return phase === 'completed';
}

/**
 * Labels traduits pour affichage UI.
 */
export const PHASE_LABELS: Record<MissionLifecyclePhase, string> = {
  draft: 'À confirmer',
  upcoming: 'À venir',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};
