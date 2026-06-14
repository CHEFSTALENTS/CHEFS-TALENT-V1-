-- Migration : CRM apporteurs/clients
--
-- Permet à Thomas de tracer en fin de saison qui lui a apporté quoi,
-- combien, quand, comment et sur quelles missions.
--
-- - partners              : annuaire des contacts (apporteurs, conciergeries,
--                           villa/yacht managers, travel planners, chefs
--                           qui apportent une affaire, clients directs)
-- - partner_interactions  : timeline libre des interactions (appels, dîners,
--                           cadeaux, leads reçus...) — peuvent être saisies
--                           pour le passé ou pour le présent
-- - missions.partner_id   : lien vers l'apporteur de l'affaire
-- - missions.source       : canal d'acquisition (partner / google_ads / direct / ...)
-- - quotes.partner_id     : idem côté devis (utile pour les devis externes)
-- - quotes.source         : idem
--
-- Toutes les commandes sont idempotentes (IF NOT EXISTS) — peuvent être
-- réappliquées sans risque pour vérifier la cohérence.
--
-- 2026-06-15

-- ─── partners ────────────────────────────────────────────────
create table if not exists public.partners (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  type                text not null
    check (type in (
      'concierge', 'villa_manager', 'yacht_manager', 'travel_planner',
      'apporteur_indep', 'chef', 'client_direct', 'other'
    )),
  destinations        text[],                  -- ['saint-tropez', 'ibiza', 'mykonos']
  contact_first_name  text,
  contact_last_name   text,
  email               text,
  phone               text,
  whatsapp            text,
  company             text,
  notes               text,
  status              text not null default 'active'
    check (status in ('active', 'dormant', 'archived')),
  first_contact_at    timestamptz default now(),
  last_contact_at     timestamptz,
  acquisition_source  text,                    -- "rencontré à dîner X, été 2023"
  language            text,
  -- Si l'apporteur est un chef du réseau, on peut le lier au chef_profile.
  -- NULL si apporteur externe.
  linked_chef_email   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by_admin_email text
);

create index if not exists idx_partners_status on public.partners(status);
create index if not exists idx_partners_type on public.partners(type);
create index if not exists idx_partners_last_contact_at on public.partners(last_contact_at);
create index if not exists idx_partners_destinations on public.partners using gin(destinations);

comment on table public.partners is
  'Annuaire CRM : apporteurs, conciergeries, villa/yacht managers, chefs qui apportent une affaire, clients directs.';
comment on column public.partners.linked_chef_email is
  'Optionnel : email du chef_profile si l''apporteur est un chef du réseau (chef qui amène une mission à son réseau).';
comment on column public.partners.last_contact_at is
  'MAJ automatique à chaque nouvelle interaction OU manuelle. Utilisé pour détecter les dormants.';

-- ─── partner_interactions ───────────────────────────────────
create table if not exists public.partner_interactions (
  id                  uuid primary key default gen_random_uuid(),
  partner_id          uuid not null references public.partners(id) on delete cascade,
  occurred_at         timestamptz not null,    -- date réelle de l'interaction (peut être passée)
  kind                text not null
    check (kind in (
      'call', 'whatsapp', 'email', 'meeting_irl', 'gift',
      'social', 'lead_received', 'note'
    )),
  summary             text not null,           -- description libre
  related_mission_id  uuid references public.missions(id) on delete set null,
  related_quote_id    uuid references public.quotes(id) on delete set null,
  created_at          timestamptz not null default now(),
  created_by_admin_email text
);

create index if not exists idx_partner_interactions_partner_id on public.partner_interactions(partner_id);
create index if not exists idx_partner_interactions_occurred_at on public.partner_interactions(occurred_at desc);

comment on table public.partner_interactions is
  'Timeline libre des interactions avec un apporteur. Permet la saisie rétrospective (occurred_at < now) pour reconstituer un historique.';

-- ─── Trigger : maj last_contact_at sur partner quand interaction ───
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

-- ─── missions : lien apporteur + source ───────────────────────
alter table public.missions
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists source     text
    check (source is null or source in (
      'partner', 'google_ads', 'direct', 'word_of_mouth', 'press', 'other'
    ));

create index if not exists idx_missions_partner_id on public.missions(partner_id);
create index if not exists idx_missions_source on public.missions(source);

comment on column public.missions.partner_id is
  'Apporteur de l''affaire (cf. table partners). NULL si source != partner.';
comment on column public.missions.source is
  'Canal d''acquisition : partner / google_ads / direct / word_of_mouth / press / other.';

-- ─── quotes : lien apporteur + source ─────────────────────────
alter table public.quotes
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists source     text
    check (source is null or source in (
      'partner', 'google_ads', 'direct', 'word_of_mouth', 'press', 'other'
    ));

create index if not exists idx_quotes_partner_id on public.quotes(partner_id);
create index if not exists idx_quotes_source on public.quotes(source);

-- ─── Seuil dormant paramétrable via app_settings ──────────────
-- Insère le réglage par défaut s'il n'existe pas.
insert into public.app_settings (key, value)
  values ('crm.partner_dormant_days', '90'::jsonb)
on conflict (key) do nothing;

-- ─── updated_at auto-trigger sur partners ─────────────────────
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
