-- ============================================================
-- Migration : tracking du paiement des missions
-- À exécuter UNE FOIS dans Supabase Dashboard > SQL Editor.
-- ============================================================
--
-- Pourquoi : aujourd'hui le KPI « CA mois » sur /admin compte les
-- missions confirmées (via confirmed_at). Mais une mission confirmée
-- ne signifie pas qu'elle a été payée. Pour avoir une vue précise
-- du chiffre encaissé vs facturé, on ajoute un suivi dédié.
--
-- Workflow :
--   confirmed → admin marque payée → status_payment='paid' + paid_at
--   → la mission apparaît dans le KPI « Payées ce mois »
--
-- Champs ajoutés :
--   - payment_status : 'pending' (default) | 'paid' | 'partial' | 'refunded'
--   - paid_at : moment du marquage payée
--   - paid_amount : montant réellement encaissé chef (peut différer du
--     chef_amount initial en cas de remise / remboursement)
--   - payment_method : 'sepa' | 'stripe' | 'cash' | 'wire' | autre
--   - payment_reference : ID Stripe, ref SEPA, etc.
-- ============================================================

alter table missions
  add column if not exists payment_status text
    default 'pending'
    check (payment_status in ('pending', 'paid', 'partial', 'refunded'));

alter table missions
  add column if not exists paid_at timestamptz;

alter table missions
  add column if not exists paid_amount numeric;

alter table missions
  add column if not exists payment_method text;

alter table missions
  add column if not exists payment_reference text;

-- Index pour les requêtes fréquentes :
--   - Dashboard admin : SELECT WHERE payment_status='paid' AND paid_at >= ...
--   - Listing /admin/missions : filtre par bucket paiement
create index if not exists missions_payment_status_paid_at_idx
  on missions (payment_status, paid_at desc);

-- Backfill : les missions existantes restent en 'pending' (default).
-- Les missions confirmées avant cette migration ne sont pas considérées
-- comme payées tant qu'on ne les a pas marquées explicitement.
