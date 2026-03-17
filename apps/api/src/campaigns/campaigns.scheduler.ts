import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignsService } from './campaigns.service';

@Injectable()
export class CampaignsScheduler {
  private readonly logger = new Logger(CampaignsScheduler.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private campaignsService: CampaignsService,
  ) {}

  /**
   * Executa a cada minuto para verificar campanhas agendadas
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledCampaigns() {
    // Evitar execuções simultâneas
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const now = new Date();
      
      // Buscar campanhas com status SCHEDULED e scheduledAt <= agora
      const scheduledCampaigns = await this.prisma.campaign.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lte: now,
          },
        },
      });

      if (scheduledCampaigns.length > 0) {
        this.logger.log(`📅 Encontradas ${scheduledCampaigns.length} campanha(s) agendada(s) para iniciar`);
      }

      for (const campaign of scheduledCampaigns) {
        try {
          this.logger.log(`🚀 Iniciando campanha agendada: ${campaign.name} (ID: ${campaign.id})`);
          this.logger.log(`   Agendada para: ${campaign.scheduledAt}`);
          this.logger.log(`   Hora atual: ${now}`);
          
          // Iniciar a campanha com force=true pois já passou do horário agendado
          await this.campaignsService.start(campaign.id, true);
          
          this.logger.log(`✅ Campanha ${campaign.name} iniciada com sucesso!`);
        } catch (error) {
          this.logger.error(`❌ Erro ao iniciar campanha ${campaign.name}: ${error.message}`);
          
          // Em caso de erro, manter como SCHEDULED para tentar novamente
          // ou marcar como FAILED se for um erro permanente
        }
      }
    } catch (error) {
      this.logger.error(`Erro no scheduler de campanhas: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Executa a cada 5 minutos para retomar campanhas RUNNING que pararam
   * (ex: após restart do servidor)
   */
  @Cron('*/5 * * * *')
  async resumeRunningCampaigns() {
    try {
      const runningCampaigns = await this.prisma.campaign.findMany({
        where: {
          status: 'RUNNING',
        },
        include: {
          _count: {
            select: {
              messages: {
                where: { status: 'PENDING' }
              }
            }
          }
        }
      });

      for (const campaign of runningCampaigns) {
        const pendingCount = campaign._count?.messages || 0;
        
        if (pendingCount > 0) {
          // Verificar se a campanha está realmente processando
          // Se não estiver, retomar
          this.logger.log(`📋 Verificando campanha RUNNING: ${campaign.name} - ${pendingCount} mensagens pendentes`);
          
          // O processCampaign já verifica se está em execução via runningCampaigns Map
          // Então é seguro chamar novamente
          this.campaignsService.processCampaign(campaign.id).catch(err => {
            this.logger.error(`Erro ao retomar campanha ${campaign.id}: ${err.message}`);
          });
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao verificar campanhas RUNNING: ${error.message}`);
    }
  }
}
