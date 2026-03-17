#!/usr/bin/env node
/**
 * Script para limpar migrations falhas e preparar banco antes do deploy
 */

const { Client } = require('pg');

async function fixMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados...');

    // 1. Deletar migrations falhas ou rolled back
    const result = await client.query(`
      DELETE FROM "_prisma_migrations" 
      WHERE rolled_back_at IS NOT NULL
         OR finished_at IS NULL
         OR migration_name = '20260203000001_add_user_color_and_24h_window'
         OR migration_name = '20260122000003_add_user_sessions'
    `);
    console.log(`Migrations problemáticas removidas: ${result.rowCount}`);

    // 2. Adicionar coluna color se não existir
    try {
      await client.query(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "color" TEXT DEFAULT '#3B82F6'
      `);
      console.log('Coluna color adicionada/verificada em users');
    } catch (e) {
      console.log('Coluna color já existe ou erro:', e.message);
    }

    // 3. Adicionar coluna lastIncomingMessageAt se não existir
    try {
      await client.query(`
        ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "lastIncomingMessageAt" TIMESTAMP(3)
      `);
      console.log('Coluna lastIncomingMessageAt adicionada/verificada em conversations');
    } catch (e) {
      console.log('Coluna lastIncomingMessageAt já existe ou erro:', e.message);
    }

    // 4. Popular lastIncomingMessageAt com base nas mensagens existentes
    const updateResult = await client.query(`
      UPDATE "conversations" c
      SET "lastIncomingMessageAt" = (
        SELECT MAX(m."createdAt")
        FROM "messages" m
        WHERE m."conversationId" = c."id" AND m."direction" = 'IN'
      )
      WHERE c."lastIncomingMessageAt" IS NULL
    `);
    console.log(`Conversas atualizadas com lastIncomingMessageAt: ${updateResult.rowCount}`);

    await client.end();
    console.log('Banco preparado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.log('Aviso:', error.message);
    // Continuar mesmo com erro
    process.exit(0);
  }
}

fixMigrations();
