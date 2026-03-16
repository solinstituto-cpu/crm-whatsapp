import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/conversations/:conversationId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: {
      type: string;
      text?: string;
      image?: any;
      audio?: any;
      video?: any;
      document?: any;
      location?: any;
      contact?: any;
      sticker?: any;
    },
    @Req() req: { user: { id: string } },
  ) {
    return this.messagesService.sendMessage(conversationId, body, req.user.id);
  }

  @Post('template')
  async sendTemplate(
    @Param('conversationId') conversationId: string,
    @Body() body: {
      template: {
        name: string;
        language: { code: string };
        components?: any[];
      };
    },
    @Req() req: { user: { id: string } },
  ) {
    return this.messagesService.sendTemplate(conversationId, body.template, req.user.id);
  }

  @Get()
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getConversationMessages(
      conversationId,
      parseInt(page) || 1,
      parseInt(limit) || 50,
    );
  }

  @Put(':messageId/read')
  async markAsRead(@Param('messageId') messageId: string) {
    return this.messagesService.markAsRead(messageId);
  }

  @Get('stats')
  async getStats(
    @Param('conversationId') conversationId: string,
    @Query('sentById') sentById?: string,
  ) {
    return this.messagesService.getMessageStats(conversationId, sentById);
  }
}

