-- Migration : ajoute le statut 'pitched' au workflow des demandes
--
-- Workflow demandes client :
--   new       → demande entrée, non encore traitée
--   in_review → message de qualification envoyé au client
--   pitched   → chefs présentés au client (en attente de sa décision)  ← NOUVEAU
--   assigned  → mission confirmée (chef accepté + contrat)
--   declined  → demande refusée / client n'a pas donné suite
--   closed    → mission terminée
--
-- L'objectif : distinguer visuellement "j'ai pris contact" (in_review)
-- de "j'ai proposé des chefs" (pitched) pour que Thomas voit dans le
-- dashboard ce qui attend SA action vs ce qui attend la réponse client.
--
-- 2026-06-15

-- Si une contrainte CHECK existe déjà, on la drop pour ajouter la nouvelle.
-- Le nom par défaut est généré par Postgres ; on cherche les contraintes
-- check qui contiennent 'status' sur client_requests.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.client_requests'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.client_requests drop constraint %I', c.conname);
  end loop;
end$$;

-- Nouvelle contrainte avec 'pitched' inclus
alter table public.client_requests
  add constraint client_requests_status_check
  check (status in (
    'new',
    'in_review',
    'pitched',
    'assigned',
    'declined',
    'closed'
  ));

comment on column public.client_requests.status is
  'new → in_review (qualifié) → pitched (chefs présentés) → assigned (confirmée) → closed/declined';
