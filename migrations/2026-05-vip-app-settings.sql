-- ============================================================
-- Migration : table app_settings + seed vip_content
-- À exécuter UNE FOIS dans Supabase Dashboard > SQL Editor
-- (https://supabase.com/dashboard → projet → SQL Editor → New query)
-- Colle le contenu, clic "Run". Si "table already exists" : ignore, c'est OK.
-- ============================================================

-- Table key-value pour les configs éditables live
create table if not exists app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Trigger updated_at automatique
create or replace function set_app_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_settings_set_updated_at on app_settings;
create trigger app_settings_set_updated_at
  before update on app_settings
  for each row
  execute function set_app_settings_updated_at();

-- Seed initial du contenu VIP (ne fait rien si déjà présent)
insert into app_settings (key, value)
values (
  'vip_content',
  jsonb_build_object(
    'groupUrl', '',
    'calendlyUrl', 'https://calendly.com/contact-chefstalents/30min',
    'tips', jsonb_build_array(
      jsonb_build_object(
        'id', 'tip-1',
        'title', 'Comment négocier un séjour saisonnier 12-18k€/mois',
        'desc', 'Le guide stratégique pour positionner vos tarifs face aux familles UHNW.',
        'href', ''
      ),
      jsonb_build_object(
        'id', 'tip-2',
        'title', 'Checklist pré-mission yacht',
        'desc', 'Tout ce qu''il faut vérifier 7 jours avant un embarquement charter.',
        'href', ''
      ),
      jsonb_build_object(
        'id', 'tip-3',
        'title', '10 erreurs des chefs qui perdent leurs clients UHNW',
        'desc', 'Les pièges relationnels et opérationnels à éviter en mission privée.',
        'href', ''
      ),
      jsonb_build_object(
        'id', 'tip-4',
        'title', 'Modèle de devis chef privé (FR/EN)',
        'desc', 'Un template propre pour répondre à un brief conciergerie.',
        'href', ''
      )
    )
  )
)
on conflict (key) do nothing;
