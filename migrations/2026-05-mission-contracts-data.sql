-- Panneau Contrats sur /admin/missions/[id]
-- Stocke les variables éditées de chaque contrat (essai / chef / client)
-- dans une colonne JSONB nullable. Pas de structure rigide : permet
-- d'itérer sur le shape sans migration à chaque champ ajouté.

alter table missions
  add column if not exists contracts_data jsonb;
