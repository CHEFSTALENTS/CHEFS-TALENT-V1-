-- Migration : brief chef (rappel à J-1, non bloquant)
--
-- Objectif : aider Thomas à envoyer le brief au chef au plus tard la
-- veille du jour J pour les missions confirmées + payées. C'est un
-- OUTIL DE RAPPEL, pas un blocage système.
--
-- Le brief est généré depuis les données du contrat
-- (missions.contracts_data.chef + colonnes mission). Le menu est
-- souvent absent du contrat — on marque "[À PRÉCISER]" plutôt que
-- d'inventer. Le RC Pro chef peut être uploadé séparément.
--
-- 2026-06-14

alter table public.missions
  add column if not exists brief_chef_content        text,
  add column if not exists brief_chef_sent_at        timestamptz,
  add column if not exists brief_chef_channel        text
    check (brief_chef_channel is null or brief_chef_channel in ('email', 'whatsapp')),
  add column if not exists brief_chef_edited         boolean default false,
  add column if not exists brief_chef_rc_pro_url     text,
  add column if not exists brief_chef_rc_pro_file_path text;

comment on column public.missions.brief_chef_content is
  'Contenu du brief envoyé au chef (texte brut, généré via IA depuis le contrat puis éventuellement édité).';
comment on column public.missions.brief_chef_sent_at is
  'Timestamp de marquage "brief envoyé au chef". Non-NULL = OK, NULL = rappel actif si J-1 atteint.';
comment on column public.missions.brief_chef_channel is
  'Canal utilisé : email ou whatsapp.';
comment on column public.missions.brief_chef_rc_pro_url is
  'URL externe de l''attestation RC Pro chef (Drive, Dropbox, etc.).';
comment on column public.missions.brief_chef_rc_pro_file_path is
  'Chemin Supabase Storage du PDF RC Pro chef (bucket chef-uploads).';
