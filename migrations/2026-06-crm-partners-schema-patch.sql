-- Patch CRM partners — comble les colonnes manquantes
--
-- Si tu as passé une 1re version de la migration partners avant que je
-- n'écrive le fichier officiel, certaines colonnes peuvent manquer.
-- CREATE TABLE IF NOT EXISTS ne modifie PAS une table existante — donc
-- ce patch fait des ALTER TABLE ADD COLUMN IF NOT EXISTS pour combler.
--
-- 100% idempotent. Peut être passé plusieurs fois.
--
-- 2026-06-15

-- ─── partners : colonnes manquantes ──────────────────────────
alter table public.partners
  add column if not exists destinations         text[],
  add column if not exists contact_first_name   text,
  add column if not exists contact_last_name    text,
  add column if not exists email                text,
  add column if not exists phone                text,
  add column if not exists whatsapp             text,
  add column if not exists company              text,
  add column if not exists notes                text,
  add column if not exists first_contact_at     timestamptz default now(),
  add column if not exists last_contact_at      timestamptz,
  add column if not exists acquisition_source   text,
  add column if not exists language             text,
  add column if not exists linked_chef_email    text,
  add column if not exists created_at           timestamptz not null default now(),
  add column if not exists updated_at           timestamptz not null default now(),
  add column if not exists created_by_admin_email text;

-- Le `status` peut exister sans le CHECK — on tente de l'ajouter, on
-- ignore si déjà présent.
do $$
begin
  alter table public.partners
    add constraint partners_status_check
    check (status in ('active', 'dormant', 'archived'));
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter table public.partners
    add constraint partners_type_check
    check (type in (
      'concierge', 'villa_manager', 'yacht_manager', 'travel_planner',
      'apporteur_indep', 'chef', 'client_direct', 'other'
    ));
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- Index (idempotents)
create index if not exists idx_partners_status on public.partners(status);
create index if not exists idx_partners_type on public.partners(type);
create index if not exists idx_partners_last_contact_at on public.partners(last_contact_at);
create index if not exists idx_partners_destinations on public.partners using gin(destinations);

-- ─── partner_interactions : colonnes manquantes ──────────────
alter table public.partner_interactions
  add column if not exists occurred_at         timestamptz,
  add column if not exists summary             text,
  add column if not exists related_mission_id  uuid,
  add column if not exists related_quote_id    uuid,
  add column if not exists created_at          timestamptz not null default now(),
  add column if not exists created_by_admin_email text;

create index if not exists idx_partner_interactions_partner_id on public.partner_interactions(partner_id);
create index if not exists idx_partner_interactions_occurred_at on public.partner_interactions(occurred_at desc);

-- ─── missions / quotes : partner_id + source ─────────────────
alter table public.missions
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists source     text;

do $$
begin
  alter table public.missions
    add constraint missions_source_check
    check (source is null or source in (
      'partner', 'google_ads', 'direct', 'word_of_mouth', 'press', 'other'
    ));
exception
  when duplicate_object then null;
  when others then null;
end $$;

create index if not exists idx_missions_partner_id on public.missions(partner_id);
create index if not exists idx_missions_source on public.missions(source);

alter table public.quotes
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists source     text;

do $$
begin
  alter table public.quotes
    add constraint quotes_source_check
    check (source is null or source in (
      'partner', 'google_ads', 'direct', 'word_of_mouth', 'press', 'other'
    ));
exception
  when duplicate_object then null;
  when others then null;
end $$;

create index if not exists idx_quotes_partner_id on public.quotes(partner_id);
create index if not exists idx_quotes_source on public.quotes(source);

-- ─── Trigger : last_contact_at auto sur interactions ─────────
create or replace function public.update_partner_last_contact()
returns trigger as $$
begin
  update public.partners
    set last_contact_at = greatest(coalesce(last_contact_at, '1970-01-01'::timestamptz), new.occurred_at),
        updated_at = now()
    where id = new.partner_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_partner_interactions_last_contact on public.partner_interactions;
create trigger trg_partner_interactions_last_contact
  after insert or update of occurred_at on public.partner_interactions
  for each row execute function public.update_partner_last_contact();

-- ─── Trigger : updated_at auto sur partners ──────────────────
create or replace function public.set_partners_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_partners_updated_at on public.partners;
create trigger trg_partners_updated_at
  before update on public.partners
  for each row execute function public.set_partners_updated_at();

-- ─── Seuil dormant paramétrable ──────────────────────────────
insert into public.app_settings (key, value)
  values ('crm.partner_dormant_days', '90'::jsonb)
on conflict (key) do nothing;

-- ─── Force refresh du PostgREST schema cache ─────────────────
-- L'erreur "Could not find column ... in the schema cache" vient du
-- cache de PostgREST. NOTIFY le force à se recharger sans redémarrer.
notify pgrst, 'reload schema';
