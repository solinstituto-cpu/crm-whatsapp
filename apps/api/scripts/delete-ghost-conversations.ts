/**
 * Remove conversas fantasma (sem mensagens) do banco
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ghosts = await prisma.conversation.findMany({
    where: { messages: { none: {} } },
    select: { id: true, phoneE164: true, contact: { select: { name: true } } },
  });

  console.log(`🗑️ Removendo ${ghosts.length} conversas fantasma...`);
  
  for (const g of ghosts) {
    await prisma.conversation.delete({ where: { id: g.id } });
    console.log(`  ✅ Removida: ${g.contact?.name || g.phoneE164}`);
  }

  console.log('\n✅ Limpeza concluída!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erro:', e);
  await prisma.$disconnect();
});
