import { Controller, Post, Body, Get, Query, Param, Res, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WhatsAppService } from './whatsapp.service';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  SendMessageDto, 
  SendTemplateDto, 
  WhatsAppWebhookDto,
  SendMessageSchema,
  SendTemplateSchema,
  WhatsAppWebhookSchema
} from '../common/schemas';
import { ZodValidationPipe } from '../common/validation.pipe';

@Controller('wa')
@UseGuards(ThrottlerGuard)
export class WhatsAppController {
  constructor(
    private whatsappService: WhatsAppService,
    private webhookService: WebhookService,
    private configService: ConfigService,
  ) {}

  // Webhook verification (GET)
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken = this.configService.get<string>('WA_VERIFY_TOKEN');
    
    if (mode === 'subscribe' && verifyToken === expectedToken) {
      return challenge;
    }
    
    return 'Forbidden';
  }

  // Webhook events (POST)
  @Post('webhook')
  async handleWebhook(
    @Body(new ZodValidationPipe(WhatsAppWebhookSchema)) webhookData: WhatsAppWebhookDto,
  ) {
    await this.webhookService.processWebhook(webhookData);
    return { status: 'ok' };
  }

  // Send message (public endpoint for frontend - skips 24h window check)
  @Post('send-public')
  async sendMessagePublic(
    @Body() body: { 
      to: string; 
      text?: string; 
      type?: 'text' | 'image' | 'document' | 'audio' | 'video' | 'interactive' | 'contacts';
      media?: { id?: string; link?: string; caption?: string; filename?: string };
      interactive?: any;
      contacts?: any[];
      context?: { message_id: string };
      userId?: string;
    },
  ) {
    console.log('📨 send-public received:', JSON.stringify(body, null, 2));
    
    const sendMessageDto: SendMessageDto = {
      to: body.to,
      text: body.text,
      type: body.type || 'text',
      media: body.media,
    };
    
    // Adicionar campos extras se presentes
    if (body.interactive) {
      (sendMessageDto as any).interactive = body.interactive;
    }
    if (body.contacts) {
      (sendMessageDto as any).contacts = body.contacts;
    }
    if (body.context) {
      (sendMessageDto as any).context = body.context;
    }
    
    console.log('📤 Sending to WhatsAppService:', JSON.stringify(sendMessageDto, null, 2));
    
    // Cancelar sessões ativas (IA) já que um humano interagiu
    await this.whatsappService.cancelActiveFlows(sendMessageDto.to, body.userId);
    // Skip 24-hour window check for CRM interface
    return this.whatsappService.sendMessage(sendMessageDto, true);
  }

  // Send message (protected with JWT)
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Body(new ZodValidationPipe(SendMessageSchema)) sendMessageDto: SendMessageDto,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    await this.whatsappService.cancelActiveFlows(sendMessageDto.to, userId);
    return this.whatsappService.sendMessage(sendMessageDto);
  }

  // Send template (public endpoint for frontend)
  @Post('send-template')
  async sendTemplate(
    @Body() body: { to: string; templateName: string; language?: string; bodyText?: string; components?: any[]; userId?: string },
  ) {
    const sendTemplateDto: SendTemplateDto = {
      to: body.to,
      templateName: body.templateName,
      language: body.language || 'en_US',
      bodyText: body.bodyText,
      components: body.components,
    };
    await this.whatsappService.cancelActiveFlows(sendTemplateDto.to, body.userId);
    return this.whatsappService.sendTemplate(sendTemplateDto);
  }

  // Upload media to Meta API
  @Post('upload-media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.whatsappService.uploadMedia(file.buffer, file.mimetype, file.originalname);
  }
  
  // Proxy para servir mídias do WhatsApp (áudios, imagens, vídeos, documentos)
  // Baixa a mídia do WhatsApp usando autenticação e retorna para o frontend
  @Get('media/:mediaId')
  async getMedia(@Param('mediaId') mediaId: string, @Res() res: Response) {
    try {
      const media = await this.whatsappService.downloadMedia(mediaId);
      
      if (!media) {
        return res.status(404).json({ error: 'Media not found or expired' });
      }
      
      // Definir headers apropriados
      res.setHeader('Content-Type', media.mimeType);
      res.setHeader('Content-Length', media.buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 1 dia
      
      return res.send(media.buffer);
    } catch (error) {
      console.error('Error fetching media:', error);
      return res.status(500).json({ error: 'Failed to fetch media' });
    }
  }

  // Health check
  @Get('health')
  getHealth() {
    return { 
      status: 'ok', 
      service: 'whatsapp',
      timestamp: new Date().toISOString(),
    };
  }

  // Debug account info & token validity (secured later if needed)
  @Get('debug/account')
  async debugAccount() {
    return this.whatsappService.getAccountDebug();
  }
}