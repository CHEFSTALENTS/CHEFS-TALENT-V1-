-- Table articles : contenus SEO générés par l'agent interne + édités par l'admin.
-- Coexiste avec data/articles.ts (legacy statique) : l'app charge les deux,
-- la DB prend priorité si même slug.
--
-- Workflow :
--   1. Agent SEO génère → status='draft', ai_generated=true
--   2. Admin review/edit en draft → status='review' (optionnel)
--   3. Admin publish → status='published' + published_at (visible /insights/[slug])
--   4. Admin peut unpublish → status='draft', visible plus en public

create extension if not exists "pgcrypto";

create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),

  -- Identité & routing
  slug            text not null unique,
  locale          text not null default 'fr' check (locale in ('fr', 'en', 'es')),
  category        text,                       -- ex: 'Destinations', 'Saisonnier', 'Guide'

  -- Métadonnées SEO
  title           text not null,
  subtitle        text,
  meta_title      text,                       -- title <head> (si null = title)
  meta_description text,

  -- Image hero
  image_url       text,
  image_alt       text,

  -- Contenu structuré (blocks: paragraphs, h2, h3, lists, quotes, etc.)
  -- Format : [{ type: 'paragraph', text: '...' }, { type: 'h2', text: '...' }, ...]
  blocks          jsonb not null default '[]'::jsonb,

  -- FAQs (génèrent un FAQPage JSON-LD côté rendu)
  faqs            jsonb default '[]'::jsonb,  -- [{ q: '...', a: '...' }]

  -- Lien éventuel vers une destination existante (lib/destinations.ts)
  target_destination_slug text,

  -- Workflow status
  status          text not null default 'draft'
                  check (status in ('draft', 'review', 'published', 'archived')),
  published_at    timestamptz,

  -- Tracking AI / coût
  ai_generated    boolean not null default false,
  ai_model        text,                       -- 'claude-sonnet-4-5', etc.
  ai_input_tokens  integer,
  ai_output_tokens integer,
  ai_cost_eur     numeric(8, 4),              -- coût total de la génération

  -- Audit
  created_by_admin_email text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_articles_slug         on public.articles (slug);
create index if not exists idx_articles_status       on public.articles (status);
create index if not exists idx_articles_locale       on public.articles (locale);
create index if not exists idx_articles_published_at on public.articles (published_at desc) where status = 'published';
create index if not exists idx_articles_target_dest  on public.articles (target_destination_slug) where target_destination_slug is not null;

-- updated_at auto-bump
create or replace function public.set_articles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
  before update on public.articles
  for each row execute function public.set_articles_updated_at();

-- RLS
alter table public.articles enable row level security;

-- Public peut lire les articles publiés (pour SSR /insights/[slug])
create policy if not exists "Public can read published articles"
  on public.articles for select
  using (status = 'published');

-- Les autres opérations passent par service_role (routes admin)

comment on table public.articles is
  'Articles SEO générés par l''agent interne. Coexiste avec data/articles.ts.';
comment on column public.articles.blocks is
  'Contenu structuré : [{ type: "paragraph"|"h2"|"h3"|"list"|"quote", text|items }]';
comment on column public.articles.ai_cost_eur is
  'Coût total Anthropic API en euros (basé sur les tokens × tarif modèle)';
