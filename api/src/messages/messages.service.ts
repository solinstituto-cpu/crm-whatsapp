import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService as WhatsAppMessageService } from '../whatsapp/message.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappMessageService: WhatsAppMessageService,
  ) {}

  async sendMessage(conversationId: string, message: any, sentById: string) {
    return this.whatsappMessageService.sendMessage(conversationId, message, sentById);
  }

  async sendTemplate(conversationId: string, template: any, sentById: string) {
    return this.whatsappMessageService.sendTemplate(conversationId, template, sentById);
  }

  async getConversationMessages(conversationId: string, page = 1, limit = 50) {
    return this.whatsappMessageService.getConversationMessages(conversationId, page, limit);
  }

  async markAsRead(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.waMessageId) {
      // Mark as read in WhatsApp
      // This would call the WhatsApp API to mark as read
      // For now, just update the database
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'READ' },
    });
  }

  async getMessageStats(conversationId?: string, sentById?: string) {
    const where: any = {};
    
    if (conversationId) {
      where.conversationId = conversationId;
    }
    
    if (sentById) {
      where.sentById = sentById;
    }

    const [total, sent, delivered, read, failed] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.message.count({ where: { ...where, status: 'DELIVERED' } }),
      this.prisma.message.count({ where: { ...where, status: 'READ' } }),
      this.prisma.message.count({ where: { ...where, status: 'FAILED' } }),
    ]);

    return {
      total,
      sent,
      delivered,
      read,
      failed,
    };
  }
}

