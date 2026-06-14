-- Fix : la contrainte partners_type_check existante a un enum différent
-- de celui attendu par le code (et le backfill INSERT type='concierge'
-- échoue avec "violates check constraint").
--
-- On drop la contrainte existante (peu importe son contenu actuel) et
-- on la recrée avec l'enum officiel.
--
-- 100% idempotent.

-- Cherche et drop toutes les check constraints sur partners.type
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.partners'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.partners drop constraint %I', c.conname);
    raise notice 'Dropped constraint % on partners', c.conname;
  end loop;
end $$;

-- Recrée la contrainte avec l'enum officiel
alter table public.partners
  add constraint partners_type_check
  check (type in (
    'concierge', 'villa_manager', 'yacht_manager', 'travel_planner',
    'apporteur_indep', 'chef', 'client_direct', 'other'
  ));

-- Idem pour status (au cas où)
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.partners'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.partners drop constraint %I', c.conname);
    raise notice 'Dropped constraint % on partners', c.conname;
  end loop;
end $$;

alter table public.partners
  add constraint partners_status_check
  check (status in ('active', 'dormant', 'archived'));

-- Force refresh cache
notify pgrst, 'reload schema';
