import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const running = await p.campaign.findMany({
    where: { status: 'RUNNING' },
    select: { 
      id: true, name: true, status: true, totalContacts: true, 
      sentCount: true, failedCount: true, filterTags: true,
      sendRatePerMinute: true, sendStartHour: true, sendEndHour: true,
      maxMessagesPerDay: true, daySentCount: true,
      createdAt: true, startedAt: true,
    }
  });

  console.log(`\n🔍 Campanhas em RUNNING: ${running.length}\n`);
  for (const c of running) {
    console.log(`📌 ${c.name}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Status: ${c.status}`);
    console.log(`   Total contatos: ${c.totalContacts}`);
    console.log(`   Enviados: ${c.sentCount} | Falhas: ${c.failedCount}`);
    console.log(`   Filtro tags: ${c.filterTags}`);
    console.log(`   Velocidade: ${c.sendRatePerMinute}/min`);
    console.log(`   Horário: ${c.sendStartHour}h - ${c.sendEndHour}h`);
    console.log(`   Limite diário: ${c.maxMessagesPerDay || 'sem limite'} | Hoje: ${c.daySentCount}`);
    console.log(`   Iniciada em: ${c.startedAt}`);
    
    // Verificar mensagens pendentes
    const pending = await p.campaignMessage.count({
      where: { campaignId: c.id, status: 'PENDING' }
    });
    const sent = await p.campaignMessage.count({
      where: { campaignId: c.id, status: 'SENT' }
    });
    const failed = await p.campaignMessage.count({
      where: { campaignId: c.id, status: 'FAILED' }
    });
    console.log(`   Msgs: ${pending} pendentes | ${sent} enviadas | ${failed} falhas`);
    console.log('');
  }

  // Hora atual no Brasil
  const now = new Date();
  const brHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours();
  console.log(`⏰ Hora Brasil: ${brHour}h`);

  await p.$disconnect();
}
main();
