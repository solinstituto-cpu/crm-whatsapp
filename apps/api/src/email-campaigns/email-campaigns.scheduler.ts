import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailCampaignsService } from './email-campaigns.service';

@Injectable()
export class EmailCampaignsScheduler {
  private readonly logger = new Logger(EmailCampaignsScheduler.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private emailCampaignsService: EmailCampaignsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledEmailCampaigns() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      const scheduledCampaigns = await this.prisma.emailCampaign.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now },
        },
      });

      for (const campaign of scheduledCampaigns) {
        try {
          await this.emailCampaignsService.start(campaign.id, true);
          this.logger.log(`Campanha de e-mail agendada iniciada: ${campaign.id}`);
        } catch (error: any) {
          this.logger.error(
            `Erro ao iniciar campanha agendada ${campaign.id}: ${error?.message || error}`,
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}

