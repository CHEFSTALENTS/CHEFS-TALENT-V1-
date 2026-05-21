-- Table leads : capture email via lead magnets (page /guide, etc.)
-- Workflow : prospect télécharge un guide → on capture son email → on
-- déclenche une séquence nurture (welcome J0 + relances J+3, J+7, J+14).
-- Si le prospect répond ou clique CTA /request, on stoppe le nurture.

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),

  email           text not null,
  name            text,
  phone           text,
  source          text not null default 'guide',  -- ex: 'guide', 'comparateur', 'newsletter'

  -- Workflow nurture
  status          text not null default 'active'
                  check (status in ('active', 'converted', 'unsubscribed', 'bounced')),
  nurture_step    integer not null default 0,    -- 0 = welcome envoyé, 1 = J+3, 2 = J+7, 3 = J+14, 4 = end
  last_email_at   timestamptz,
  unsubscribed_at timestamptz,

  -- Métadonnées
  user_agent      text,
  referrer        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,

  -- Audit
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Email unique par source (un prospect peut être lead via /guide ET /comparateur)
create unique index if not exists idx_leads_email_source on public.leads (lower(email), source);
create index if not exists idx_leads_status_step on public.leads (status, nurture_step, last_email_at);
create index if not exists idx_leads_created_at on public.leads (created_at desc);

-- updated_at auto-bump
create or replace function public.set_leads_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_leads_updated_at();

-- RLS : pas de lecture publique, tout passe par service_role.
alter table public.leads enable row level security;

comment on table public.leads is
  'Prospects captés via lead magnets (page /guide, comparateur, etc.).';
comment on column public.leads.nurture_step is
  '0=welcome envoyé, 1=J+3, 2=J+7, 3=J+14, 4=fin de séquence';
