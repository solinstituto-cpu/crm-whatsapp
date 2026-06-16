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
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken = this.configService.get<string>('WA_VERIFY_TOKEN') || 
                          this.configService.get<string>('WHATSAPP_VERIFY_TOKEN') || 
                          'sol_verify_token';
    
    if (mode === 'subscribe') {
      if (verifyToken === expectedToken || verifyToken === 'sol123' || verifyToken === 'sol_webhook_token') {
        return challenge;
      }

      // Check against database tokens
      const isDbTokenValid = await this.whatsappService.verifyDatabaseToken(verifyToken);
      if (isDbTokenValid) {
        return challenge;
      }
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
      accountId?: string;
    },
    @Res({ passthrough: true }) res: Response,
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
    
    try {
      // Cancelar sessões ativas (IA) já que um humano interagiu
      await this.whatsappService.cancelActiveFlows(sendMessageDto.to, body.userId);
      // Skip 24-hour window check for CRM interface
      const result = await this.whatsappService.sendMessage(sendMessageDto, true, body.accountId);
      return result;
    } catch (error: any) {
      // Extrair mensagem de erro detalhada
      const axiosData = error?.response?.data;
      const metaError = axiosData?.error;
      const statusCode = error?.response?.status || 500;
      
      // Montar mensagem de erro legível
      let errorMessage = error.message || 'Erro desconhecido ao enviar mensagem';
      
      if (metaError) {
        // Erro da API do Meta/WhatsApp
        errorMessage = metaError.message || errorMessage;
        if (metaError.error_subcode) {
          errorMessage += ` (código: ${metaError.error_subcode})`;
        }
        // Erros comuns do Meta traduzidos
        if (metaError.code === 190) {
          errorMessage = 'Token de acesso do WhatsApp expirado ou inválido. Atualize o token nas Configurações > Contas WhatsApp.';
        } else if (metaError.code === 131026) {
          errorMessage = 'Mensagem não foi entregue. O contato pode não ter WhatsApp ou o número é inválido.';
        } else if (metaError.code === 131047) {
          errorMessage = 'Janela de 24h expirada. Envie um template ao invés de mensagem livre.';
        } else if (metaError.code === 131031) {
          errorMessage = 'A conta WhatsApp Business não está verificada ou está com restrição.';
        }
      }
      
      console.error('❌ send-public error:', {
        message: errorMessage,
        statusCode,
        metaError: metaError ? JSON.stringify(metaError).slice(0, 500) : undefined,
        originalError: error.message,
      });
      
      res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500);
      return {
        statusCode: statusCode >= 400 && statusCode < 600 ? statusCode : 500,
        message: errorMessage,
        error: 'Falha no envio da mensagem',
      };
    }
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
    @Body() body: { to: string; templateName: string; language?: string; bodyText?: string; components?: any[]; userId?: string; accountId?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const sendTemplateDto: SendTemplateDto = {
      to: body.to,
      templateName: body.templateName,
      language: body.language || 'en_US',
      bodyText: body.bodyText,
      components: body.components,
    };
    
    try {
      await this.whatsappService.cancelActiveFlows(sendTemplateDto.to, body.userId);
      return await this.whatsappService.sendTemplate(sendTemplateDto, body.accountId);
    } catch (error: any) {
      const axiosData = error?.response?.data;
      const metaError = axiosData?.error;
      const statusCode = error?.response?.status || 500;
      
      let errorMessage = error.message || 'Erro desconhecido ao enviar template';
      
      if (metaError) {
        errorMessage = metaError.message || errorMessage;
        if (metaError.code === 190) {
          errorMessage = 'Token de acesso do WhatsApp expirado ou inválido. Atualize o token nas Configurações > Contas WhatsApp.';
        } else if (metaError.code === 100 && metaError.error_subcode === 33) {
          errorMessage = `Template "${body.templateName}" não encontrado ou não aprovado pelo Meta.`;
        }
      }
      
      console.error('❌ send-template error:', {
        message: errorMessage,
        statusCode,
        metaError: metaError ? JSON.stringify(metaError).slice(0, 500) : undefined,
      });
      
      res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500);
      return {
        statusCode: statusCode >= 400 && statusCode < 600 ? statusCode : 500,
        message: errorMessage,
        error: 'Falha no envio do template',
      };
    }
  }

  // Upload media to Meta API
  @Post('upload-media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: any,
    @Query('accountId') accountId?: string,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.whatsappService.uploadMedia(file.buffer, file.mimetype, file.originalname, accountId);
  }
  
  // Proxy para servir mídias do WhatsApp (áudios, imagens, vídeos, documentos)
  // Baixa a mídia do WhatsApp usando autenticação e retorna para o frontend
  @Get('media/:mediaId')
  async getMedia(
    @Param('mediaId') mediaId: string,
    @Res() res: Response,
    @Query('accountId') accountId?: string,
  ) {
    try {
      const media = await this.whatsappService.downloadMedia(mediaId, accountId);
      
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
      version: '2.2.0-contacts-per-account',
      build: '20260615',
    };
  }

  // Debug account info & token validity (secured later if needed)
  @Get('debug/account')
  async debugAccount() {
    return this.whatsappService.getAccountDebug();
  }

  // Diagnóstico das contas WhatsApp (público para debug rápido)
  @Get('debug/accounts')
  async debugAccounts() {
    return this.whatsappService.getAccountsDiagnostics();
  }
}