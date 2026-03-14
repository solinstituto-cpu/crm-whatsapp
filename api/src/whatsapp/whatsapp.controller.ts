import { Controller, Get, Post, Body, Headers, Query, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { WhatsAppService, WhatsAppMessage, WhatsAppTemplate } from './whatsapp.service';
import { WebhookService } from './webhook.service';

@Controller('api/wa')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly webhookService: WebhookService,
  ) {}

  @Get('webhook')
  @UseGuards(ThrottlerGuard)
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    this.logger.log('Webhook verification request received');
    return this.whatsappService.verifyWebhook(mode, token, challenge);
  }

  @Post('webhook')
  @UseGuards(ThrottlerGuard)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    this.logger.log('Webhook event received');
    
    // Verify signature if provided
    if (signature) {
      const rawBody = JSON.stringify(body);
      const isValid = this.whatsappService.verifySignature(rawBody, signature);
      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        return { status: 'error', message: 'Invalid signature' };
      }
    }

    try {
      await this.webhookService.processWebhook(body);
      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return { status: 'error', message: error.message };
    }
  }

  @Post('send')
  async sendMessage(@Body() message: WhatsAppMessage) {
    this.logger.log(`Sending message to ${message.to}`);
    return this.whatsappService.sendMessage(message);
  }

  @Post('send-template')
  async sendTemplate(@Body() template: WhatsAppTemplate) {
    this.logger.log(`Sending template to ${template.to}`);
    return this.whatsappService.sendTemplate(template);
  }
}

