const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('=== ANÁLISE DE FALHAS POR CAMPANHA ===\n');

  for (const c of campaigns) {
    const totalFailed = await prisma.campaignMessage.count({
      where: { campaignId: c.id, status: 'FAILED' }
    });

    if (totalFailed === 0) continue;

    console.log(`Campanha: ${c.name} (Status: ${c.status})`);
    console.log(`Total Falhas: ${totalFailed}`);

    // Pegar amostragem de falhas (com e sem números longos)
    const samples = await prisma.campaignMessage.findMany({
      where: { campaignId: c.id, status: 'FAILED' },
      take: 10
    });

    console.log('Exemplos de erros:');
    samples.forEach(s => {
      const isLong = s.contactPhone.length > 15;
      console.log(` - Contato: ${s.contactName} (${s.contactPhone}) [Longo: ${isLong}] -> ${s.error}`);
    });
    console.log('\n----------------------------------------\n');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
