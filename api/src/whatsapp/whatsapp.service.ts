import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as crypto from 'crypto';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker';
  text?: string;
  image?: {
    link?: string;
    id?: string;
    caption?: string;
  };
  audio?: {
    link?: string;
    id?: string;
  };
  video?: {
    link?: string;
    id?: string;
    caption?: string;
  };
  document?: {
    link?: string;
    id?: string;
    filename?: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contact?: {
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
    };
    phones: Array<{
      phone: string;
      type?: string;
    }>;
  };
  sticker?: {
    link?: string;
    id?: string;
  };
}

export interface WhatsAppTemplate {
  to: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'header' | 'body' | 'footer' | 'button';
      parameters?: Array<{
        type: 'text' | 'image' | 'video' | 'document';
        text?: string;
        image?: { link: string };
        video?: { link: string };
        document?: { link: string };
      }>;
    }>;
  };
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly appSecret: string;
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.phoneNumberId = this.configService.get<string>('META_WA_PHONE_NUMBER_ID');
    this.accessToken = this.configService.get<string>('META_WA_TOKEN');
    this.appSecret = this.configService.get<string>('META_WA_APP_SECRET');
  }

  async sendMessage(message: WhatsAppMessage): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: message.to,
        type: message.type,
        [message.type]: message[message.type],
      };

      const response = await firstValueFrom(
        this.httpService.post<unknown>(url, payload, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      ) as AxiosResponse;

      this.logger.log(`Message sent successfully to ${message.to}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send message to ${message.to}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async sendTemplate(template: WhatsAppTemplate): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: template.to,
        type: 'template',
        template: template.template,
      };

      const response = await firstValueFrom(
        this.httpService.post<unknown>(url, payload, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      ) as AxiosResponse;

      this.logger.log(`Template sent successfully to ${template.to}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send template to ${template.to}:`, error.response?.data || error.message);
      throw error;
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.configService.get<string>('WA_VERIFY_TOKEN');
    
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }
    
    this.logger.warn('Webhook verification failed');
    return null;
  }

  verifySignature(payload: string, signature: string): boolean {
    const appSecret = this.appSecret;
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }

  async markAsRead(messageId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      const response = await firstValueFrom(
        this.httpService.post<unknown>(url, payload, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      ) as AxiosResponse;

      this.logger.log(`Message ${messageId} marked as read`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to mark message as read:`, error.response?.data || error.message);
      throw error;
    }
  }
}

