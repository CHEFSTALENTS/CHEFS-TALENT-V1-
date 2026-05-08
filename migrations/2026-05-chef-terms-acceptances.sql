-- ============================================================
-- Migration : table chef_terms_acceptances (audit log immuable)
-- À exécuter UNE FOIS dans Supabase Dashboard > SQL Editor
-- (https://supabase.com/dashboard → projet → SQL Editor → New query)
-- Colle le contenu, clic "Run". Si "table already exists" : ignore, c'est OK.
--
-- Objectif :
-- Stocker un journal d'événements immuable de chaque acceptation des CGU
-- chef. Aujourd'hui, l'acceptation est patchée dans chef_profiles.profile
-- (champs JSON termsAccepted, termsAcceptedAt, termsAcceptedVersion).
-- Cette donnée est mutable (n'importe quelle écriture sur le profile peut
-- l'écraser) et donc faible en valeur probante.
--
-- Cette table ajoute un audit log dédié, une ligne par acceptation, qui
-- ne sera jamais modifié ou supprimé : append-only.
-- ============================================================

-- 1) Table audit log
create table if not exists chef_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  version text not null,
  accepted_at timestamptz not null default now(),
  ip text,
  user_agent text,
  -- Métadonnées additionnelles éventuelles (locale, device, etc.)
  meta jsonb not null default '{}'::jsonb
);

-- 2) Index pour les requêtes fréquentes
create index if not exists chef_terms_acceptances_user_idx
  on chef_terms_acceptances (user_id, accepted_at desc);

create index if not exists chef_terms_acceptances_version_idx
  on chef_terms_acceptances (version, accepted_at desc);

-- 3) Politique RLS : table accessible uniquement via service-role key
-- (les chefs et clients n'ont aucune raison d'y accéder en lecture directe)
alter table chef_terms_acceptances enable row level security;

-- Aucune policy publique : seul le service-role peut lire/écrire.

-- 4) Empêcher les UPDATE et DELETE même en service-role (append-only effectif)
-- Note : la service-role key bypasse normalement les policies, donc on ne peut
-- pas garantir l'immuabilité absolue côté Postgres. Pour une vraie
-- immuabilité, il faudrait soit un trigger qui rejette UPDATE/DELETE, soit
-- un compte applicatif distinct sans ces droits. On met le trigger pour
-- forcer l'append-only même par accident.
create or replace function chef_terms_acceptances_immutable()
returns trigger as $$
begin
  raise exception 'chef_terms_acceptances is append-only — UPDATE/DELETE forbidden';
end;
$$ language plpgsql;

drop trigger if exists chef_terms_acceptances_no_update on chef_terms_acceptances;
create trigger chef_terms_acceptances_no_update
  before update on chef_terms_acceptances
  for each row
  execute function chef_terms_acceptances_immutable();

drop trigger if exists chef_terms_acceptances_no_delete on chef_terms_acceptances;
create trigger chef_terms_acceptances_no_delete
  before delete on chef_terms_acceptances
  for each row
  execute function chef_terms_acceptances_immutable();

-- 5) Commentaires de table pour le futur
comment on table chef_terms_acceptances is
  'Audit log immuable des acceptations des CGU chef. Append-only. Une ligne par événement d''acceptation.';
comment on column chef_terms_acceptances.user_id is 'auth.users.id du chef ayant accepté';
comment on column chef_terms_acceptances.email is 'Email du chef au moment de l''acceptation (snapshot)';
comment on column chef_terms_acceptances.version is 'Version textuelle des CGU acceptée (ex: 08/05/2026)';
comment on column chef_terms_acceptances.accepted_at is 'Horodatage UTC de l''acceptation';
comment on column chef_terms_acceptances.ip is 'Adresse IP de l''acceptation, à des fins probatoires';
comment on column chef_terms_acceptances.user_agent is 'User-Agent du navigateur, à des fins probatoires';
