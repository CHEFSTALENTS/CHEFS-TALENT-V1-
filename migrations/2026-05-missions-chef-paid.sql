-- Ajoute le tracking du paiement chef sur missions
-- Distinction importante :
--   paid_at        = client a payé Chefs Talents (mission encaissée côté agence)
--   chef_paid_at   = Chefs Talents a payé le chef (NOUVEAU)
--
-- Permet d'afficher en rouge dans l'admin les missions terminées mais dont
-- le chef n'a pas encore été rémunéré (rappel important pour l'admin).

alter table public.missions
  add column if not exists chef_paid_at        timestamptz,
  add column if not exists chef_paid_amount    numeric(10, 2),
  add column if not exists chef_paid_method    text check (chef_paid_method in ('virement', 'cb_link', 'revolut', 'stripe', 'especes', 'cheque', 'autre') or chef_paid_method is null),
  add column if not exists chef_paid_reference text;

create index if not exists idx_missions_chef_paid_at
  on public.missions (chef_paid_at)
  where chef_paid_at is null;

comment on column public.missions.chef_paid_at is
  'Timestamp où le chef a été rémunéré par Chefs Talents (différent de paid_at qui concerne le paiement CLIENT → agence)';
comment on column public.missions.chef_paid_amount is
  'Montant net réellement versé au chef (peut différer de chef_amount en cas de remplacement ou ajustement)';
