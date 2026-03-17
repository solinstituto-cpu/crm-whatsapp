import { Controller, Get, Param, Patch, Body, Post, Delete, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('conversations')
// @UseGuards(JwtAuthGuard) // Temporariamente removido para teste
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      unreadOnly: unreadOnly === 'true',
      assignedToId,
      search,
    };
    return this.conversationsService.findAll(page, limit, status, accountId, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.conversationsService.updateStatus(id, status);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.conversationsService.markMessagesAsRead(id);
  }

  /**
   * Atribuir atendente a uma conversa
   * POST /api/conversations/:id/assign
   */
  @Post(':id/assign')
  assignToUser(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('userName') userName: string,
  ) {
    return this.conversationsService.assignToUser(id, userId, userName);
  }

  /**
   * Liberar atendente de uma conversa
   * POST /api/conversations/:id/unassign
   */
  @Post(':id/unassign')
  unassign(@Param('id') id: string) {
    return this.conversationsService.unassign(id);
  }

  /**
   * Verificar quem está atendendo uma conversa
   * GET /api/conversations/:id/assignment
   */
  @Get(':id/assignment')
  getAssignment(@Param('id') id: string) {
    return this.conversationsService.getAssignment(id);
  }

  @Post(':id/messages')
  addMessage(@Param('id') id: string, @Body() messageData: any) {
    return this.conversationsService.addMessage(id, messageData);
  }

  @Post('find-or-create')
  findOrCreate(@Body('phoneE164') phoneE164: string) {
    return this.conversationsService.findOrCreateByPhone(phoneE164);
  }

  /**
   * Arquivar/Desarquivar conversa
   * PATCH /api/conversations/:id/archive
   */
  @Patch(':id/archive')
  archiveConversation(
    @Param('id') id: string,
    @Body('archived') archived: boolean,
  ) {
    return this.conversationsService.archiveConversation(id, archived);
  }

  /**
   * Popular lastIncomingMessageAt para conversas existentes
   * POST /api/conversations/fix-24h-window
   */
  @Post('fix-24h-window')
  populateLastIncomingMessageAt() {
    return this.conversationsService.populateLastIncomingMessageAt();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(id);
  }
}
