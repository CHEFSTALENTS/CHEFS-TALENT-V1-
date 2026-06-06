-- Ajoute le tracker pour le rappel J-3 mission (nouveau variant 2026-06).
-- Le cron /api/cron/mission-reminders set cette colonne quand le mail
-- J-3 est envoyé au chef pour garantir l'idempotence.

alter table public.missions
  add column if not exists reminder_3d_sent_at timestamptz;

comment on column public.missions.reminder_3d_sent_at is
  'Set à now() quand le rappel J-3 mission est envoyé au chef (cron mission-reminders).';
