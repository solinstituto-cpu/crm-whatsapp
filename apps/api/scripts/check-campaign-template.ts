import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const campaign = await p.campaign.findUnique({
    where: { id: 'cms60moy2008n14fm3tu498h4' },
    select: { templateName: true, whatsappAccountId: true, whatsappAccount: { select: { name: true, phoneNumber: true } } }
  });
  
  console.log(`📌 Campanha usa template: "${campaign?.templateName}"`);
  console.log(`   Conta: ${campaign?.whatsappAccount?.name} (${campaign?.whatsappAccount?.phoneNumber})\n`);

  const templates = await p.template.findMany({
    select: { name: true, status: true, language: true }
  });

  console.log(`📋 TODOS os templates no banco (${templates.length}):\n`);
  for (const t of templates) {
    const match = t.name === campaign?.templateName ? ' <<<< ESTE É O QUE A CAMPANHA USA' : '';
    console.log(`   ${t.status === 'APPROVED' ? '✅' : '❌'} ${t.name} (${t.language}) - ${t.status}${match}`);
  }

  const exists = templates.find(t => t.name === campaign?.templateName);
  console.log(exists ? `\n✅ Template encontrado!` : `\n🔴 TEMPLATE "${campaign?.templateName}" NÃO ENCONTRADO no banco!`);

  await p.$disconnect();
}
main();
