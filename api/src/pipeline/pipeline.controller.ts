import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/pipeline')
@UseGuards(JwtAuthGuard)
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  // Stages
  @Get('stages')
  async getStages() {
    return this.pipelineService.getStages();
  }

  @Post('stages')
  async createStage(@Body() body: { name: string; order: number }) {
    return this.pipelineService.createStage(body);
  }

  @Put('stages/:id')
  async updateStage(
    @Param('id') id: string,
    @Body() body: { name?: string; order?: number },
  ) {
    return this.pipelineService.updateStage(id, body);
  }

  @Delete('stages/:id')
  async deleteStage(@Param('id') id: string) {
    return this.pipelineService.deleteStage(id);
  }

  // Deals
  @Get('deals')
  async getDeals(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('stageId') stageId?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.pipelineService.getDeals(
      parseInt(page) || 1,
      parseInt(limit) || 50,
      stageId,
      assignedToId,
    );
  }

  @Get('deals/:id')
  async getDeal(@Param('id') id: string) {
    return this.pipelineService.getDeal(id);
  }

  @Post('deals')
  async createDeal(@Body() body: {
    contactId: string;
    stageId: string;
    amount?: number;
    notes?: string;
    assignedToId?: string;
  }) {
    return this.pipelineService.createDeal(body);
  }

  @Put('deals/:id')
  async updateDeal(
    @Param('id') id: string,
    @Body() body: {
      stageId?: string;
      amount?: number;
      notes?: string;
      assignedToId?: string;
    },
  ) {
    return this.pipelineService.updateDeal(id, body);
  }

  @Put('deals/:id/move')
  async moveDeal(
    @Param('id') id: string,
    @Body() body: { stageId: string },
  ) {
    return this.pipelineService.moveDeal(id, body.stageId);
  }

  @Delete('deals/:id')
  async deleteDeal(@Param('id') id: string) {
    return this.pipelineService.deleteDeal(id);
  }

  @Get('stats')
  async getStats() {
    return this.pipelineService.getPipelineStats();
  }
}

