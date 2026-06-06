-- Phase 1 de l'agent commercial : ajout des coûts internes sur quotes
-- pour permettre le calcul de marge en temps réel.
--
-- ATTENTION : ces champs ne sont JAMAIS exposés au client dans le PDF.
-- Ce sont des données internes Chefs Talents pour piloter la marge.

alter table public.quotes
  -- Coût du chef HT (tarif négocié avec le chef pour cette mission)
  -- Stocké comme valeur unique = on suppose que les 3 options tarifaires
  -- correspondent au même chef, juste avec des prix de vente différents
  -- selon le profil affiché au client (Junior/Confirmé/Expérimenté).
  add column if not exists chef_cost_eur numeric(10, 2),

  -- Frais de déplacement du chef (train, avion, essence)
  add column if not exists chef_travel_cost_eur numeric(10, 2),

  -- Butler demandé ? (parfois requis en conciergerie haut de gamme)
  add column if not exists butler_required boolean not null default false,
  add column if not exists butler_cost_eur numeric(10, 2),

  -- Notes internes sur la marge / négociation (jamais exposées au client)
  add column if not exists margin_notes text;

comment on column public.quotes.chef_cost_eur is
  'Coût HT du chef pour cette mission. INTERNE — jamais exposé au client.';
comment on column public.quotes.chef_travel_cost_eur is
  'Frais de déplacement chef. INTERNE — jamais exposé au client.';
comment on column public.quotes.butler_required is
  'Indique si un butler est requis pour la mission (conciergerie HG).';
comment on column public.quotes.butler_cost_eur is
  'Coût HT du butler si butler_required=true. INTERNE.';
comment on column public.quotes.margin_notes is
  'Notes internes sur la marge / négociation. JAMAIS exposées au client.';

-- Index utile pour le futur dashboard quotes (Phase 3)
create index if not exists idx_quotes_status_created on public.quotes (status, created_at desc);
