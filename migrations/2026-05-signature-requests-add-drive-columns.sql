-- Ajoute les colonnes Google Drive sur signature_requests
-- pour stocker le backup automatique du PDF signé dans un dossier Drive dédié
-- (en plus du backup Supabase Storage existant via signed_pdf_url).

alter table public.signature_requests
  add column if not exists drive_file_id text,
  add column if not exists drive_file_url text;

comment on column public.signature_requests.drive_file_id is
  'ID du fichier dans Google Drive (compte de service). Null si Drive non activé.';
comment on column public.signature_requests.drive_file_url is
  'URL webViewLink Drive du PDF signé (lien direct cliquable).';
