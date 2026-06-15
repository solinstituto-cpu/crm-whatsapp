const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDB() {
  // Update Flow Nodes to reinforce NO LINKS policy
  const flows = await prisma.flowNode.findMany({
    where: { type: 'AI_CHATBOT' }
  });
  
  for (const f of flows) {
    if (f.config.includes('SÓ envie links se o cliente usar EXPLICITAMENTE')) {
      let newConfig = f.config;
      newConfig = newConfig.replace('SÓ envie links se o cliente usar EXPLICITAMENTE as palavras "link", "site" ou "página". Se ele pedir apenas "informações" ou "me fale sobre", dê as informações em TEXTO RESUMIDO baseado na sua base de conhecimento e NUNCA mande links.', 'PROIBIDÍSSIMO ENVIAR LINKS. NUNCA, SOB NENHUMA HIPÓTESE, mande o cliente acessar o site para ver detalhes ou se inscrever, pois ele acabou de vir do site. Se ele pedir informações, dê as informações AQUI MESMO EM TEXTO. SÓ envie um link se ele mandar a palavra exata "link" ou "site".');
      
      await prisma.flowNode.update({
        where: { id: f.id },
        data: { config: newConfig }
      });
      console.log(`Flow Prompt atualizado: ${f.id}`);
    }
  }

  // Update KB replacing "espiritualidade"
  const kb = await prisma.knowledgeBase.findMany({
    where: {
      content: { contains: 'espiritualidade', mode: 'insensitive' }
    }
  });

  for (const k of kb) {
    let newContent = k.content.replace(/espiritualidade/gi, 'autoconhecimento');
    newContent = newContent.replace(/espiritual/gi, 'interior');
    
    await prisma.knowledgeBase.update({
      where: { id: k.id },
      data: { content: newContent }
    });
    console.log(`KB atualizado: ${k.id}`);
  }
}

updateDB().catch(console.error).finally(() => prisma.$disconnect());
