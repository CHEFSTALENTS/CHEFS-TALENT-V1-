-- ============================================================
-- Migration : table mission_proposals (tracking pré-confirmation)
-- À exécuter UNE FOIS dans Supabase Dashboard > SQL Editor.
-- ============================================================
--
-- Pourquoi : aujourd'hui, dès qu'on présente un chef à une demande
-- via AssignMissionModal, on crée immédiatement une mission en DB
-- (status='offered'). Si on présente 3 chefs et que les 2 premiers
-- refusent, on a 3 missions pour la même demande, ce qui pollue la
-- table missions et empêche un suivi propre.
--
-- Cette table mission_proposals trace l'étape AVANT confirmation :
--   - shortlisted : on a sélectionné le chef sans encore lui parler
--   - pitched     : on lui a envoyé le brief (email/WhatsApp)
--   - accepted    : il a accepté → on promote en mission
--   - declined    : il a refusé / on a choisi un autre
--   - expired     : sans réponse, ou demande passée
--
-- Workflow :
--   1. Admin sélectionne un chef → INSERT mission_proposals (shortlisted)
--   2. Admin envoie le brief → UPDATE status='pitched' + canal
--   3. Chef répond OUI → UPDATE status='accepted'
--      → côté serveur : INSERT missions (status='confirmed') +
--        UPDATE promoted_to_mission_id + decline_at sur les autres
--        proposals de la même request
--   4. Chef répond NON → UPDATE status='declined'
-- ============================================================

create table if not exists mission_proposals (
  id uuid primary key default gen_random_uuid(),

  -- Lien optionnel vers la demande client (null = mission spontanée
  -- créée par l'admin sans formulaire client préalable).
  request_id uuid references client_requests(id) on delete set null,

  -- Chef : id (= chef_profiles.user_id) + snapshot identité
  chef_id text not null,
  chef_email text not null,
  chef_name text,

  -- Snapshot de la mission (dénormalisé pour ne pas dépendre du request)
  title text,
  location text,
  start_date date,
  end_date date,
  guest_count int,
  service_level text,
  notes text,
  contract_url text,

  -- Financier (mêmes champs que la table missions)
  chef_amount numeric,
  client_amount numeric,
  commission_amount numeric,

  -- Status + canal de communication
  status text not null default 'shortlisted'
    check (status in ('shortlisted', 'pitched', 'accepted', 'declined', 'expired')),
  channel text
    check (channel is null or channel in ('email', 'whatsapp', 'manual')),

  -- Tracking timestamps
  pitched_at timestamptz,           -- moment où le brief a été envoyé au chef
  email_sent_at timestamptz,        -- ack envoi email Resend
  responded_at timestamptz,         -- réponse du chef (yes/no)
  promoted_to_mission_id uuid references missions(id) on delete set null,
                                    -- mission créée si la proposal aboutit

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes pour les requêtes fréquentes
create index if not exists mission_proposals_request_id_idx
  on mission_proposals (request_id);

create index if not exists mission_proposals_chef_id_status_idx
  on mission_proposals (chef_id, status);

create index if not exists mission_proposals_status_created_at_idx
  on mission_proposals (status, created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table mission_proposals enable row level security;

-- Aucune policy pour anon ni authenticated → seul le service-role-key
-- (côté serveur API admin) accède aux données. Quand on fera la PR C
-- (portail chef proposals), on ajoutera une policy
--   "chef_proposals_select_own" using (chef_id = auth.uid()::text)
-- pour que chaque chef puisse lire ses propres proposals depuis le client.

-- ============================================================
-- Trigger : maintien de updated_at
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists mission_proposals_set_updated_at on mission_proposals;
create trigger mission_proposals_set_updated_at
  before update on mission_proposals
  for each row execute function set_updated_at();
