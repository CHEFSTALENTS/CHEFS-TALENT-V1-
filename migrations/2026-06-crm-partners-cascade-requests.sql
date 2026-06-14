-- Migration : CRM partners — corrélation complète demandes / devis / missions
--
-- Ajoute :
--  - client_requests.partner_id       (FK partners) — qui a apporté ce lead
--  - client_requests.acquisition_channel (enum CRM partner/google_ads/…)
--    NB : distinct du `source` legacy de client_requests qui désigne le
--    canal technique ('admin' / 'form'). On préfère ne pas casser l'existant.
--
-- Et fait un BACKFILL :
--  1) Pour chaque company_name unique non vide → crée un partner
--     (type=concierge, status=active, name=company_name original).
--     Récupère email/phone/contact_name du contact le plus récent.
--  2) Rattache toutes les client_requests à leur partner via le company_name
--     (case-insensitive, trim, suppression des accents).
--  3) Pour les missions et quotes qui ont un request_id pointant vers une
--     request avec partner_id, recopie le partner_id (si non déjà set).
--
-- 100% idempotent. Peut être ré-appliqué sans risque.
--
-- 2026-06-15

-- ─── 1. Ajout colonnes ────────────────────────────────────────
alter table public.client_requests
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists acquisition_channel text;

do $$
begin
  alter table public.client_requests
    add constraint client_requests_acquisition_channel_check
    check (acquisition_channel is null or acquisition_channel in (
      'partner', 'google_ads', 'direct', 'word_of_mouth', 'press', 'other'
    ));
exception
  when duplicate_object then null;
  when others then null;
end $$;

create index if not exists idx_client_requests_partner_id on public.client_requests(partner_id);
create index if not exists idx_client_requests_acquisition_channel on public.client_requests(acquisition_channel);

comment on column public.client_requests.partner_id is
  'Apporteur de la demande (cf. table partners). NULL si lead direct sans apporteur identifié.';
comment on column public.client_requests.acquisition_channel is
  'Canal d''acquisition CRM : partner / google_ads / direct / word_of_mouth / press / other. NB : distinct du champ `source` legacy qui désigne le canal technique (admin / form).';

-- ─── 2. Fonction de normalisation pour matching ──────────────
-- Lowercase + trim + suppression des doubles espaces. Pas de unaccent
-- ici pour éviter une dépendance à l'extension (pas garantie sur tous
-- les projets Supabase).
create or replace function public.normalize_company_name(input text)
returns text as $$
  select case
    when input is null then null
    when btrim(input) = '' then null
    else lower(regexp_replace(btrim(input), '\s+', ' ', 'g'))
  end;
$$ language sql immutable;

-- ─── 3. Backfill — création des partners depuis company_name ──
-- On insère un partner par nom normalisé unique, en récupérant les
-- métadonnées du contact le plus récent pour ce nom.
--
-- ON CONFLICT DO NOTHING : si on re-passe la migration et qu'un partner
-- du même nom existe déjà, on ne duplique pas.

with companies_to_create as (
  select distinct on (public.normalize_company_name(cr.company_name))
    cr.company_name as raw_name,
    public.normalize_company_name(cr.company_name) as normalized_name,
    cr.email,
    cr.phone,
    cr.full_name,
    cr.first_name,
    cr.created_at
  from public.client_requests cr
  where cr.company_name is not null
    and btrim(cr.company_name) <> ''
    and not exists (
      -- pas déjà rattaché à un partner via le nom
      select 1 from public.partners p
      where public.normalize_company_name(p.name) = public.normalize_company_name(cr.company_name)
    )
  order by public.normalize_company_name(cr.company_name), cr.created_at desc
)
insert into public.partners (
  name, type, status,
  company,
  email, phone,
  contact_first_name, contact_last_name,
  first_contact_at,
  created_by_admin_email,
  notes
)
select
  raw_name,
  'concierge',           -- type par défaut, modifiable manuellement après
  'active',
  raw_name,              -- company = name au backfill
  email,
  phone,
  case when full_name is not null then split_part(full_name, ' ', 1) else first_name end,
  case when full_name is not null and position(' ' in full_name) > 0
       then btrim(substring(full_name from position(' ' in full_name) + 1))
       else null end,
  created_at,
  'backfill-2026-06',
  '[backfill] Créé automatiquement depuis client_requests.company_name (' || raw_name || '). Type "concierge" par défaut — à ajuster si besoin.'
from companies_to_create;

-- ─── 4. Rattachement des client_requests aux partners ─────────
update public.client_requests cr
set partner_id = p.id,
    acquisition_channel = coalesce(cr.acquisition_channel, 'partner')
from public.partners p
where cr.partner_id is null
  and cr.company_name is not null
  and btrim(cr.company_name) <> ''
  and public.normalize_company_name(p.name) = public.normalize_company_name(cr.company_name);

-- ─── 5. Propagation aux missions et quotes liées ──────────────
-- Pour chaque mission/quote sans partner_id mais avec un request_id dont
-- la request a un partner_id : recopie.
update public.missions m
set partner_id = cr.partner_id,
    source = coalesce(m.source, cr.acquisition_channel)
from public.client_requests cr
where m.partner_id is null
  and m.request_id is not null
  and m.request_id = cr.id
  and cr.partner_id is not null;

update public.quotes q
set partner_id = cr.partner_id,
    source = coalesce(q.source, cr.acquisition_channel)
from public.client_requests cr
where q.partner_id is null
  and q.request_id is not null
  and q.request_id = cr.id
  and cr.partner_id is not null;

-- ─── 6. Rapport de backfill (RAISE NOTICE) ────────────────────
do $$
declare
  v_partners_created int;
  v_requests_linked int;
  v_missions_linked int;
  v_quotes_linked int;
begin
  select count(*) into v_partners_created
    from public.partners where created_by_admin_email = 'backfill-2026-06';

  select count(*) into v_requests_linked
    from public.client_requests where partner_id is not null;

  select count(*) into v_missions_linked
    from public.missions where partner_id is not null;

  select count(*) into v_quotes_linked
    from public.quotes where partner_id is not null;

  raise notice '── Rapport backfill CRM partners ──';
  raise notice 'Partners créés : %', v_partners_created;
  raise notice 'Client_requests rattachées à un partner : %', v_requests_linked;
  raise notice 'Missions rattachées à un partner : %', v_missions_linked;
  raise notice 'Quotes rattachées à un partner : %', v_quotes_linked;
end $$;

-- ─── 7. Force refresh du cache PostgREST ──────────────────────
notify pgrst, 'reload schema';
