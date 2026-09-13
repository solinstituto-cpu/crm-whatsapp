#!/usr/bin/env node
/**
   * Script de cadastro pontual (rodar manualmente, uma vez por Pagina/token novo).
   * Cadastra uma Pagina do Facebook (com seu Page Access Token) como SocialAccount
   * no CRM, para que o Messenger e o Instagram Direct dessa Pagina comecem a cair
   * no inbox. Cria (ou atualiza) DUAS linhas - channel=FACEBOOK e channel=INSTAGRAM -
   * com o mesmo pageId/token, porque a Meta unifica envio/recebimento dos dois canais
   * atraves da Pagina conectada.
   *
   * Variaveis de ambiente necessarias (configurar temporariamente no servico crm-api
   * antes de rodar, e remover depois de usar):
   *   - DATABASE_URL              -> ja existe (banco de producao)
   *   - SOCIAL_PAGE_ID            -> ID da Pagina no Facebook
   *   - SOCIAL_PAGE_ACCESS_TOKEN  -> Page Access Token gerado em developers.facebook.com
   *   - SOCIAL_PAGE_NAME          -> (opcional) nome amigavel
   *   - SOCIAL_APP_ID             -> (opcional) App ID da Meta usado para gerar o token
   *
   * Idempotente: pode rodar de novo com o mesmo pageId para atualizar o token.
   */
const { Client } = require('pg');
const crypto = require('crypto');

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    const pageId = process.env.SOCIAL_PAGE_ID;
    const accessToken = process.env.SOCIAL_PAGE_ACCESS_TOKEN;
    const pageName = process.env.SOCIAL_PAGE_NAME || 'Sol Instituto Terapeutico';
    const appId = process.env.SOCIAL_APP_ID || null;

  if (!dbUrl) { console.error('DATABASE_URL nao definido.'); process.exit(1); }
    if (!pageId) { console.error('SOCIAL_PAGE_ID nao definido.'); process.exit(1); }
    if (!accessToken) { console.error('SOCIAL_PAGE_ACCESS_TOKEN nao definido.'); process.exit(1); }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('Conectado ao banco de producao.');

  try {
        const channels = ['FACEBOOK', 'INSTAGRAM'];
        for (const channel of channels) {
                const name = channel === 'FACEBOOK' ? pageName : (pageName + ' (Instagram)');
                const id = crypto.randomUUID();

          const result = await client.query(
                    'INSERT INTO "social_accounts" (id, channel, name, "pageId", "pageName", "accessToken", "appId", "isActive", "isDefault", "createdAt", "updatedAt") ' +
                    'VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, now(), now()) ' +
                    'ON CONFLICT (channel, "pageId") ' +
                    'DO UPDATE SET "accessToken" = EXCLUDED."accessToken", "pageName" = EXCLUDED."pageName", "appId" = COALESCE(EXCLUDED."appId", "social_accounts"."appId"), "isActive" = true, "updatedAt" = now() ' +
                    'RETURNING id, channel, "pageId", (xmax = 0) AS inserted;',
                    [id, channel, name, pageId, pageName, accessToken, appId],
                  );

          const row = result.rows[0];
                console.log('OK ' + channel + ': conta social ' + (row.inserted ? 'criada' : 'atualizada') + ' (id=' + row.id + ', pageId=' + row.pageId + ').');
        }

      console.log('Cadastro de conta social concluido com sucesso.');
  } finally {
        await client.end();
  }
}

main().catch((err) => {
    console.error('Erro durante o cadastro:', err);
    process.exit(1);
});
