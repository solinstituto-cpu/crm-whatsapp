import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BUSCANDO MENSAGENS COM FALHA OU TEMPLATES REPETIDOS HOJE ===');

  // Buscar mensagens criadas hoje ou com status FAILED ou contendo o texto da imagem
  const today = new Date('2026-07-22T00:00:00-03:00');

  const messagesToday = await prisma.message.findMany({
    where: {
      createdAt: { gte: today }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      conversation: {
        include: { contact: true }
      }
    }
  });

  console.log(`Total de mensagens criadas hoje (22/07/2026): ${messagesToday.length}`);

  // Filtrar por status ou conteúdo
  const failedStatus = messagesToday.filter(m => m.status === 'FAILED');
  const templateMsgs = messagesToday.filter(m => m.type === 'template');
  const carreiraMsgs = messagesToday.filter(m => m.body?.includes('carreira profissional'));

  console.log(`Mensagens hoje com status 'FAILED': ${failedStatus.length}`);
  console.log(`Mensagens hoje do tipo 'template': ${templateMsgs.length}`);
  console.log(`Mensagens hoje contendo 'carreira profissional': ${carreiraMsgs.length}`);

  // Verificar todas as mensagens no banco com status 'FAILED' ou contendo 'carreira profissional'
  const totalCarreira = await prisma.message.count({
    where: { body: { contains: 'carreira profissional' } }
  });
  console.log(`Total acumulado no banco contendo 'carreira profissional': ${totalCarreira}`);

  const totalFailed = await prisma.message.count({
    where: { status: 'FAILED' }
  });
  console.log(`Total acumulado no banco com status 'FAILED': ${totalFailed}`);

  // Mostrar amostra das mensagens encontradas
  console.log('\n--- AMOSTRA DE 10 MENSAGENS DE HOJE ---');
  for (const m of messagesToday.slice(0, 10)) {
    console.log(`ID: ${m.id} | Status: ${m.status} | Type: ${m.type} | Time: ${m.createdAt.toISOString()}`);
    console.log(`Contact: ${m.conversation?.contact?.name} (${m.conversation?.phoneE164})`);
    console.log(`Body snippet: ${m.body?.substring(0, 80)}...`);
    console.log('---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
