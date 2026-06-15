const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const kb = await prisma.knowledgeBase.findMany({
    where: {
      content: {
        contains: 'Acupuntura'
      }
    }
  });
  
  kb.forEach(k => {
    console.log(`[ID: ${k.id}] ${k.title}`);
    console.log(k.content);
    console.log('---');
  });

}

check().catch(console.error).finally(() => prisma.$disconnect());
