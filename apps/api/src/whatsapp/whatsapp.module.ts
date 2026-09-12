import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WebhookService } from './webhook.service';
import { FlowsModule } from '../flows/flows.module';
import { TemplatesModule } from '../templates/templates.module';
import { SocialModule } from '../social/social.module';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

@Module({
  imports: [forwardRef(() => FlowsModule), TemplatesModule, SocialModule, SocialAccountsModule],
  providers: [WhatsAppService, WebhookService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService, WebhookService],
})
export class WhatsAppModule {}