-- SEED: Usuários para login
-- Execute no Supabase SQL Editor DEPOIS do schema (SUPABASE-SCHEMA.sql)
-- Ou use apenas este arquivo se as tabelas já existirem

-- Inserir usuários (senhas: admin123, agent123, deni123)
INSERT INTO "users" ("id", "email", "name", "password", "role", "color", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'admin@crm.com', 'Admin User', '$2b$10$vzrZHH.I7cAlb0EmVS6UneDQNCWSduxAWzK6I28ujWBtk0ymcdwW6', 'ADMIN', '#3B82F6', NOW(), NOW()),
  (gen_random_uuid()::text, 'agent@crm.com', 'Agent User', '$2b$10$R7.lpQlbdL89tAG5qS88PeG39VILWRamgw5EgVuTk8mkMWQGp1Zjm', 'AGENT', '#3B82F6', NOW(), NOW()),
  (gen_random_uuid()::text, 'deni.morais777@gmail.com', 'Deni Morais', '$2b$10$5b1WmEjP58xAs20mrjUBnOVdxVHq/4Kfh1OWI.PeKSsmZt192HBru', 'ADMIN', '#3B82F6', NOW(), NOW()),
  (gen_random_uuid()::text, 'denimorais666@gmail.com', 'Deni Atendente', '$2b$10$5b1WmEjP58xAs20mrjUBnOVdxVHq/4Kfh1OWI.PeKSsmZt192HBru', 'AGENT', '#3B82F6', NOW(), NOW()),
  (gen_random_uuid()::text, 'deni@solinstituto.com', 'Deni Sol Instituto', '$2b$10$5b1WmEjP58xAs20mrjUBnOVdxVHq/4Kfh1OWI.PeKSsmZt192HBru', 'ADMIN', '#3B82F6', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;
