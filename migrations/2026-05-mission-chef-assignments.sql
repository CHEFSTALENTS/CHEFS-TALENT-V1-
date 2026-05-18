-- Table mission_chef_assignments
-- Trace l'historique des chefs assignés à une mission (cas remplacement
-- en cours de mission : chef malade, indisponible, etc.).
--
-- Convention : on NE crée PAS d'assignment tant qu'il n'y a pas eu de
-- remplacement. Tant qu'il n'y a qu'un seul chef = `missions.chef_id` direct.
-- Au moment du PREMIER remplacement, on crée 2 rows :
--   - une pour l'ancien chef (status='replaced') avec ses jours travaillés
--     et son montant calculé au prorata
--   - une pour le nouveau chef (status='active') avec ses jours restants
--     et son montant calculé au prorata
-- Le total reste égal à missions.chef_amount (redistribution, pas inflation).

create extension if not exists "pgcrypto";

create table if not exists public.mission_chef_assignments (
  id              uuid primary key default gen_random_uuid(),
  mission_id      uuid not null references public.missions(id) on delete cascade,

  -- Chef assigné sur cette période
  chef_id         text not null,            -- même type que missions.chef_id
  chef_name       text,
  chef_email      text,

  -- Période de cette assignment
  start_date      date not null,
  end_date        date not null,            -- inclusive (dernier jour travaillé)

  -- Split tarifaire pour cette période (prorata du nb de jours)
  days_worked     integer not null check (days_worked > 0),
  daily_rate_eur  numeric(10, 2) not null check (daily_rate_eur >= 0),
  chef_amount_eur numeric(10, 2) not null check (chef_amount_eur >= 0),

  -- Statut de l'assignment
  --   'active'    = chef actuellement en mission
  --   'replaced'  = remplacé en cours par un nouveau chef
  --   'completed' = la mission est terminée pour ce chef
  status          text not null default 'active'
                  check (status in ('active', 'replaced', 'completed')),

  -- Si l'assignment a été interrompue, raison du remplacement
  replacement_reason text,

  -- Lien vers l'assignment qui a remplacé celle-ci (nullable)
  replaced_by_assignment_id uuid references public.mission_chef_assignments(id) on delete set null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_mission_chef_assignments_mission_id
  on public.mission_chef_assignments (mission_id);
create index if not exists idx_mission_chef_assignments_chef_id
  on public.mission_chef_assignments (chef_id);
create index if not exists idx_mission_chef_assignments_status
  on public.mission_chef_assignments (status);

-- updated_at auto-bump
create or replace function public.set_mission_chef_assignments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_mission_chef_assignments_updated_at on public.mission_chef_assignments;
create trigger trg_mission_chef_assignments_updated_at
  before update on public.mission_chef_assignments
  for each row execute function public.set_mission_chef_assignments_updated_at();

-- RLS : aucune policy publique. Accès via service_role uniquement.
alter table public.mission_chef_assignments enable row level security;

comment on table public.mission_chef_assignments is
  'Historique des chefs assignés à une mission. Crée au premier remplacement.';
comment on column public.mission_chef_assignments.chef_amount_eur is
  'Rémunération chef pour cette période, calculée au prorata des jours travaillés';
