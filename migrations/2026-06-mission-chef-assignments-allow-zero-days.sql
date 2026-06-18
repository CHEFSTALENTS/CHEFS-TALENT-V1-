-- Migration : autoriser days_worked = 0 sur mission_chef_assignments
--
-- Contexte : avec le swap chef "pré-démarrage" (mission pas encore
-- commencée), l'ancien chef a 0 jour travaillé / 0€. La contrainte
-- originale `check (days_worked > 0)` bloquait ce cas, faisant échouer
-- l'INSERT avec « violates check constraint mission_chef_assignments_days_worked_check ».
--
-- On relâche à `days_worked >= 0`. Le montant 0€ reste valide.
--
-- Idempotent : drop puis recrée la contrainte.
-- 2026-06-15

do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.mission_chef_assignments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%days_worked%'
  loop
    execute format('alter table public.mission_chef_assignments drop constraint %I', c.conname);
    raise notice 'Dropped constraint % on mission_chef_assignments', c.conname;
  end loop;
end $$;

alter table public.mission_chef_assignments
  add constraint mission_chef_assignments_days_worked_check
  check (days_worked >= 0);

notify pgrst, 'reload schema';
