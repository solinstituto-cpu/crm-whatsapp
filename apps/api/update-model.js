const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateModel() {
  // Update Flow Nodes
  const flows = await prisma.flowNode.findMany({
    where: { type: 'AI_CHATBOT' }
  });
  
  for (const f of flows) {
    if (f.config) {
      try {
        const configObj = JSON.parse(f.config);
        configObj.aiModel = 'gpt-4o-mini';
        await prisma.flowNode.update({
          where: { id: f.id },
          data: { config: JSON.stringify(configObj) }
        });
        console.log(`Flow ID ${f.id} updated to gpt-4o-mini`);
      } catch (e) {
        console.log(`Failed to parse/update Flow ID ${f.id}`);
      }
    }
  }

  // Update System Settings
  const settings = await prisma.systemSetting.findFirst({
    where: { key: 'openai_config' }
  });

  if (settings && settings.value) {
    try {
      const valObj = JSON.parse(settings.value);
      valObj.model = 'gpt-4o-mini';
      await prisma.systemSetting.update({
        where: { id: settings.id },
        data: { value: JSON.stringify(valObj) }
      });
      console.log('SystemSetting openai_config updated to gpt-4o-mini');
    } catch (e) {
      console.log('Failed to parse/update SystemSetting openai_config');
    }
  }
}

updateModel().catch(console.error).finally(() => prisma.$disconnect());
