import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /api/reports/dashboard
   * Retorna todas as estatísticas do dashboard
   */
  @Get('dashboard')
  async getDashboardStats() {
    this.logger.log('GET /reports/dashboard');
    return this.reportsService.getDashboardStats();
  }

  /**
   * GET /api/reports/metrics
   * Métricas com filtros de período
   */
  @Get('metrics')
  async getMetrics(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log(`GET /reports/metrics - period: ${period}`);
    return this.reportsService.getReportMetrics({ period, startDate, endDate });
  }

  /**
   * GET /api/reports/chart/conversations
   * Dados para gráfico de conversas por dia
   */
  @Get('chart/conversations')
  async getConversationsChart(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log(`GET /reports/chart/conversations - period: ${period}`);
    return this.reportsService.getConversationsChart({ period, startDate, endDate });
  }

  /**
   * GET /api/reports/top-contacts
   * Ranking de contatos por receita/mensagens
   */
  @Get('top-contacts')
  async getTopContacts(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log(`GET /reports/top-contacts - period: ${period}`);
    return this.reportsService.getTopContacts({ period, startDate, endDate });
  }

  /**
   * GET /api/reports/activity
   * Atividade por período (tabela)
   */
  @Get('activity')
  async getActivityByPeriod() {
    this.logger.log('GET /reports/activity');
    return this.reportsService.getActivityByPeriod();
  }

  /**
   * GET /api/reports/export
   * Exportar dados em CSV
   */
  @Get('export')
  async exportData(
    @Res() res: Response,
    @Query('type') type: string = 'all',
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log(`GET /reports/export - type: ${type}, period: ${period}`);
    const result = await this.reportsService.exportData({ period, startDate, endDate }, type);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send('\uFEFF' + result.csv); // BOM for Excel UTF-8 compatibility
  }
}
