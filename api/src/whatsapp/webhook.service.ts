import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageService } from './message.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
  ) {}

  async processWebhook(body: any) {
    this.logger.log('Processing webhook data');

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await this.processMessages(change.value);
          }
        }
      }
    }
  }

  private async processMessages(value: any) {
    // Process incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await this.processIncomingMessage(message);
      }
    }

    // Process message status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.processMessageStatus(status);
      }
    }

    // Process errors
    if (value.errors) {
      for (const error of value.errors) {
        await this.processError(error);
      }
    }
  }

  private async processIncomingMessage(message: any) {
    try {
      const phoneNumber = message.from;
      const contact = await this.findOrCreateContact(phoneNumber);
      
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          contactId: contact.id,
          status: { in: ['OPEN', 'PENDING'] },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            contactId: contact.id,
            status: 'OPEN',
          },
        });
      }

      // Update conversation
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastWAStatus: message.status,
          updatedAt: new Date(),
        },
      });

      // Create message record
      await this.messageService.createMessage({
        conversationId: conversation.id,
        direction: 'IN',
        type: this.mapMessageType(message.type),
        body: message.text?.body || this.extractMessageContent(message),
        json: message,
        waMessageId: message.id,
        status: 'DELIVERED',
      });

      // Update contact's last message time
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          lastMessageAt: new Date(),
        },
      });

      this.logger.log(`Processed incoming message from ${phoneNumber}`);
    } catch (error) {
      this.logger.error('Error processing incoming message:', error);
    }
  }

  private async processMessageStatus(status: any) {
    try {
      const message = await this.prisma.message.findFirst({
        where: { waMessageId: status.id },
      });

      if (message) {
        await this.prisma.message.update({
          where: { id: message.id },
          data: {
            status: this.mapStatus(status.status),
          },
        });

        this.logger.log(`Updated message status: ${status.id} -> ${status.status}`);
      }
    } catch (error) {
      this.logger.error('Error processing message status:', error);
    }
  }

  private async processError(error: any) {
    this.logger.error('WhatsApp API error:', error);
  }

  private async findOrCreateContact(phoneNumber: string) {
    let contact = await this.prisma.contact.findUnique({
      where: { phoneE164: phoneNumber },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          name: phoneNumber,
          phoneE164: phoneNumber,
          tags: [],
        },
      });
    }

    return contact;
  }

  private mapMessageType(type: string): any {
    const typeMap = {
      'text': 'TEXT',
      'image': 'IMAGE',
      'audio': 'AUDIO',
      'video': 'VIDEO',
      'document': 'DOCUMENT',
      'location': 'LOCATION',
      'contacts': 'CONTACT',
      'sticker': 'STICKER',
    };

    return typeMap[type] || 'TEXT';
  }

  private mapStatus(status: string): any {
    const statusMap = {
      'sent': 'SENT',
      'delivered': 'DELIVERED',
      'read': 'READ',
      'failed': 'FAILED',
    };

    return statusMap[status] || 'PENDING';
  }

  private extractMessageContent(message: any): string {
    if (message.text?.body) return message.text.body;
    if (message.image?.caption) return `[Image: ${message.image.caption}]`;
    if (message.video?.caption) return `[Video: ${message.video.caption}]`;
    if (message.document?.filename) return `[Document: ${message.document.filename}]`;
    if (message.location) return `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
    if (message.contacts) return `[Contact: ${message.contacts.name?.formatted_name}]`;
    if (message.sticker) return '[Sticker]';
    
    return '[Media message]';
  }
}

