const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const convCount = await prisma.conversation.count();
  const msgCount = await prisma.message.count();
  const contactCount = await prisma.contact.count();
  console.log('=== DADOS NO BANCO ===');
  console.log('Conversas:', convCount);
  console.log('Mensagens:', msgCount);
  console.log('Contatos:', contactCount);
  
  // Mostrar 5 conversas mais recentes
  const recent = await prisma.conversation.findMany({
    take: 5,
    orderBy: { lastMessageAt: 'desc' },
    include: { contact: { select: { name: true, phoneE164: true } } }
  });
  console.log('\n=== 5 CONVERSAS MAIS RECENTES ===');
  recent.forEach(c => {
    console.log(`- ${c.contact?.name || 'Sem nome'} (${c.contact?.phoneE164}) | Status: ${c.status} | Última msg: ${c.lastMessageAt}`);
  });
}
main().finally(() => prisma.$disconnect());
