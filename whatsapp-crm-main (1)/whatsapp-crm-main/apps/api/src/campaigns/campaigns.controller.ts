import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
export class CampaignsController {
  private readonly logger = new Logger(CampaignsController.name);

  constructor(private readonly campaignsService: CampaignsService) {}

  // ==========================================
  // CRUD
  // ==========================================

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.campaignsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
    );
  }

  @Get('stats')
  async getStats() {
    return this.campaignsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Get(':id/messages')
  async getCampaignMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.campaignsService.getCampaignMessages(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      status,
    );
  }

  @Post()
  async create(@Body() body: {
    name: string;
    description?: string;
    templateName: string;
    templateLanguage?: string;
    templateVariables?: any;
    filterTags?: string[];
    filterStatus?: string;
    filterSource?: string;
    filterCustomFields?: any;
    excludeOptOut?: boolean;
    scheduledAt?: string;
    sendRatePerMinute?: number;
    sendStartHour?: number;
    sendEndHour?: number;
    sendDays?: string; // "0,1,2,3,4,5,6" (0=Dom...6=Sab)
  }) {
    this.logger.log(`Criando campanha: ${body.name}`);
    return this.campaignsService.create({
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      templateName?: string;
      templateLanguage?: string;
      templateVariables?: any;
      filterTags?: string[];
      filterStatus?: string;
      filterSource?: string;
      excludeOptOut?: boolean;
      scheduledAt?: string;
      sendRatePerMinute?: number;
    },
  ) {
    return this.campaignsService.update(id, {
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.campaignsService.delete(id);
  }

  // ==========================================
  // AÇÕES
  // ==========================================

  @Post('preview-contacts')
  async previewContacts(@Body() body: {
    filterTags?: string[];
    filterStatus?: string;
    filterSource?: string;
    excludeOptOut?: boolean;
  }) {
    return this.campaignsService.previewContacts(body);
  }

  @Post(':id/start')
  async start(@Param('id') id: string, @Body() body?: { force?: boolean }) {
    this.logger.log(`Iniciando campanha: ${id}`);
    return this.campaignsService.start(id, body?.force || false);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    this.logger.log(`Pausando campanha: ${id}`);
    return this.campaignsService.pause(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    this.logger.log(`Cancelando campanha: ${id}`);
    return this.campaignsService.cancel(id);
  }
}
