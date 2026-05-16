const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const docs = await p.knowledgeDocument.findMany({
    select: { title: true, content: true, createdAt: true }
  });
  console.log('Total documentos na Base de Conhecimento:', docs.length);
  docs.forEach((d, i) => {
    console.log(`\n[${i+1}] ${d.title}`);
    console.log(d.content?.substring(0, 300));
  });
  await p.$disconnect();
}
run().catch(console.error);
