import { Worker, Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import axios from 'axios';

const configService = new ConfigService();
const redisConnection = new Redis(configService.get<string>('REDIS_URL'));

// Queue para envio de mensagens
const messageQueue = new Queue('message-sending', {
  connection: redisConnection,
});

// Worker para processar envios
const messageWorker = new Worker(
  'message-sending',
  async (job) => {
    const { to, type, data, templateName, isTemplate } = job.data;

    try {
      const phoneNumberId = configService.get<string>('WHATSAPP_BUSINESS_PHONE_ID');
      const accessToken = configService.get<string>('WHATSAPP_ACCESS_TOKEN');
      const apiVersion = configService.get<string>('WHATSAPP_API_VERSION') || 'v22.0';
      const apiUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

      let payload;

      if (isTemplate) {
        payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: data.components || [],
          },
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          to,
          type,
          [type]: data,
        };
      }

      const started = Date.now();
      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const elapsed = Date.now() - started;
      console.log(`✅ queue_send_ok to=${to} type=${isTemplate ? 'template' : type} waId=${response.data?.messages?.[0]?.id} ms=${elapsed}`);
      return response.data;
    } catch (error) {
      console.error(`❌ queue_send_fail to=${to} err=${error.message} details=${JSON.stringify(error.response?.data)?.slice(0,300)}`);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Processar até 5 mensagens simultaneamente
    limiter: {
      max: 80, // Máximo 80 mensagens
      duration: 60000, // por minuto (respeitando rate limit do WhatsApp)
    },
  }
);

messageWorker.on('completed', (job) => {
  console.log(`📤 Job ${job.id} completed successfully`);
});

messageWorker.on('failed', (job, err) => {
  console.error(`💥 Job ${job.id} failed:`, err.message);
});

messageWorker.on('error', (err) => {
  console.error('🚨 Worker error:', err);
});

console.log('🚀 Message queue worker started');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down worker...');
  await messageWorker.close();
  await redisConnection.disconnect();
  process.exit(0);
});

// Export para uso em outros módulos
export { messageQueue, messageWorker };