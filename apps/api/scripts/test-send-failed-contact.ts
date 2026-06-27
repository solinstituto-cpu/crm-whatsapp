import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.whatsAppAccount.findFirst({
    where: { name: 'Campanhas' }
  });

  if (!account) {
    console.log('Account not found');
    return;
  }

  const to = '+5521998137626'; // the failed contact

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'campanha_formacoes_sol_dimas',
      language: {
        code: 'pt_BR'
      },
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'video',
              video: {
                id: '27562906893302871'
              }
            }
          ]
        }
      ],
    },
  };

  const apiVersion = 'v22.0';
  const apiUrl = `https://graph.facebook.com/${apiVersion}/${account.phoneNumberId}/messages`;

  console.log(`Sending template to ${to} using ${apiUrl}`);

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Success response:', response.data);
  } catch (error: any) {
    console.error('Error sending:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
