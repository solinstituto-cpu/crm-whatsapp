import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WebhookService } from './webhook.service';
import { FlowsModule } from '../flows/flows.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [forwardRef(() => FlowsModule), TemplatesModule],
  providers: [WhatsAppService, WebhookService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService, WebhookService],
})
export class WhatsAppModule {}