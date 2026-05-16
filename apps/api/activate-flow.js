const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const result = await prisma.flow.updateMany({
    where: { name: 'Atendimento de Cursos Inteligente (IA)' },
    data: { isActive: true }
  });
  console.log('Flows reativados:', result.count);
  
  // Confirm
  const flow = await prisma.flow.findFirst({ where: { name: 'Atendimento de Cursos Inteligente (IA)' } });
  console.log('Status atual:', flow.name, '| isActive:', flow.isActive);
  
  await prisma.$disconnect();
}
run().catch(console.error);
