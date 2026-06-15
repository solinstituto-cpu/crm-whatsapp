const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const kb = await prisma.knowledgeBase.findMany({
    where: {
      content: {
        contains: 'espiritualidade',
        mode: 'insensitive'
      }
    }
  });
  
  kb.forEach(k => {
    console.log(`[ID: ${k.id}] ${k.title}`);
    console.log(k.content);
    console.log('---');
  });

  const flows = await prisma.flowNode.findMany({
    where: {
      type: 'AI_CHATBOT'
    }
  });
  
  flows.forEach(f => {
    console.log(`[Flow ID: ${f.id}] ${f.name}`);
    console.log(f.config);
    console.log('---');
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
