import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, Req } from '@nestjs/common';
import { EmailCampaignsService } from './email-campaigns.service';
import { Request, Response } from 'express';

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

  @Get(':id/messages')
  async listMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('engagement') engagement?: string,
    @Query('search') search?: string,
  ) {
    return this.emailCampaignsService.listMessages(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      status,
      engagement,
      search,
    });
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
      filterCustomFields?: any;
      excludeOptOut?: boolean;
      sendRatePerMinute?: number;
      fromEmail?: string;
      fromName?: string;
      scheduledAt?: string;
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
      filterCustomFields?: any;
      excludeOptOut?: boolean;
      sendRatePerMinute?: number;
      fromEmail?: string;
      fromName?: string;
      scheduledAt?: string | null;
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

  @Post(':id/schedule')
  async schedule(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string },
  ) {
    return this.emailCampaignsService.schedule(id, body?.scheduledAt);
  }

  @Post(':id/unschedule')
  async unschedule(@Param('id') id: string) {
    return this.emailCampaignsService.unschedule(id);
  }

  @Post(':id/pause')
  async pause(@Param('id') id: string) {
    return this.emailCampaignsService.pause(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.emailCampaignsService.cancel(id);
  }

  @Post(':id/reprocess-failed')
  async reprocessFailed(@Param('id') id: string) {
    return this.emailCampaignsService.reprocessFailed(id);
  }

  @Post(':id/followup-opened-not-clicked')
  async createFollowupOpenedNotClicked(
    @Param('id') id: string,
    @Body()
    body?: {
      name?: string;
      subject?: string;
      htmlTemplate?: string;
      autoStart?: boolean;
    },
  ) {
    return this.emailCampaignsService.createFollowupForOpenedNotClicked(id, body);
  }

  @Get(':id/export.csv')
  async exportMessagesCsv(@Param('id') id: string, @Res() res: Response) {
    const data = await this.emailCampaignsService.exportMessagesCsv(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${data.fileName}"`);
    return res.status(200).send(`\uFEFF${data.csv}`);
  }

  @Get('track/open/:messageId')
  async trackOpen(
    @Param('messageId') messageId: string,
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const payload = await this.emailCampaignsService.trackOpen({
      messageId,
      token,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || null,
    });

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).send(payload);
  }

  @Get('track/click/:messageId')
  async trackClick(
    @Param('messageId') messageId: string,
    @Query('token') token: string,
    @Query('url') url: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const targetUrl = await this.emailCampaignsService.trackClick({
      messageId,
      token,
      url,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || null,
    });
    return res.redirect(targetUrl);
  }
}

