-- ============================================================
-- Migration : ajout du tracking de signature contrat
-- À exécuter UNE FOIS dans Supabase Dashboard > SQL Editor.
-- ============================================================
--
-- Pourquoi : la table missions a déjà contract_url (lien Drive/YouSign).
-- Mais on ne sait pas si le chef ET le client ont signé. Pour le suivi
-- back-office, l'admin doit pouvoir marquer manuellement le contrat
-- comme signé une fois validé par les 2 parties (avant intégration
-- YouSign automatique).
--
-- Workflow :
--   1. Admin ajoute contract_url (lien Drive)
--   2. Chef + client signent (workflow externe)
--   3. Admin clique « Marquer contrat signé » sur /admin/missions/[id]
--      → contract_signed_at = NOW()
--   4. Bouton « Annuler signature » disponible si erreur
-- ============================================================

alter table missions
  add column if not exists contract_signed_at timestamptz;

-- Index utile pour filtrer rapidement les missions sans contrat signé
create index if not exists missions_contract_signed_idx
  on missions (contract_signed_at)
  where contract_signed_at is null;
