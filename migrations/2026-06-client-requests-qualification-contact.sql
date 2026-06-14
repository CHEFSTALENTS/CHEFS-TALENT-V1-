-- Migration : traçabilité du message de qualification envoyé au client
--
-- Quand Thomas reçoit une nouvelle demande, il peut envoyer en 1 clic
-- un message pré-rédigé par l'IA (email ou WhatsApp) pour qualifier le
-- client rapidement. On trace ici l'envoi pour :
--   - éviter d'envoyer 2 fois
--   - mesurer le délai de réponse côté CT (KPI saison)
--   - faire apprendre l'agent au fil du temps (édition vs envoi tel quel)
--
-- 2026-06-15

alter table public.client_requests
  add column if not exists qualified_contact_sent_at     timestamptz,
  add column if not exists qualified_contact_channel     text
    check (qualified_contact_channel is null or qualified_contact_channel in ('email', 'whatsapp')),
  add column if not exists qualified_contact_message     text,
  add column if not exists qualified_contact_edited      boolean default false;

comment on column public.client_requests.qualified_contact_sent_at is
  'Timestamp du premier envoi du message de qualification (email ou WhatsApp).';
comment on column public.client_requests.qualified_contact_channel is
  'Canal utilisé : email ou whatsapp.';
comment on column public.client_requests.qualified_contact_message is
  'Contenu exact envoyé (utile pour audit + apprentissage IA).';
comment on column public.client_requests.qualified_contact_edited is
  'true si Thomas a édité le message avant envoi (signal qualité prompt).';
