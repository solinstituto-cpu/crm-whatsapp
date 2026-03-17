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

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://whatsapp-crm-eight.vercel.app',
      'https://whatsapp-crmsol.vercel.app',
      'https://crm-drm-nuyq.vercel.app',
      process.env.WEBAPP_URL,
    ].filter(Boolean),
    credentials: true,
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
  await app.listen(port);
  
  logger.log(`🚀 API running on http://localhost:${port}`);
}

bootstrap();