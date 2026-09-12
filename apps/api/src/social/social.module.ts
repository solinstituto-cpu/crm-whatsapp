import { Module } from '@nestjs/common';
import { MetaGraphService } from './meta-graph.service';
import { SocialWebhookService } from './social-webhook.service';
import { SocialController } from './social.controller';
import { SocialAccountsModule } from '../social-accounts/social-accounts.module';

@Module({
  imports: [SocialAccountsModule],
  providers: [MetaGraphService, SocialWebhookService],
  controllers: [SocialController],
  exports: [MetaGraphService, SocialWebhookService],
})
export class SocialModule {}
