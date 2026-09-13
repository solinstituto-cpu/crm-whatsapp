#!/usr/bin/env node
/**
 * Script de cadastro pontual (rodar manualmente quando necessário).
 *
 * Ativar os campos de webhook no painel do Meta for Developers (feed,
 * comments, messages, etc.) NÃO é suficiente sozinho - a Página (e a conta
 * do Instagram ligada a ela) também precisa estar explicitamente inscrita
 * para o nosso app receber os eventos dela. Isso é feito com uma chamada
 * separada à Graph API: POST /{page-id}/subscribed_apps.
 *
 * O register-social-account.js (rodado antes) só gravou o Page Access
 * Token no banco - nunca fez essa chamada de inscrição. É por isso que
 * nenhum evento (nem DM, nem comentário) chega no /api/wa/webhook: a Meta
 * nunca foi instruída a nos avisar sobre nada dessa Página.
 *
 * Este script lê o(s) Page Access Token(s) já salvos no banco de produção
 * (tabela social_accounts) - não recebe nem imprime o token em nenhum
 * momento - e chama a Graph API para inscrever cada Página nos campos que
 * o CRM sabe processar.
 *
 * Variáveis de ambiente necessárias:
 *   - DATABASE_URL -> já existe (banco de produção)
 *
 * Idempotente: pode rodar de novo sem problema.
 */
const { Client } = require('pg');

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';
const SUBSCRIBED_FIELDS = [
  'messages',
  'messaging_postbacks',
  'message_deliveries',
  'message_reads',
  'message_echoes',
  'feed',
  'comments',
].join(',');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL nao definido.');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Conectado ao banco de producao.');

  try {
    const result = await client.query(
      'SELECT DISTINCT ON ("pageId") "pageId", "pageName", "accessToken" ' +
      'FROM "social_accounts" WHERE "isActive" = true AND "pageId" IS NOT NULL AND "accessToken" IS NOT NULL ' +
      'ORDER BY "pageId", "channel"',
    );

    if (result.rows.length === 0) {
      console.log('Nenhuma conta social ativa com pageId/accessToken encontrada. Nada a fazer.');
      return;
    }

    for (const row of result.rows) {
      const { pageId, pageName, accessToken } = row;
      const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/subscribed_apps?subscribed_fields=${encodeURIComponent(SUBSCRIBED_FIELDS)}&access_token=${encodeURIComponent(accessToken)}`;

      console.log(`Inscrevendo Página "${pageName}" (pageId=${pageId}) nos campos: ${SUBSCRIBED_FIELDS}...`);

      const res = await fetch(url, { method: 'POST' });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error) {
        console.error(`ERRO ao inscrever pageId=${pageId}: ${JSON.stringify(json.error || json)}`);
        continue;
      }

      console.log(`OK pageId=${pageId}: ${JSON.stringify(json)}`);

      // Confere o que ficou realmente inscrito (sem expor o token no log).
      const checkUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/subscribed_apps?access_token=${encodeURIComponent(accessToken)}`;
      const checkRes = await fetch(checkUrl);
      const checkJson = await checkRes.json().catch(() => ({}));
      if (checkRes.ok && !checkJson.error) {
        const apps = (checkJson.data || []).map((a) => ({
          name: a.name,
          subscribed_fields: a.subscribed_fields,
        }));
        console.log(`Inscrições atuais para pageId=${pageId}: ${JSON.stringify(apps)}`);
      } else {
        console.error(`Não foi possível confirmar inscrição de pageId=${pageId}: ${JSON.stringify(checkJson.error || checkJson)}`);
      }
    }

    console.log('Concluído.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Erro durante a inscrição:', err);
  process.exit(1);
});
