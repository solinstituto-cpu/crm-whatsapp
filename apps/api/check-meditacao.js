const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const kb = await prisma.knowledgeBase.findMany({
    where: {
      content: {
        contains: 'Meditação'
      }
    }
  });
  
  kb.forEach(k => {
    if (k.content.includes('2 meses') || k.content.includes('12 meses') || k.content.includes('duração')) {
      console.log(`[ID: ${k.id}] ${k.title}`);
      console.log(k.content);
      console.log('---');
    }
  });

}

check().catch(console.error).finally(() => prisma.$disconnect());
