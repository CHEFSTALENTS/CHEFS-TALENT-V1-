-- Migration : workflow complet sur les devis + documents + devis externes
--
-- Objectif :
-- 1. Permettre à Thomas de gérer dans /admin/quotes le workflow complet :
--    - changer le statut (sent / accepted / declined / expired / cancelled)
--    - capturer la date personnalisée + motif + montant final négocié
-- 2. Stocker des documents libres par devis (échanges, contre-propositions,
--    devis signés en retour, brief sur-mesure, etc.)
-- 3. Permettre l'import de devis traités hors plateforme (Word, devis
--    téléphone, anciens devis manuels) pour les tracker dans les KPIs.
--
-- Aucune donnée existante n'est altérée (toutes les nouvelles colonnes
-- ont un default + sont nullable, sauf is_external qui est false).
--
-- 2026-06-10

-- ─── 1. Colonnes workflow + montant final négocié sur quotes ─────
alter table public.quotes
  add column if not exists declined_at        timestamptz,
  add column if not exists expired_at         timestamptz,
  add column if not exists cancelled_at       timestamptz,
  add column if not exists status_reason      text,
  add column if not exists final_amount_ht_eur  numeric(12, 2),
  add column if not exists final_amount_ttc_eur numeric(12, 2),
  add column if not exists is_external          boolean not null default false,
  add column if not exists external_origin      text;

comment on column public.quotes.status_reason is
  'Motif libre du changement de statut (raison du refus, contexte de la négo, etc.)';
comment on column public.quotes.final_amount_ht_eur is
  'Montant HT final NÉGOCIÉ — peut différer de la moyenne des tariff_options. Utilisé pour les KPIs CA gagné.';
comment on column public.quotes.final_amount_ttc_eur is
  'Montant TTC final NÉGOCIÉ — peut différer de la moyenne des tariff_options.';
comment on column public.quotes.is_external is
  'true = devis traité hors plateforme (importé pour tracking KPI seulement, pas de PDF généré)';
comment on column public.quotes.external_origin is
  'Pour les devis externes : origine (téléphone, email, ancien Word, conciergerie X, etc.)';

-- ─── 2. Table quote_documents (échanges & pièces jointes) ────────
create table if not exists public.quote_documents (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references public.quotes(id) on delete cascade,
  kind            text not null default 'other'
                  check (kind in ('signed', 'external', 'exchange', 'brief', 'contract', 'other')),
  file_name       text not null,
  file_path       text not null,         -- path dans Supabase Storage
  file_url        text,                  -- public URL (si applicable)
  file_size       bigint,
  mime_type       text,
  description     text,                  -- note libre Thomas
  uploaded_by_admin_email text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_quote_documents_quote_id
  on public.quote_documents(quote_id);
create index if not exists idx_quote_documents_kind
  on public.quote_documents(kind);

comment on table public.quote_documents is
  'Pièces jointes libres par devis : devis signés en retour, contre-propositions client, briefs sur-mesure, échanges, etc.';
comment on column public.quote_documents.kind is
  'signed=devis signé en retour ; external=devis externe d''origine ; exchange=email/échange client ; brief=brief sur-mesure ; contract=contrat lié ; other';

-- ─── 3. Le status 'draft' peut être omis pour les devis externes ─
-- (un devis externe arrive souvent directement en 'sent' ou 'accepted')
-- Pas de modification du CHECK status — il accepte déjà tous les états.
