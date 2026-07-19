const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Detalhes das Campanhas
  const campaigns = await prisma.campaign.findMany({
    where: {
      name: { in: ['Terapias Holisticas 29-06', 'Moxa Ventosa e Guasha', 'Alunos Formados Acupuntura'] }
    }
  });

  console.log('=== DETALHES DAS CAMPANHAS ===');
  for (const c of campaigns) {
    console.log(`ID: ${c.id}`);
    console.log(`Nome: ${c.name}`);
    console.log(`Template: ${c.templateName} (${c.templateLanguage})`);
    console.log(`Variables: ${c.templateVariables}`);
    console.log(`WhatsApp Account ID: ${c.whatsappAccountId}`);
    console.log('---');
  }

  // 2. Contatos com telefones estranhos
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Regina Tieko' } },
        { name: { contains: 'andressa melo' } },
        { name: { contains: 'Vanessa Calazans' } }
      ]
    }
  });

  console.log('=== CONTATOS INVESTIGADOS ===');
  for (const contact of contacts) {
    console.log(`ID: ${contact.id}`);
    console.log(`Nome: ${contact.name}`);
    console.log(`Telefone (phoneE164): ${contact.phoneE164}`);
    console.log(`WhatsApp Account ID: ${contact.whatsappAccountId}`);
    console.log(`customFields: ${contact.customFields}`);
    console.log('---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
