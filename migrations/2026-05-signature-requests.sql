-- Table signature_requests
-- Suivi des demandes de signature électronique YouSign pour :
--   - Contrats mission (essai / chef / client)  →  target_kind = 'mission'
--   - NCC ad-hoc concierge                       →  target_kind = 'adhoc'
--   - NCC liés à une proposal existante          →  target_kind = 'proposal'
--
-- Le webhook YouSign /api/webhooks/yousign met à jour yousign_status et
-- completed_at quand le doc est signé par tous, et stocke le PDF signé dans
-- Supabase Storage bucket signed-contracts (privé) — signed_pdf_url contient
-- alors un path bucket relatif.

create extension if not exists "pgcrypto";

create table if not exists public.signature_requests (
  id                  uuid primary key default gen_random_uuid(),
  kind                text not null check (kind in ('essai', 'chef', 'client', 'ncc')),
  target_kind         text not null check (target_kind in ('mission', 'proposal', 'adhoc')),
  target_id           uuid,                   -- nullable pour 'adhoc'

  yousign_request_id  text unique,            -- id YouSign de la signature request
  yousign_status      text not null default 'draft'
                      check (yousign_status in ('draft', 'ongoing', 'done', 'declined', 'expired', 'cancelled', 'error')),

  -- Snapshot des signataires (nom, email, role) au moment de la création
  -- ex: [{ "name": "Lucas Uchoa", "email": "lucas@x.com", "role": "chef" }, …]
  signers             jsonb not null default '[]'::jsonb,

  -- Snapshot du payload contractuel au moment de l'envoi (pour traçabilité,
  -- même si le contrat est modifié ensuite dans missions.contracts_data)
  contract_snapshot   jsonb,

  -- Lien Supabase Storage (bucket signed-contracts) vers le PDF final signé
  signed_pdf_url      text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  sent_at             timestamptz,            -- quand on a appelé activate()
  completed_at        timestamptz,            -- quand tous les signataires ont signé
  error_message       text                    -- message d'erreur si yousign_status='error'
);

create index if not exists idx_signature_requests_yousign_id
  on public.signature_requests (yousign_request_id);

create index if not exists idx_signature_requests_target
  on public.signature_requests (target_kind, target_id);

create index if not exists idx_signature_requests_kind_status
  on public.signature_requests (kind, yousign_status);

-- updated_at auto-bump
create or replace function public.set_signature_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_signature_requests_updated_at on public.signature_requests;
create trigger trg_signature_requests_updated_at
  before update on public.signature_requests
  for each row execute function public.set_signature_requests_updated_at();

-- RLS : aucune RLS publique. Toutes les opérations passent par les routes
-- admin (service_role) et le webhook YouSign (service_role également).
alter table public.signature_requests enable row level security;

-- Pas de policies → table inaccessible côté client (souhaité).

comment on table  public.signature_requests is
  'Demandes de signature électronique YouSign pour contrats mission et NCC concierge';
comment on column public.signature_requests.target_kind is
  'mission = lié à missions.id | proposal = lié à mission_proposals.id | adhoc = NCC sans rattachement';
comment on column public.signature_requests.contract_snapshot is
  'Snapshot JSONB du payload contractuel (essai/chef/client/ncc) au moment de l''envoi';
