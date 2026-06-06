-- Table quotes : devis générés à partir d'une client_request, éditables
-- section par section comme les contrats. La PDF est généré côté serveur
-- au moment du download (template HTML → puppeteer A4).
--
-- Workflow :
--   1. Admin clique "Générer devis" depuis /admin/requests/[id]
--      → pré-rempli depuis les infos de la request
--      → status='draft'
--   2. Admin édite les sections (intitulé, profils tarifaires, conditions, etc.)
--   3. Admin télécharge le PDF / envoie au client
--      → status='sent' (set côté API quand le download/email est effectué)
--   4. Client accepte → status='accepted'

create extension if not exists "pgcrypto";

create table if not exists public.quotes (
  id              uuid primary key default gen_random_uuid(),

  -- Référence visible : N° CT-2026-0615-CONC, généré auto
  reference       text not null unique,
  -- Lié à une request (peut être null si devis adhoc futur)
  request_id      uuid references public.client_requests(id) on delete set null,

  -- Workflow
  status          text not null default 'draft'
                  check (status in ('draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled')),
  issued_at       date not null default current_date,
  validity_date   date,             -- ex: 2026-06-05

  -- ─── Bloc DÉTAIL DE LA PRESTATION ───────────────────────
  intitule        text,             -- "Chef privé en résidence, service full time"
  lieu            text,             -- "Cannes (06)"
  dates_text      text,             -- "Du 15 au 22 juin 2026 (7 jours)" — libre
  convives_text   text,             -- "10 adultes"
  rythme_text     text,             -- "Full time, tous repas"
  langues_text    text,             -- "Français / Anglais"
  hebergement_text text,            -- "Chef local Cannes, ne dort pas sur place"

  -- ─── Bloc DEVIS — émetteur ──────────────────────────────
  emetteur_nom     text default 'SASU La Cantine de Thomas, Chefs Talents',
  emetteur_ville   text default 'Bordeaux, France',
  emetteur_siret   text default '898 320 726 00026',
  emetteur_tva     text default 'Assujettie à la TVA, TVA 20 %',

  -- ─── Bloc DEVIS — destinataire ──────────────────────────
  destinataire_nom text,           -- "Conciergerie Advisor Luxury"
  destinataire_type text,          -- "Prestation B2B, marque blanche"
  destinataire_adresse text,       -- optionnel

  -- ─── OPTIONS TARIFAIRES (au choix) ──────────────────────
  -- jsonb : array de { label, ht_eur, tva_eur, ttc_eur, note? }
  -- Par défaut : 3 profils Junior / Confirmé / Expérimenté
  tariff_options  jsonb not null default '[]'::jsonb,

  -- ─── Bloc COURSES ET APPROVISIONNEMENT ──────────────────
  courses_text    text,            -- paragraphe libre éditable
  courses_provision_text text,     -- "Provision indicative pour 10 couverts..."

  -- ─── Bloc CONDITIONS ────────────────────────────────────
  -- jsonb : array de strings (bullets)
  conditions      jsonb not null default '[]'::jsonb,

  -- ─── Bloc TVA — paramètres ──────────────────────────────
  tva_rate_pct    numeric(5, 2) not null default 20.0,
  currency        text not null default 'EUR',

  -- ─── Notes admin (jamais affichées au client) ───────────
  admin_notes     text,

  -- ─── Audit ──────────────────────────────────────────────
  created_by_admin_email text,
  sent_at         timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_quotes_request_id on public.quotes (request_id);
create index if not exists idx_quotes_status     on public.quotes (status);
create index if not exists idx_quotes_created_at on public.quotes (created_at desc);

-- updated_at auto-bump
create or replace function public.set_quotes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_quotes_updated_at on public.quotes;
create trigger trg_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_quotes_updated_at();

alter table public.quotes enable row level security;

comment on table public.quotes is
  'Devis générés depuis client_requests, éditables section par section. PDF généré au download.';
comment on column public.quotes.tariff_options is
  'Array JSON [{label, ht_eur, tva_eur, ttc_eur, note?}]. Le client choisit une option à la confirmation.';
comment on column public.quotes.conditions is
  'Array JSON de strings (bullets). Éditable depuis l''admin.';
