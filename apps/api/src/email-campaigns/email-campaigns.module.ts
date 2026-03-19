import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailCampaignsController } from './email-campaigns.controller';
import { EmailCampaignsService } from './email-campaigns.service';
import { SettingsModule } from '../settings/settings.module';
import { EmailAuthModule } from '../email-auth/email-auth.module';
import { EmailCampaignsScheduler } from './email-campaigns.scheduler';

@Module({
  imports: [PrismaModule, SettingsModule, EmailAuthModule, ScheduleModule.forRoot()],
  controllers: [EmailCampaignsController],
  providers: [EmailCampaignsService, EmailCampaignsScheduler],
  exports: [EmailCampaignsService],
})
export class EmailCampaignsModule {}

