import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailCampaignsController } from './email-campaigns.controller';
import { EmailCampaignsService } from './email-campaigns.service';
import { SettingsModule } from '../settings/settings.module';
import { EmailAuthModule } from '../email-auth/email-auth.module';

@Module({
  imports: [PrismaModule, SettingsModule, EmailAuthModule],
  controllers: [EmailCampaignsController],
  providers: [EmailCampaignsService],
  exports: [EmailCampaignsService],
})
export class EmailCampaignsModule {}

