import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function run() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'openai_config' } });
    if (!setting) {
      console.log('OpenAI config not found in DB.');
      return;
    }
    const config = JSON.parse(setting.value);
    console.log('Key starts with:', config.apiKey.substring(0, 7) + '...');
    
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: config.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Teste' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': \Bearer \\,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Success!', response.data.choices[0].message.content);
    } catch (apiError: any) {
      console.error('API Error Response:', apiError.response?.data || apiError.message);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
