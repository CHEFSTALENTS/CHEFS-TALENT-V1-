-- Migration : contrats signés hors plateforme
--
-- Objectif : permettre à Thomas de marquer une mission comme « contrat
-- signé » même quand le contrat n'est pas passé par YouSign — typiquement
-- contrats signés sur Drive/Dropbox, ou PDF reçu par email du client.
--
-- Colonnes ajoutées :
--   contract_signed_at       : la date/heure du marquage manuel (la colonne
--                              était référencée dans le code mais absente
--                              en prod, d'où le 500 sur le bouton).
--   contract_signed_method   : 'manual' | 'external_link' | 'external_pdf'
--                              (yousign signé reste tracé via signature_requests)
--   contract_signed_url      : URL externe (Google Drive, Dropbox, etc.)
--   contract_signed_file_path: chemin Supabase Storage (bucket chef-uploads)
--                              quand Thomas upload un PDF signé.
--   contract_signed_file_url : URL publique du PDF uploadé.
--   contract_signed_notes    : note libre (contexte du marquage manuel)
--
-- 2026-06-10

alter table public.missions
  add column if not exists contract_signed_at         timestamptz,
  add column if not exists contract_signed_method     text
    check (contract_signed_method is null or contract_signed_method in (
      'manual', 'external_link', 'external_pdf'
    )),
  add column if not exists contract_signed_url        text,
  add column if not exists contract_signed_file_path  text,
  add column if not exists contract_signed_file_url   text,
  add column if not exists contract_signed_notes      text;

comment on column public.missions.contract_signed_at is
  'Marquage manuel "contrat signé" — distinct de signature_requests (YouSign).';
comment on column public.missions.contract_signed_method is
  'Méthode du marquage manuel : manual (juste cocher), external_link (URL Drive/Dropbox), external_pdf (PDF uploadé).';
comment on column public.missions.contract_signed_url is
  'URL externe vers le contrat signé (Drive, Dropbox, etc.) — pour les cas hors YouSign.';
