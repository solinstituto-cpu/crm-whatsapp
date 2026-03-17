import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';

@Controller('pipeline')
export class PipelineController {
  private readonly logger = new Logger(PipelineController.name);

  constructor(private readonly pipelineService: PipelineService) {}

  // ==================== STAGES ====================

  @Get('stages')
  async findAllStages() {
    this.logger.log('GET /pipeline/stages');
    return this.pipelineService.findAllStages();
  }

  @Post('stages')
  async createStage(@Body() body: { name: string; color?: string }) {
    this.logger.log(`POST /pipeline/stages - ${body.name}`);
    return this.pipelineService.createStage(body);
  }

  @Patch('stages/:id')
  async updateStage(
    @Param('id') id: string,
    @Body() body: { name?: string; color?: string; order?: number }
  ) {
    this.logger.log(`PATCH /pipeline/stages/${id}`);
    return this.pipelineService.updateStage(id, body);
  }

  @Delete('stages/:id')
  async deleteStage(@Param('id') id: string) {
    this.logger.log(`DELETE /pipeline/stages/${id}`);
    return this.pipelineService.deleteStage(id);
  }

  // ==================== DEALS ====================

  @Get('deals')
  async findAllDeals(
    @Query('stageId') stageId?: string,
    @Query('contactId') contactId?: string,
    @Query('ownerId') ownerId?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
  ) {
    this.logger.log('GET /pipeline/deals');
    return this.pipelineService.findAllDeals({
      stageId,
      contactId,
      ownerId,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    });
  }

  @Get('deals/:id')
  async findDealById(@Param('id') id: string) {
    this.logger.log(`GET /pipeline/deals/${id}`);
    return this.pipelineService.findDealById(id);
  }

  @Post('deals')
  async createDeal(@Body() body: {
    title: string;
    contactId: string;
    stageId: string;
    amount?: number;
    description?: string;
    probability?: number;
    expectedCloseDate?: string;
    source?: string;
    ownerId?: string;
  }) {
    this.logger.log(`POST /pipeline/deals - ${body.title}`);
    return this.pipelineService.createDeal(body);
  }

  @Patch('deals/:id')
  async updateDeal(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      amount?: number;
      description?: string;
      probability?: number;
      expectedCloseDate?: string | null;
      source?: string;
      lostReason?: string;
      ownerId?: string | null;
      stageId?: string;
    }
  ) {
    this.logger.log(`PATCH /pipeline/deals/${id}`);
    return this.pipelineService.updateDeal(id, body);
  }

  @Patch('deals/:id/move')
  async moveDeal(
    @Param('id') id: string,
    @Body() body: { stageId: string }
  ) {
    this.logger.log(`PATCH /pipeline/deals/${id}/move to ${body.stageId}`);
    return this.pipelineService.moveDeal(id, body.stageId);
  }

  @Delete('deals/:id')
  async deleteDeal(@Param('id') id: string) {
    this.logger.log(`DELETE /pipeline/deals/${id}`);
    return this.pipelineService.deleteDeal(id);
  }

  // ==================== STATS ====================

  @Get('stats')
  async getStats() {
    this.logger.log('GET /pipeline/stats');
    return this.pipelineService.getStats();
  }

  // ==================== SEED ====================

  @Post('seed')
  async seedDefaultStages() {
    this.logger.log('POST /pipeline/seed - Creating default stages');
    await this.pipelineService.seedDefaultStages();
    return { message: 'Estágios padrão criados com sucesso' };
  }

  @Delete('reset')
  async resetPipeline() {
    this.logger.log('DELETE /pipeline/reset - Resetting all stages and deals');
    await this.pipelineService.resetPipeline();
    return { message: 'Pipeline resetado com sucesso' };
  }
}
