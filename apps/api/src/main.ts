import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { WhatsAppAccountsService } from './whatsapp-accounts/whatsapp-accounts.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Aumentar limite de upload para 10MB (para logos em base64)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS - permite domínios fixos + previews Vercel (*.vercel.app)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.1.131:3000',
    'http://192.168.1.131:3001',
    'https://whatsapp-crm-eight.vercel.app',
    'https://whatsapp-crmsol.vercel.app',
    'https://crm-drm-nuyq.vercel.app',
    'https://crm.drmschool.com.br',
    'https://crm.dmschool.com.br',
    'https://crm.smshcool.com.br',
    process.env.WEBAPP_URL,
  ].filter(Boolean) as string[];

  const isAllowedOrigin = (origin: string) =>
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.drmschool.com.br') ||
    origin.endsWith('.dmschool.com.br');

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // requests sem origin (ex: Postman)
      if (isAllowedOrigin(origin)) return cb(null, origin);
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-admin-email'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix
  app.setGlobalPrefix('api');

  // ============================================
  // MIGRAÇÃO AUTOMÁTICA: Criar conta WhatsApp padrão
  // Se não existir nenhuma conta, cria uma com os dados do .env
  // Isso garante que o sistema continue funcionando normalmente
  // ============================================
  try {
    const whatsAppAccountsService = app.get(WhatsAppAccountsService);
    await whatsAppAccountsService.createFromEnvIfEmpty();
  } catch (error) {
    // Se der erro (tabela não existe ainda), ignora silenciosamente
    // A migration vai criar a tabela e na próxima reinicialização vai funcionar
    logger.warn(`⚠️ Não foi possível verificar contas WhatsApp: ${error.message}`);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 API running on http://0.0.0.0:${port} (rede: http://192.168.1.131:${port})`);
}

bootstrap();