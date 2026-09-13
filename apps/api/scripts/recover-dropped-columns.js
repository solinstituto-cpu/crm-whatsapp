#!/usr/bin/env node
/**
* Script de recuperacao pontual (rodar UMA VEZ, manualmente, como Render "One-Off Job").
* Le os valores de antes do incidente de 2026-09-12 a partir da copia restaurada via
* Point-in-Time Recovery (RECOVERY_DATABASE_URL) e grava de volta no banco de producao
* (DATABASE_URL), so nas linhas que ja existiam. Nao cria nem apaga nenhuma linha.
*/
const { Client } = require('pg');
async function main() {
  const prodUrl = process.env.DATABASE_URL;
  const recoveryUrl = process.env.RECOVERY_DATABASE_URL;
  if (!prodUrl) { console.error('DATABASE_URL nao definido.'); process.exit(1); }
  if (!recoveryUrl) { console.error('RECOVERY_DATABASE_URL nao definido.'); process.exit(1); }
  const prod = new Client({ connectionString: prodUrl, ssl: { rejectUnauthorized: false } });
  const recovery = new Client({ connectionString: recoveryUrl, ssl: { rejectUnauthorized: false } });
  await prod.connect();
  await recovery.connect();
  console.log('Conectado nos dois bancos.');
  try {
    await prod.query('ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;');
    await prod.query('ALTER TABLE "whatsapp_accounts" ADD COLUMN IF NOT EXISTS "channel" TEXT;');
    console.log('Colunas garantidas em producao.');
    const convRows = (await recovery.query('SELECT id, "sourceType" FROM "conversations" WHERE "sourceType" IS NOT NULL;')).rows;
    console.log('Encontradas ' + convRows.length + ' conversas com sourceType no snapshot.');
    let convUpdated = 0;
    for (const row of convRows) {
      const result = await prod.query('UPDATE "conversations" SET "sourceType" = $1 WHERE id = $2 AND "sourceType" IS NULL;', [row.sourceType, row.id]);
      convUpdated += result.rowCount;
      }
    console.log('conversations.sourceType restaurado em ' + convUpdated + ' linha(s).');
    const waRows = (await recovery.query('SELECT id, channel FROM "whatsapp_accounts" WHERE channel IS NOT NULL;')).rows;
    console.log('Encontradas ' + waRows.length + ' contas WhatsApp com channel no snapshot.');
    let waUpdated = 0;
    for (const row of waRows) {
      const result = await prod.query('UPDATE "whatsapp_accounts" SET channel = $1 WHERE id = $2 AND channel IS NULL;', [row.channel, row.id]);
      waUpdated += result.rowCount;
      }
    console.log('whatsapp_accounts.channel restaurado em ' + waUpdated + ' linha(s).');
    console.log('Recuperacao concluida com sucesso.');
    } finally {
    await prod.end();
    await recovery.end();
    }
  }
main().catch((err) => { console.error('Erro durante a recuperacao:', err); process.exit(1); });
