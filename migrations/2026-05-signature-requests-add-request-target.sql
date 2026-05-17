-- Étend signature_requests.target_kind pour accepter les NCC envoyés
-- depuis /admin/requests/[id] (target_kind='request', target_id=request.id).
--
-- Liste finale : 'mission' | 'proposal' | 'request' | 'adhoc'

alter table public.signature_requests
  drop constraint if exists signature_requests_target_kind_check;

alter table public.signature_requests
  add constraint signature_requests_target_kind_check
  check (target_kind in ('mission', 'proposal', 'request', 'adhoc'));

comment on column public.signature_requests.target_kind is
  'mission = lié à missions.id | proposal = lié à mission_proposals.id | request = lié à client_requests.id (NCC concierge) | adhoc = sans rattachement';
