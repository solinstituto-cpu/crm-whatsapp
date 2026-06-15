const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateKB() {
  const kb = await prisma.knowledgeBase.findUnique({
    where: { id: 'cmp9ty9vx2f6i1x1i37anregg' }
  });
  
  if (kb) {
    console.log(`Atualizando KB ID: ${kb.id}`);
    
    // Replace Acupuntura durations in the agenda
    let newContent = kb.content;
    
    // Replace '12 meses e 1/2' with '24 meses'
    newContent = newContent.replace(/Acupuntura\s+Presencial ou Online\s+Terça\s+T\s+12 meses e 1\/2/g, 'Acupuntura\tPresencial ou Online\tTerça\tT\t24 meses');
    
    // Replace '3 meses' for Acupuntura with '24 meses'
    newContent = newContent.replace(/Acupuntura\s+presencial\s+2ºFDS\s+I\s+3 meses/g, 'Acupuntura\tpresencial\t2ºFDS\tI\t24 meses');
    newContent = newContent.replace(/Acupuntura\s+Presencial ou Online\s+Terça\s+M\s+3 meses/g, 'Acupuntura\tPresencial ou Online\tTerça\tM\t24 meses');
    newContent = newContent.replace(/Acupuntura\s+Presencial ou Online\s+Terça\s+N\s+3 meses/g, 'Acupuntura\tPresencial ou Online\tTerça\tN\t24 meses');
    
    await prisma.knowledgeBase.update({
      where: { id: kb.id },
      data: { content: newContent }
    });
    console.log('Agenda atualizada.');
  }
}

updateKB().catch(console.error).finally(() => prisma.$disconnect());
