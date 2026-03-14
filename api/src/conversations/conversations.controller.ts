import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.conversationsService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 50,
      status,
      assignedToId,
    );
  }

  @Get('stats')
  async getStats(@Query('assignedToId') assignedToId?: string) {
    return this.conversationsService.getStats(assignedToId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.conversationsService.findById(id);
  }

  @Post()
  async create(@Body() body: { contactId: string; assignedToId?: string }) {
    return this.conversationsService.create(body.contactId, body.assignedToId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      status?: 'OPEN' | 'PENDING' | 'CLOSED';
      assignedToId?: string;
    },
  ) {
    return this.conversationsService.update(id, body);
  }

  @Put(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body() body: { assignedToId: string },
  ) {
    return this.conversationsService.assign(id, body.assignedToId);
  }

  @Put(':id/close')
  async close(@Param('id') id: string) {
    return this.conversationsService.close(id);
  }
}

