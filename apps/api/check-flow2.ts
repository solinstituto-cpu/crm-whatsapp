import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const flows = await (prisma as any).flow.findMany({ 
    orderBy: { updatedAt: 'desc' },
    take: 5
  });
  flows.forEach((f: any) => console.log(f.name, '| isActive:', f.isActive, '| trigger:', f.trigger));
  
  const sessions = await (prisma as any).flowSession.findMany({ 
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('\nSessoes recentes:');
  sessions.forEach((s: any) => console.log(' -', s.contactId, '| status:', s.status, '| created:', s.createdAt));
  await (prisma as any).();
}
run();
