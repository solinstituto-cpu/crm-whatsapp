const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateKB() {
  const kb = await prisma.knowledgeBase.findMany({
    where: {
      content: {
        contains: 'Meditação'
      }
    }
  });
  
  let updated = 0;
  for (const k of kb) {
    if (k.content.includes('Meditação e Portais da percepção') && k.content.includes('2 meses')) {
      console.log(`Atualizando KB ID: ${k.id}`);
      const newContent = k.content.replace(/2 meses/g, '12 meses');
      await prisma.knowledgeBase.update({
        where: { id: k.id },
        data: { content: newContent }
      });
      updated++;
    }
  }
  console.log(`Atualizados: ${updated}`);
}

updateKB().catch(console.error).finally(() => prisma.$disconnect());
