const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDB() {
  const flows = await prisma.flowNode.findMany({
    where: { type: 'AI_CHATBOT' }
  });
  
  for (const f of flows) {
    if (f.config) {
      let configObj = JSON.parse(f.config);
      if (!configObj.aiPrompt.includes('Ignore campanhas antigas')) {
        configObj.aiPrompt += '\n\nREGRA VITAL: O cliente pode ter recebido várias mensagens de campanhas diferentes no passado. IGNORE campanhas antigas. Foque EXCLUSIVAMENTE no curso/assunto da ÚLTIMA MENSAGEM que nós enviamos a ele. Se a última mensagem foi sobre Radiestesia, fale SÓ sobre Radiestesia.';
        await prisma.flowNode.update({
          where: { id: f.id },
          data: { config: JSON.stringify(configObj) }
        });
        console.log(`Flow Prompt atualizado: ${f.id}`);
      }
    }
  }
}

updateDB().catch(console.error).finally(() => prisma.$disconnect());
