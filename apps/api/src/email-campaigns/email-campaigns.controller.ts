import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EmailCampaignsService } from './email-campaigns.service';

@Controller('email-campaigns')
export class EmailCampaignsController {
  constructor(private readonly emailCampaignsService: EmailCampaignsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.emailCampaignsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
    );
  }

  @Get('stats')
  async getStats() {
    return this.emailCampaignsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.emailCampaignsService.findOne(id);
  }

  @Post()
  async create(
    @Body() body: {
      name: string;
      description?: string;
      subject: string;
      preheader?: string;
      htmlTemplate: string;
      filterTags?: string[];
      filterStatus?: string;
      filterSource?: string;
      excludeOptOut?: boolean;
      sendRatePerMinute?: number;
      fromEmail?: string;
      fromName?: string;
    },
  ) {
    return this.emailCampaignsService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      description?: string;
      subject?: string;
      preheader?: string;
      htmlTemplate?: string;
      filterTags?: string[];
      filterStatus?: string;
      filterSource?: string;
      excludeOptOut?: boolean;
      sendRatePerMinute?: number;
      fromEmail?: string;
      fromName?: string;
    },
  ) {
    return this.emailCampaignsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.emailCampaignsService.delete(id);
  }

  @Post('preview-contacts')
  async previewContacts(
    @Body() body: {
      filterTags?: string[];
      filterStatus?: string;
      filterSource?: string;
      excludeOptOut?: boolean;
    },
  ) {
    return this.emailCampaignsService.previewContacts(body);
  }

  @Post(':id/start')
  async start(@Param('id') id: string, @Body() body?: { force?: boolean }) {
    return this.emailCampaignsService.start(id, body?.force || false);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.emailCampaignsService.pause(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.emailCampaignsService.cancel(id);
  }
}

