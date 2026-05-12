-- Revenue entries : ventes hors Stripe saisies manuellement par l'admin
-- (programmes d'intégration, formations chef, ventes ponctuelles).
-- Permet de piloter le CA total depuis le dashboard /admin.

create extension if not exists "pgcrypto";

create table if not exists revenue_entries (
  id uuid primary key default gen_random_uuid(),
  occurred_at date not null,
  category text not null check (category in ('integration', 'formation', 'autre')),
  label text not null,
  client_name text,
  chef_id text,
  amount_ht_cents integer not null check (amount_ht_cents >= 0),
  vat_rate integer not null default 20 check (vat_rate in (0, 20)),
  amount_ttc_cents integer generated always as
    (amount_ht_cents + amount_ht_cents * vat_rate / 100) stored,
  invoice_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists revenue_entries_occurred_at_idx
  on revenue_entries (occurred_at desc);

create index if not exists revenue_entries_category_idx
  on revenue_entries (category);

-- Touch updated_at on UPDATE
create or replace function revenue_entries_touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists revenue_entries_updated_at on revenue_entries;
create trigger revenue_entries_updated_at
  before update on revenue_entries
  for each row execute function revenue_entries_touch_updated_at();
