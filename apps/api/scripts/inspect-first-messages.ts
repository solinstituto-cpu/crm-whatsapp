import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectSample() {
  const contacts = await prisma.contact.findMany({
    take: 15,
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 3
          }
        }
      }
    }
  });

  for (const c of contacts) {
    console.log(`\n========================================`);
    console.log(`ID: ${c.id} | Nome: ${c.name} | Phone: ${c.phoneE164}`);
    console.log(`Tags: ${c.tags}`);
    console.log(`Interest: ${c.interest} | CustomFields: ${c.customFields}`);
    
    if (c.conversations.length === 0) {
      console.log(`Sem conversas registradas.`);
    } else {
      for (const conv of c.conversations) {
        console.log(`  Conversa (${conv.id}) - Msgs: ${conv.messages.length}`);
        for (const m of conv.messages) {
          console.log(`    [${m.direction}] (${m.createdAt.toISOString()}): ${m.body?.replace(/\n/g, ' ')}`);
        }
      }
    }
  }
}

inspectSample()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
