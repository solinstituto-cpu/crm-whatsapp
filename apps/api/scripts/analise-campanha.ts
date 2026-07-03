import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar a campanha
  const campaign = await prisma.campaign.findFirst({
    where: { name: { contains: 'Acupuntura 01-07' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!campaign) {
    console.log('Campanha não encontrada');
    return;
  }

  console.log(`=== ${campaign.name} ===`);
  console.log(`Status: ${campaign.status}`);
  console.log(`Enviados: ${campaign.sentCount} | Entregues: ${campaign.deliveredCount} | Lidos: ${campaign.readCount} | Falhas: ${campaign.failedCount}`);
  console.log(`Total contatos: ${campaign.totalContacts}\n`);

  // Buscar mensagens com falha
  const failedMsgs = await prisma.campaignMessage.findMany({
    where: {
      campaignId: campaign.id,
      status: 'FAILED',
    },
    select: {
      contactName: true,
      contactPhone: true,
      error: true,
      sentAt: true,
    },
    orderBy: { sentAt: 'desc' },
  });

  console.log(`\n=== ANÁLISE DOS ${failedMsgs.length} ERROS ===\n`);

  // Agrupar por tipo de erro
  const errorGroups = new Map<string, { count: number; examples: string[] }>();

  for (const msg of failedMsgs) {
    const errorKey = msg.error || 'Erro desconhecido';
    if (!errorGroups.has(errorKey)) {
      errorGroups.set(errorKey, { count: 0, examples: [] });
    }
    const group = errorGroups.get(errorKey)!;
    group.count++;
    if (group.examples.length < 3) {
      group.examples.push(`${msg.contactName} (${msg.contactPhone})`);
    }
  }

  // Ordenar por quantidade
  const sorted = Array.from(errorGroups.entries()).sort((a, b) => b[1].count - a[1].count);

  for (const [error, data] of sorted) {
    console.log(`❌ ${data.count}x — ${error}`);
    console.log(`   Exemplos: ${data.examples.join(', ')}`);
    console.log('');
  }

  // Verificar mensagens que nunca foram enviadas (sem waMessageId e sem erro)
  const notSent = await prisma.campaignMessage.findMany({
    where: {
      campaignId: campaign.id,
      status: 'PENDING',
    },
    select: {
      contactName: true,
      contactPhone: true,
    },
  });

  if (notSent.length > 0) {
    console.log(`\n⏳ ${notSent.length} mensagens ainda PENDENTES (não enviadas)\n`);
  }

  // Verificar status geral
  const allMsgs = await prisma.campaignMessage.groupBy({
    by: ['status'],
    where: { campaignId: campaign.id },
    _count: { status: true },
  });

  console.log('\n=== DISTRIBUIÇÃO DE STATUS ===');
  for (const s of allMsgs) {
    console.log(`  ${s.status}: ${s._count.status}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
