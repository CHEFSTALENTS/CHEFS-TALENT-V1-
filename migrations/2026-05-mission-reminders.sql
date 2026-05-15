-- Rappels mission auto chef : 3 colonnes pour tracker les rappels envoyés
-- (J-30, J-7, J0) afin d'éviter d'envoyer plusieurs fois le même rappel
-- depuis le cron quotidien /api/cron/mission-reminders.

alter table missions
  add column if not exists reminder_30d_sent_at timestamptz,
  add column if not exists reminder_7d_sent_at  timestamptz,
  add column if not exists reminder_dday_sent_at timestamptz;

-- Index pour accélérer le scan quotidien des missions à rappeler.
-- On filtre sur status confirmed et start_date dans la fenêtre [today, today+31d].
create index if not exists missions_start_date_status_idx
  on missions (status, start_date)
  where status = 'confirmed';
