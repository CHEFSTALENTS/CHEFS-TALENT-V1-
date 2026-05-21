-- Table seo_topics : backlog de sujets à générer automatiquement par le cron SEO.
-- Le cron pioche les 2 prochains topics en status='pending', les génère, et
-- les marque en status='done' (avec l'id de l'article créé) ou 'failed' (avec erreur).
--
-- L'admin gère le backlog manuellement via /admin/seo (ajout, suppression).

create table if not exists public.seo_topics (
  id              uuid primary key default gen_random_uuid(),

  -- Définition du sujet
  topic           text not null,                -- ex: "Chef privé Cap-Ferrat villa été"
  mode            text not null default 'new_article'
                  check (mode in ('new_article', 'improve_destination')),
  destination_slug text,                        -- optionnel si mode='new_article', obligatoire si improve
  desired_angle   text,                         -- angle particulier optionnel
  priority        integer not null default 0,   -- plus c'est élevé, plus c'est prioritaire

  -- Workflow
  status          text not null default 'pending'
                  check (status in ('pending', 'processing', 'done', 'failed')),
  generated_article_id uuid references public.articles(id) on delete set null,
  error           text,

  -- Audit
  created_by_admin_email text,
  processed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_seo_topics_status_priority
  on public.seo_topics (status, priority desc, created_at asc);
create index if not exists idx_seo_topics_created_at
  on public.seo_topics (created_at desc);

-- updated_at auto-bump
create or replace function public.set_seo_topics_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_seo_topics_updated_at on public.seo_topics;
create trigger trg_seo_topics_updated_at
  before update on public.seo_topics
  for each row execute function public.set_seo_topics_updated_at();

-- RLS : pas de lecture publique, tout passe par service_role (routes admin + cron).
alter table public.seo_topics enable row level security;

comment on table public.seo_topics is
  'Backlog des sujets SEO à générer automatiquement via cron.';
comment on column public.seo_topics.priority is
  'Plus c''est élevé, plus c''est prioritaire. Défaut 0.';
comment on column public.seo_topics.status is
  'pending → processing → done|failed. Reset manuel via UI si bloqué.';
