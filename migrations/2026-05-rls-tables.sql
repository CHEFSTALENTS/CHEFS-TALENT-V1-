-- ============================================================
-- Migration : activation RLS (Row Level Security) sur les tables sensibles
-- À exécuter UNE FOIS dans Supabase Dashboard > SQL Editor.
-- ============================================================
--
-- Pourquoi : sans RLS, n'importe qui en possession de la clé anonyme
-- (qui est PUBLIQUE par design dans NEXT_PUBLIC_SUPABASE_ANON_KEY) peut
-- requêter toutes les tables via le client Supabase JS. Avec RLS activée
-- sans policy publique, seul le service-role-key (côté serveur) peut
-- accéder aux données.
--
-- Effet sur le code applicatif :
-- - Toutes nos routes API server-side utilisent createClient(URL,
--   SERVICE_ROLE_KEY) qui bypasse RLS automatiquement → aucune régression
-- - Le client Supabase côté navigateur (anon key) ne pourra plus lire/écrire
--   ces tables directement. Mais on n'utilise pas ce pattern dans le code
--   applicatif (toutes les requêtes passent par les API routes), donc safe.
-- - Pour les chefs authentifiés via Supabase Auth, on définit des policies
--   précises sur chef_profiles (lire/modifier sa propre row).
-- ============================================================

-- ===========================================
-- 1) chef_profiles : RLS + policies par chef
-- ===========================================
alter table chef_profiles enable row level security;

-- Un chef authentifié peut SELECT sa propre row.
-- Note : la colonne user_id de chef_profiles doit matcher auth.users.id.
drop policy if exists "chef_profiles_select_own" on chef_profiles;
create policy "chef_profiles_select_own"
  on chef_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

-- Un chef authentifié peut UPDATE sa propre row.
drop policy if exists "chef_profiles_update_own" on chef_profiles;
create policy "chef_profiles_update_own"
  on chef_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Un chef authentifié peut INSERT sa propre row (lors du signup).
drop policy if exists "chef_profiles_insert_own" on chef_profiles;
create policy "chef_profiles_insert_own"
  on chef_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Pas de policy DELETE pour authenticated : suppression côté admin seul
-- (via service-role-key qui bypasse RLS).
-- Pas de policy pour anon : non authentifié ne voit rien.


-- ===========================================
-- 2) client_requests : RLS, accessible serveur uniquement
-- ===========================================
-- Les demandes clients UHNW contiennent des PII sensibles (email, téléphone,
-- budget, adresse). Aucun anon ni authenticated ne doit y accéder
-- directement ; tout passe par /api/request (création) et /api/admin/* (lecture).
alter table client_requests enable row level security;
-- Aucune policy → seul service-role-key (côté serveur API) accède.


-- ===========================================
-- 3) missions : RLS, accessible serveur uniquement
-- ===========================================
-- Les missions contiennent des données business sensibles (tarifs négociés,
-- lieux clients, marges). Pas de lecture client direct.
alter table missions enable row level security;


-- ===========================================
-- 4) chef_enquiries : RLS, accessible serveur uniquement
-- ===========================================
-- Formulaire d'inscription chef : géré par /api/chef-enquiry (insert) et
-- /api/admin/* (lecture). Aucun accès client direct.
alter table chef_enquiries enable row level security;


-- ===========================================
-- 5) waitlist : RLS, accessible serveur uniquement
-- ===========================================
alter table waitlist enable row level security;


-- ===========================================
-- 6) app_settings : RLS, accessible serveur uniquement
-- ===========================================
-- Configuration admin live (vip_content, etc.). Géré par /api/admin/vip-content.
alter table app_settings enable row level security;


-- ===========================================
-- 7) geo_cache : RLS, accessible serveur uniquement
-- ===========================================
-- Cache de géocodage Mapbox. Géré par /api/admin/geocode.
alter table geo_cache enable row level security;


-- ===========================================
-- 8) profiles : RLS si la table existe et est utilisée
-- ===========================================
-- Si la table 'profiles' existe (souvent créée par défaut par Supabase),
-- on l'active aussi par sécurité.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    execute 'alter table public.profiles enable row level security';
  end if;
end
$$;


-- ===========================================
-- 9) chef_terms_acceptances : déjà RLS (migration précédente)
-- ===========================================
-- Pas d'action ici. Vérifié par migrations/2026-05-chef-terms-acceptances.sql.


-- ============================================================
-- VÉRIFICATIONS POST-MIGRATION
-- Lance ces queries dans le SQL Editor pour confirmer :
-- ============================================================
--
-- 1) RLS activée sur toutes les tables :
--    select schemaname, tablename, rowsecurity
--      from pg_tables
--     where schemaname = 'public'
--       and tablename in (
--         'chef_profiles', 'client_requests', 'missions',
--         'chef_enquiries', 'waitlist', 'app_settings',
--         'geo_cache', 'chef_terms_acceptances'
--       )
--     order by tablename;
--    → tous les rowsecurity = true
--
-- 2) Policies sur chef_profiles :
--    select schemaname, tablename, policyname, cmd
--      from pg_policies
--     where tablename = 'chef_profiles';
--    → 3 policies : chef_profiles_select_own, _update_own, _insert_own
--
-- 3) Test côté code après application :
--    - Login en tant que chef → /chef/dashboard doit afficher ton profil ✅
--    - /api/admin/chefs (admin) doit lister tous les chefs ✅
--    - Le client Supabase côté navigateur (anon) ne peut plus query ces tables
