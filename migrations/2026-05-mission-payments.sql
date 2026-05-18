-- Table mission_payments
-- Gère les échéances de paiement (plan illimité) pour chaque mission.
-- Permet le cashflow : vue agrégée des sommes à recevoir + retards à relancer.
--
-- Cohabite avec les colonnes existantes missions.payment_status / paid_at /
-- paid_amount qui restent valables pour les missions PAYÉES EN UNE FOIS (mark-paid
-- classique). Une mission peut avoir 0..N rows mission_payments :
--   - 0 row   = paiement classique 1-fois (workflow existant inchangé)
--   - 1..N row = plan de paiement échelonné (nouveau workflow)
--
-- Status :
--   'pending'   = à payer (la due_date peut être passée → calcul "overdue" en lecture)
--   'paid'      = payée (paid_at non null)
--   'cancelled' = échéance annulée (compte pas dans le total dû)

create extension if not exists "pgcrypto";

create table if not exists public.mission_payments (
  id              uuid primary key default gen_random_uuid(),
  mission_id      uuid not null references public.missions(id) on delete cascade,

  -- Échéance prévue
  amount_eur      numeric(10, 2) not null check (amount_eur > 0),
  due_date        date not null,
  label           text,  -- ex: "Acompte 30%", "Solde fin mission", "Versement 1/3"

  status          text not null default 'pending'
                  check (status in ('pending', 'paid', 'cancelled')),

  -- Détails du paiement réel (null si pas encore reçu)
  paid_at           timestamptz,
  paid_amount_eur   numeric(10, 2),
  payment_method    text check (payment_method in ('virement', 'cb_link', 'revolut', 'stripe', 'especes', 'cheque', 'autre')),
  payment_reference text,  -- n° de transaction, virement, etc.

  -- Relances (visuel uniquement — pas d'envoi auto, l'admin clique « marquer relancé »)
  last_reminded_at  timestamptz,
  reminder_count    integer not null default 0,

  -- Notes libres
  notes             text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_mission_payments_mission_id
  on public.mission_payments (mission_id);
create index if not exists idx_mission_payments_status
  on public.mission_payments (status);
create index if not exists idx_mission_payments_due_date
  on public.mission_payments (due_date);
-- Index composite pour le widget cashflow (status='pending' triés par due_date)
create index if not exists idx_mission_payments_pending_due
  on public.mission_payments (status, due_date)
  where status = 'pending';

-- updated_at auto-bump
create or replace function public.set_mission_payments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_mission_payments_updated_at on public.mission_payments;
create trigger trg_mission_payments_updated_at
  before update on public.mission_payments
  for each row execute function public.set_mission_payments_updated_at();

-- RLS : aucune policy publique. Accès via service_role uniquement (routes admin).
alter table public.mission_payments enable row level security;

comment on table  public.mission_payments is
  'Échéances de paiement par mission (plan illimité). 0 row = paiement 1-fois classique, 1..N = échelonné';
comment on column public.mission_payments.status is
  'pending = à payer (overdue calculé en lecture si due_date passée), paid, cancelled';
comment on column public.mission_payments.paid_amount_eur is
  'Montant réellement reçu (peut différer de amount_eur en cas de paiement partiel non corrigé)';
