-- ============================================================
-- Migration : table request_drafts
-- Sauvegarde des demandes /request en cours pour permettre au
-- visiteur de reprendre plus tard via un lien email.
-- À exécuter UNE FOIS dans Supabase Dashboard > SQL Editor.
-- ============================================================
--
-- Pourquoi : Thomas a 0 lead via /request et va relancer des ads.
-- Pour ne pas perdre les visiteurs qui abandonnent au milieu du
-- formulaire (10 étapes), on leur propose de sauvegarder leur
-- progression. Ils reçoivent un email avec un lien de reprise.
--
-- Workflow :
--   1. Le visiteur commence le form
--   2. À partir de l'étape 2, exit intent modal propose de sauvegarder
--   3. Ou bouton optionnel à partir étape 5
--   4. Email Resend envoyé avec lien /request?draft=<token>
--   5. Le visiteur clique → state restauré → reprend où il était
--
-- Sécurité :
--   - Token URL-safe, unique, non-devinable (gen_random_uuid())
--   - Pas d'auth requise pour GET (l'URL avec token = preuve de
--     possession, comme un magic link)
--   - RLS activée : seul service-role peut lire (les routes API
--     fonctionnent côté serveur)
-- ============================================================

create table if not exists request_drafts (
  id uuid primary key default gen_random_uuid(),

  -- Token de reprise : utilisé dans l'URL /request?draft=<token>
  -- Non-devinable (UUID v4), unique pour éviter les collisions.
  token text unique not null default replace(gen_random_uuid()::text, '-', ''),

  -- Identité minimale du visiteur
  email text not null,
  lang text,

  -- Snapshot complet du WizardState au moment du save (JSON brut)
  state jsonb not null,
  -- Dernière étape atteinte (pour stats et debug)
  last_step int,

  -- Tracking
  reminder_sent_at timestamptz,
  resumed_at timestamptz,
  converted_at timestamptz,  -- si le visiteur a finalement soumis

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes utiles
create index if not exists request_drafts_email_idx
  on request_drafts (email);

create index if not exists request_drafts_token_idx
  on request_drafts (token);

create index if not exists request_drafts_resumed_idx
  on request_drafts (resumed_at)
  where resumed_at is null;

-- RLS : service-role uniquement (pas d'accès anon ni authenticated)
alter table request_drafts enable row level security;

-- Trigger updated_at
drop trigger if exists request_drafts_set_updated_at on request_drafts;
create trigger request_drafts_set_updated_at
  before update on request_drafts
  for each row execute function set_updated_at();
