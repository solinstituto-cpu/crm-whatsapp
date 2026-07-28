import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const failedMessages = await prisma.message.findMany({
    where: {
      status: 'FAILED'
    },
    include: {
      conversation: {
        include: { contact: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`=== MENSAGENS COM STATUS 'FAILED' NO BANCO DE DADOS ===`);
  console.log(`Total com status FAILED: ${failedMessages.length}`);

  // Quantas são de hoje
  const today = new Date('2026-07-22T00:00:00-03:00');
  const failedToday = failedMessages.filter(m => m.createdAt >= today);
  console.log(`Com status FAILED criadas HOJE (22/07/2026): ${failedToday.length}`);

  // Agrupar por template ou corpo
  const failedByBody: Record<string, number> = {};
  for (const m of failedMessages) {
    const key = m.body?.substring(0, 50) || 'SEM_CORPO';
    failedByBody[key] = (failedByBody[key] || 0) + 1;
  }

  console.log('\n--- Agrupamento por conteúdo/template de falha: ---');
  for (const [key, count] of Object.entries(failedByBody)) {
    console.log(`- "${key}": ${count} mensagens`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
