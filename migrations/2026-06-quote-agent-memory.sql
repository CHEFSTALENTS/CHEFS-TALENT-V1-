-- Phase 2 de l'agent commercial : table conversations + mémoire persistante.
-- L'agent commence par poser des questions, on l'aide à apprendre, et
-- au fil des devis il devient meilleur (il se souvient des prix qu'on
-- a validés pour tel destinataire, telle ville, etc.).

create extension if not exists "pgcrypto";

-- ─── Conversations (1 par devis qu'on bosse avec l'agent) ────────
create table if not exists public.quote_agent_conversations (
  id            uuid primary key default gen_random_uuid(),
  quote_id      uuid not null references public.quotes(id) on delete cascade,
  request_id    uuid,                                  -- dénormalisé pour requêtes faciles
  status        text not null default 'active'
                check (status in ('active', 'completed', 'abandoned')),

  -- Array de turns : [{role: 'agent'|'user', content: string, ts: ISO,
  --                    suggestions?: [{field, value, rationale, applied}]}]
  turns         jsonb not null default '[]'::jsonb,

  -- Stats coût Claude (tracking)
  ai_input_tokens  integer not null default 0,
  ai_output_tokens integer not null default 0,
  ai_cost_eur      numeric(10, 4) not null default 0,

  created_by_admin_email text,
  started_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_quote_agent_conv_quote on public.quote_agent_conversations (quote_id);
create index if not exists idx_quote_agent_conv_status on public.quote_agent_conversations (status, updated_at desc);

-- ─── Mémoires : ce que l'agent retient ─────────────────────────
-- scope : 'global' (vrai partout), 'destinataire' (par client), 'location' (par ville)
-- scope_key : 'global' | nom destinataire | nom lieu normalisé
-- memory_key : ex 'default_chef_cost_residence_7d', 'preferred_butler_supplier'
-- value : jsonb (peut être un nombre, un texte, une liste, etc.)
create table if not exists public.quote_agent_memories (
  id            uuid primary key default gen_random_uuid(),

  scope         text not null check (scope in ('global', 'destinataire', 'location')),
  scope_key     text not null,                        -- 'global' / 'Conciergerie Advisor Luxury' / 'Cannes (06)'
  memory_key    text not null,                        -- ex 'preferred_chef_cost_eur_per_day_residence'
  value         jsonb not null,

  -- Contexte / rationale (pour audit + transparence dans l'UI)
  rationale     text,                                 -- "Confirmé après devis CT-2026-0615-CONC"
  source        text not null default 'user_confirmed'
                check (source in ('user_confirmed', 'inferred_from_history', 'agent_proposal')),
  confidence    numeric(3, 2) not null default 1.0,   -- 0.00 → 1.00

  -- Stats d'utilisation
  use_count     integer not null default 0,
  last_used_at  timestamptz,

  -- Audit
  created_by_admin_email text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Une seule mémoire par (scope, scope_key, memory_key) — on upsert si déjà existante
create unique index if not exists idx_quote_agent_memory_unique
  on public.quote_agent_memories (scope, scope_key, memory_key);

create index if not exists idx_quote_agent_memory_scope_recent
  on public.quote_agent_memories (scope, scope_key, last_used_at desc);

-- updated_at auto-bumps
create or replace function public.set_quote_agent_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_quote_agent_conv_updated_at on public.quote_agent_conversations;
create trigger trg_quote_agent_conv_updated_at
  before update on public.quote_agent_conversations
  for each row execute function public.set_quote_agent_updated_at();

drop trigger if exists trg_quote_agent_memory_updated_at on public.quote_agent_memories;
create trigger trg_quote_agent_memory_updated_at
  before update on public.quote_agent_memories
  for each row execute function public.set_quote_agent_updated_at();

alter table public.quote_agent_conversations enable row level security;
alter table public.quote_agent_memories enable row level security;

comment on table public.quote_agent_conversations is
  'Conversations entre Thomas et l''agent commercial pour la rédaction d''un devis. Une par devis.';
comment on table public.quote_agent_memories is
  'Mémoire persistante de l''agent : ce qu''il a appris au fil des devis (prix, conditions préférées, etc.).';
