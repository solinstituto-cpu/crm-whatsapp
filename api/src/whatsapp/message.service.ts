import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from './whatsapp.service';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async createMessage(data: {
    conversationId: string;
    direction: 'IN' | 'OUT';
    type: string;
    body?: string;
    json?: any;
    waMessageId?: string;
    status?: string;
    sentById?: string;
  }) {
    return this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        direction: data.direction,
        type: data.type as any,
        body: data.body,
        json: data.json,
        waMessageId: data.waMessageId,
        status: data.status as any,
        sentById: data.sentById,
      },
    });
  }

  async sendMessage(conversationId: string, message: any, sentById: string) {
    try {
      // Get conversation and contact
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check if contact has opted out
      if (conversation.contact.optOut) {
        throw new Error('Contact has opted out');
      }

      // Check 24-hour window
      const isWithinWindow = this.isWithin24HourWindow(conversation.contact.lastMessageAt);
      
      if (!isWithinWindow && message.type !== 'template') {
        throw new Error('Contact is outside 24-hour window. Only templates allowed.');
      }

      // Send via WhatsApp API
      const response = await this.whatsappService.sendMessage({
        to: conversation.contact.phoneE164,
        type: message.type,
        ...message,
      });

      // Save message to database
      const savedMessage = await this.createMessage({
        conversationId,
        direction: 'OUT',
        type: message.type,
        body: message.text || this.extractMessageContent(message),
        json: message,
        waMessageId: response.messages?.[0]?.id,
        status: 'SENT',
        sentById,
      });

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Message sent successfully to ${conversation.contact.phoneE164}`);
      return savedMessage;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  async sendTemplate(conversationId: string, template: any, sentById: string) {
    try {
      // Get conversation and contact
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check if contact has opted out
      if (conversation.contact.optOut) {
        throw new Error('Contact has opted out');
      }

      // Send via WhatsApp API
      const response = await this.whatsappService.sendTemplate({
        to: conversation.contact.phoneE164,
        template: template,
      });

      // Save message to database
      const savedMessage = await this.createMessage({
        conversationId,
        direction: 'OUT',
        type: 'TEXT',
        body: `Template: ${template.name}`,
        json: template,
        waMessageId: response.messages?.[0]?.id,
        status: 'SENT',
        sentById,
      });

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Template sent successfully to ${conversation.contact.phoneE164}`);
      return savedMessage;
    } catch (error) {
      this.logger.error('Error sending template:', error);
      throw error;
    }
  }

  private isWithin24HourWindow(lastMessageAt: Date | null): boolean {
    if (!lastMessageAt) return false;
    
    const now = new Date();
    const diffInHours = (now.getTime() - lastMessageAt.getTime()) / (1000 * 60 * 60);
    
    return diffInHours <= 24;
  }

  private extractMessageContent(message: any): string {
    if (message.text) return message.text;
    if (message.image?.caption) return `[Image: ${message.image.caption}]`;
    if (message.video?.caption) return `[Video: ${message.video.caption}]`;
    if (message.document?.filename) return `[Document: ${message.document.filename}]`;
    if (message.location) return `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
    if (message.contact) return `[Contact: ${message.contact.name?.formatted_name}]`;
    if (message.sticker) return '[Sticker]';
    
    return '[Media message]';
  }

  async getConversationMessages(conversationId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sentBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.message.count({
        where: { conversationId },
      }),
    ]);

    return {
      messages: messages.reverse(),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

