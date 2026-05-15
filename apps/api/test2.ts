import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const whereActive: any = {
    status: 'OPEN',
    OR: [
      { contactId: null },
      {
        contact: {
          OR: [
            { tags: '[]' },
            { tags: '' },
            { tags: '["Golden"]' },
            { tags: null }
          ]
        }
      }
    ]
  };

  const countActive = await prisma.conversation.count({ where: whereActive });
  console.log('Count Active (No Tags):', countActive);

  const whereCampaigns: any = {
    status: 'OPEN',
    contact: {
      AND: [
        { tags: { not: '[]' } },
        { tags: { not: '' } },
        { tags: { not: '["Golden"]' } }
      ]
    }
  };

  const countCampaigns = await prisma.conversation.count({ where: whereCampaigns });
  console.log('Count Campaigns (With Tags):', countCampaigns);
}

main().finally(() => prisma.$disconnect());
