import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WebhookService } from './webhook.service';
import { MessageService } from './message.service';
import { TemplateService } from './template.service';

@Module({
  imports: [HttpModule],
  providers: [WhatsAppService, WebhookService, MessageService, TemplateService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService, MessageService, TemplateService],
})
export class WhatsAppModule {}

