-- Corrige a senha do admin para: admin123
-- Execute no Supabase SQL Editor

UPDATE "users"
SET "password" = '$2b$10$vzrZHH.I7cAlb0EmVS6UneDQNCWSduxAWzK6I28ujWBtk0ymcdwW6'
WHERE "email" = 'admin@crm.com';

-- Também corrige o agent para: agent123
UPDATE "users"
SET "password" = '$2b$10$R7.lpQlbdL89tAG5qS88PeG39VILWRamgw5EgVuTk8mkMWQGp1Zjm'
WHERE "email" = 'agent@crm.com';
