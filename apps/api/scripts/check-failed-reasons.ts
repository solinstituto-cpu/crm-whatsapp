import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const campaignId = 'cms60moy2008n14fm3tu498h4';
  
  // Buscar mensagens com falha
  const failed = await p.campaignMessage.findMany({
    where: { campaignId, status: 'FAILED' },
    select: { contactName: true, contactPhone: true, error: true, createdAt: true },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n🔴 Últimas 10 falhas:\n`);
  for (const f of failed) {
    console.log(`  ${f.contactName || 'Sem nome'} (${f.contactPhone})`);
    console.log(`  ❌ Erro: ${f.error}`);
    console.log('');
  }

  await p.$disconnect();
}
main();
