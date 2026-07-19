const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.whatsAppAccount.findMany({
    where: { isActive: true }
  });

  console.log('=== BUSCANDO TEMPLATES DA META PARA CADA CONTA ===\n');

  for (const account of accounts) {
    console.log(`Conta: ${account.name} (WABA ID: ${account.businessId})`);
    try {
      const url = `https://graph.facebook.com/v22.0/${account.businessId}/message_templates`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
        },
        params: {
          fields: 'id,name,status,language',
          limit: 100
        }
      });

      const templates = response.data.data || [];
      console.log(`Templates encontrados (${templates.length}):`);
      templates.forEach(t => {
        console.log(` - [${t.status}] ${t.name} (${t.language})`);
      });
    } catch (error) {
      console.error(`❌ Erro ao buscar templates: ${error.message}`);
      if (error.response && error.response.data) {
        console.error('Detalhes:', JSON.stringify(error.response.data));
      }
    }
    console.log('\n----------------------------------------\n');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
