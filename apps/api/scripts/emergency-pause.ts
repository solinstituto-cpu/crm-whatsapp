import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // Buscar campanhas em execução
  const running = await p.campaign.findMany({
    where: { status: 'RUNNING' },
    select: { id: true, name: true, totalContacts: true, sentCount: true, failedCount: true }
  });
  console.log('🚨 CAMPANHAS EM EXECUÇÃO:', JSON.stringify(running, null, 2));

  // PAUSAR TODAS
  for (const c of running) {
    await p.campaign.update({ where: { id: c.id }, data: { status: 'PAUSED' } });
    console.log(`⏸️ PAUSADA: ${c.name} (${c.id})`);
  }

  // Verificar campanha Acupuntura Parte 03
  const acu03 = await p.campaign.findFirst({
    where: { name: { contains: 'Acupuntura Parte 03' } },
    select: { id: true, name: true, status: true, totalContacts: true, sentCount: true, failedCount: true, filterTags: true }
  });
  console.log('\n📋 CAMPANHA ACUPUNTURA 03:', JSON.stringify(acu03, null, 2));

  await p.$disconnect();
}
main();
