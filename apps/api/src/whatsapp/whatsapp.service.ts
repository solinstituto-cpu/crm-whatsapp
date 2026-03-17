import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto, SendTemplateDto } from '../common/schemas';

// Interface para credenciais de uma conta WhatsApp
interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
  apiUrl: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiVersion: string;
  
  // Credenciais padrão do .env (fallback)
  private readonly defaultPhoneNumberId: string;
  private readonly defaultAccessToken: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.defaultPhoneNumberId = this.configService.get<string>('WHATSAPP_BUSINESS_PHONE_ID');
    this.defaultAccessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    // Allow overriding API version via env WHATSAPP_API_VERSION (default v22.0)
    this.apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION') || 'v22.0';
  }

  /**
   * Obtém as credenciais para uma conta específica ou a conta padrão
   * Prioridade: accountId > conta padrão do banco > variáveis de ambiente
   */
  async getCredentials(accountId?: string): Promise<WhatsAppCredentials> {
    let phoneNumberId = this.defaultPhoneNumberId;
    let accessToken = this.defaultAccessToken;

    try {
      if (accountId) {
        // Busca conta específica
        const account = await this.prisma.whatsAppAccount.findUnique({
          where: { id: accountId },
        });
        if (account && account.isActive) {
          phoneNumberId = account.phoneNumberId;
          accessToken = account.accessToken;
        }
      } else {
        // Busca conta padrão do banco
        const defaultAccount = await this.prisma.whatsAppAccount.findFirst({
          where: { isDefault: true, isActive: true },
        });
        if (defaultAccount) {
          phoneNumberId = defaultAccount.phoneNumberId;
          accessToken = defaultAccount.accessToken;
        }
      }
    } catch (error) {
      // Se der erro (ex: tabela não existe ainda), usa fallback do .env
      this.logger.warn(`Usando credenciais do .env (fallback): ${error.message}`);
    }

    const apiUrl = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

    return { phoneNumberId, accessToken, apiUrl };
  }

  /**
   * Busca uma conta pelo phoneNumberId (usado no webhook)
   */
  async getAccountByPhoneNumberId(phoneNumberId: string) {
    try {
      return await this.prisma.whatsAppAccount.findUnique({
        where: { phoneNumberId },
      });
    } catch {
      return null;
    }
  }

  // Propriedades legadas para compatibilidade (serão removidas no futuro)
  private get phoneNumberId() { return this.defaultPhoneNumberId; }
  private get accessToken() { return this.defaultAccessToken; }
  private get apiUrl() { return `https://graph.facebook.com/${this.apiVersion}/${this.defaultPhoneNumberId}/messages`; }

  async sendMessage(sendMessageDto: SendMessageDto, skipWindowCheck = false, accountId?: string) {
    try {
      // Obtém credenciais da conta (ou padrão)
      const credentials = await this.getCredentials(accountId);

      // Check if contact has opted out
      const contact = await this.prisma.contact.findUnique({
        where: { phoneE164: sendMessageDto.to },
      });

      if (contact?.optedOut) {
        throw new Error('Contact has opted out');
      }

      // Check 24-hour window (skip if explicitly requested)
      if (!skipWindowCheck) {
        const canSendFreeform = await this.isWithin24HourWindow(sendMessageDto.to);
        
        if (!canSendFreeform) {
          throw new Error('Outside 24-hour window. Use template message instead.');
        }
      }

      const payload = this.buildMessagePayload(sendMessageDto);
      
      const started = Date.now();
      const response = await axios.post(credentials.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const elapsed = Date.now() - started;

      // Save to database
      await this.saveOutboundMessage(sendMessageDto, response.data.messages[0].id);

      this.logger.log(`outbound_text_ok to=${sendMessageDto.to} type=${sendMessageDto.type} waId=${response.data?.messages?.[0]?.id} ms=${elapsed}`);
      return response.data;
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`outbound_text_fail to=${sendMessageDto.to} err=${error.message} api=${this.apiVersion} details=${JSON.stringify(data)?.slice(0,300)}`);
      throw error;
    }
  }

  async sendTemplate(sendTemplateDto: SendTemplateDto, accountId?: string) {
    try {
      // Obtém credenciais da conta (ou padrão)
      const credentials = await this.getCredentials(accountId);

      const contact = await this.prisma.contact.findUnique({
        where: { phoneE164: sendTemplateDto.to },
      });

      if (contact?.optedOut) {
        throw new Error('Contact has opted out');
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: sendTemplateDto.to,
        type: 'template',
        template: {
          name: sendTemplateDto.templateName,
          language: {
            code: sendTemplateDto.language,
          },
          components: sendTemplateDto.components || [],
        },
      };

      const started = Date.now();
      const response = await axios.post(credentials.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const elapsed = Date.now() - started;

      // Save to database
      await this.saveOutboundTemplate(sendTemplateDto, response.data.messages[0].id);

      this.logger.log(`outbound_template_ok to=${sendTemplateDto.to} template=${sendTemplateDto.templateName} waId=${response.data?.messages?.[0]?.id} ms=${elapsed}`);
      return response.data;
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`outbound_template_fail to=${sendTemplateDto.to} template=${sendTemplateDto.templateName} err=${error.message} api=${this.apiVersion} details=${JSON.stringify(data)?.slice(0,300)}`);
      throw error;
    }
  }

  private buildMessagePayload(sendMessageDto: SendMessageDto) {
    const basePayload: any = {
      messaging_product: 'whatsapp',
      to: sendMessageDto.to,
      type: sendMessageDto.type,
    };

    // Adicionar contexto se for reply a uma mensagem
    if ((sendMessageDto as any).context?.message_id) {
      basePayload.context = {
        message_id: (sendMessageDto as any).context.message_id,
      };
    }

    switch (sendMessageDto.type) {
      case 'text':
        return {
          ...basePayload,
          text: {
            body: sendMessageDto.text,
          },
        };
      
      case 'image':
        if (!sendMessageDto.media) {
          throw new Error(`Media field is required for type: ${sendMessageDto.type}`);
        }
        // Imagens: id ou link + caption opcional (sem filename)
        return {
          ...basePayload,
          image: {
            ...(sendMessageDto.media.id ? { id: sendMessageDto.media.id } : { link: sendMessageDto.media.link }),
            ...(sendMessageDto.media.caption && { caption: sendMessageDto.media.caption }),
          },
        };
      
      case 'document':
        if (!sendMessageDto.media) {
          throw new Error(`Media field is required for type: ${sendMessageDto.type}`);
        }
        // Documentos: id ou link + caption + filename
        return {
          ...basePayload,
          document: {
            ...(sendMessageDto.media.id ? { id: sendMessageDto.media.id } : { link: sendMessageDto.media.link }),
            ...(sendMessageDto.media.caption && { caption: sendMessageDto.media.caption }),
            ...(sendMessageDto.media.filename && { filename: sendMessageDto.media.filename }),
          },
        };
      
      case 'audio':
        if (!sendMessageDto.media) {
          throw new Error(`Media field is required for type: ${sendMessageDto.type}`);
        }
        // Áudio: apenas id ou link (sem caption nem filename)
        return {
          ...basePayload,
          audio: {
            ...(sendMessageDto.media.id ? { id: sendMessageDto.media.id } : { link: sendMessageDto.media.link }),
          },
        };
      
      case 'video':
        if (!sendMessageDto.media) {
          throw new Error(`Media field is required for type: ${sendMessageDto.type}`);
        }
        // Vídeo: id ou link + caption opcional (sem filename)
        return {
          ...basePayload,
          video: {
            ...(sendMessageDto.media.id ? { id: sendMessageDto.media.id } : { link: sendMessageDto.media.link }),
            ...(sendMessageDto.media.caption && { caption: sendMessageDto.media.caption }),
          },
        };
      
      case 'interactive':
        // Mensagens interativas com botões ou listas
        const interactive = (sendMessageDto as any).interactive;
        if (!interactive) {
          throw new Error('Interactive message requires interactive field');
        }
        
        const interactivePayload: any = {
          type: interactive.type,
          body: {
            text: interactive.body.text,
          },
        };
        
        // Header (opcional)
        if (interactive.header) {
          interactivePayload.header = interactive.header;
        }
        
        // Footer (opcional)
        if (interactive.footer?.text) {
          interactivePayload.footer = { text: interactive.footer.text };
        }
        
        // Action (botões ou lista)
        interactivePayload.action = interactive.action;
        
        return {
          ...basePayload,
          interactive: interactivePayload,
        };
      
      case 'contacts':
        // Mensagens de contato
        const contacts = (sendMessageDto as any).contacts;
        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
          throw new Error('Contacts message requires contacts array');
        }
        return {
          ...basePayload,
          contacts: contacts,
        };
      
      default:
        throw new Error(`Unsupported message type: ${sendMessageDto.type}`);
    }
  }

  private async isWithin24HourWindow(phoneNumber: string): Promise<boolean> {
    const contact = await this.prisma.contact.findUnique({
      where: { phoneE164: phoneNumber },
      include: {
        conversations: {
          include: {
            messages: {
              where: { direction: 'IN' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!contact || !contact.conversations.length) {
      return false;
    }

    const lastInboundMessage = contact.conversations
      .flatMap(conv => conv.messages)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!lastInboundMessage) {
      return false;
    }

    const timeDiff = Date.now() - lastInboundMessage.createdAt.getTime();
    const hours24InMs = 24 * 60 * 60 * 1000;

    return timeDiff <= hours24InMs;
  }

  private async saveOutboundMessage(sendMessageDto: SendMessageDto, waMessageId: string) {
    // Find or create contact
    let contact = await this.prisma.contact.findUnique({
      where: { phoneE164: sendMessageDto.to },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          name: sendMessageDto.to,
          phoneE164: sendMessageDto.to,
          tags: JSON.stringify([]),
        },
      });
    }

    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          contactId: contact.id,
          phoneE164: sendMessageDto.to,
          status: 'OPEN',
        },
      });
    }

    // Create message
    // Determinar body e json baseado no tipo
    let messageBody = sendMessageDto.text || null;
    let messageJson: any = sendMessageDto.media ? { ...sendMessageDto.media } : {};
    
    // Para mensagens interativas, extrair texto do body e salvar estrutura completa
    const interactiveData = (sendMessageDto as any).interactive;
    if (sendMessageDto.type === 'interactive' && interactiveData) {
      messageBody = interactiveData.body?.text || 'Mensagem interativa';
      messageJson = {
        ...messageJson,
        interactive: interactiveData,
        type: interactiveData.type,
        buttons: interactiveData.action?.buttons || [],
      };
    }
    
    // Para mensagens de contato
    const contactsData = (sendMessageDto as any).contacts;
    if (sendMessageDto.type === 'contacts' && contactsData) {
      const firstContact = contactsData[0];
      messageBody = firstContact?.name?.formatted_name || 'Contato';
      messageJson = {
        ...messageJson,
        contacts: contactsData,
      };
    }
    
    // Para contexto de reply - salvar sempre que houver
    const contextData = (sendMessageDto as any).context;
    if (contextData?.message_id) {
      messageJson = {
        ...messageJson,
        context: { id: contextData.message_id },
        replyTo: contextData.message_id,
      };
    }
    
    // Converter para string apenas se tiver conteúdo
    const messageJsonStr = Object.keys(messageJson).length > 0 ? JSON.stringify(messageJson) : null;
    
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUT',
        type: sendMessageDto.type,
        body: messageBody,
        json: messageJsonStr,
        waMessageId,
        status: 'SENT',
      },
    });

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  private async saveOutboundTemplate(sendTemplateDto: SendTemplateDto, waMessageId: string) {
    // Similar to saveOutboundMessage but for templates
    let contact = await this.prisma.contact.findUnique({
      where: { phoneE164: sendTemplateDto.to },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          name: sendTemplateDto.to,
          phoneE164: sendTemplateDto.to,
          tags: JSON.stringify([]),
        },
      });
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          contactId: contact.id,
          phoneE164: sendTemplateDto.to,
          status: 'OPEN',
        },
      });
    }

    // Usar texto do frontend que já tem as variáveis substituídas
    // Só buscar do Meta se não foi fornecido pelo frontend
    let templateBody = sendTemplateDto.bodyText || `Template: ${sendTemplateDto.templateName}`;
    
    // Se não veio bodyText do frontend, buscar template original do Meta
    if (!sendTemplateDto.bodyText) {
      try {
        const templatesUrl = `https://graph.facebook.com/${this.apiVersion}/${this.configService.get('WHATSAPP_BUSINESS_ACCOUNT_ID')}/message_templates?name=${sendTemplateDto.templateName}`;
        const response = await axios.get(templatesUrl, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
        });
        const template = response.data?.data?.[0];
        if (template) {
          const bodyComponent = template.components?.find((c: any) => c.type === 'BODY');
          if (bodyComponent?.text) {
            templateBody = bodyComponent.text;
          }
        }
      } catch (e) {
        this.logger.warn(`Não foi possível buscar texto do template: ${e.message}`);
      }
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUT',
        type: 'template',
        body: templateBody,
        json: JSON.stringify({
          template: sendTemplateDto.templateName,
          language: sendTemplateDto.language,
          components: sendTemplateDto.components,
        }),
        waMessageId,
        status: 'SENT',
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  async processOptOut(phoneNumber: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { phoneE164: phoneNumber },
    });

    if (contact) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: { optedOut: true },
      });
    }

    this.logger.log(`Contact ${phoneNumber} opted out`);
  }

  async getAccountDebug() {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
      const started = Date.now();
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: { fields: 'id,display_phone_number,verified_name' },
      });
      return {
        ok: true,
        ms: Date.now() - started,
        version: this.apiVersion,
        phoneNumberId: this.phoneNumberId,
        data: resp.data,
      };
    } catch (e) {
      return {
        ok: false,
        version: this.apiVersion,
        phoneNumberId: this.phoneNumberId,
        error: (e as any)?.message,
        details: (e as any)?.response?.data,
      };
    }
  }

  /**
   * Upload de mídia para a API do Meta
   * Retorna o media_id que pode ser usado nos templates
   */
  async uploadMedia(file: Buffer, mimeType: string, filename: string): Promise<{ mediaId: string }> {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', file, { filename, contentType: mimeType });
      form.append('messaging_product', 'whatsapp');
      form.append('type', mimeType);

      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/media`;
      
      const response = await axios.post(url, form, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          ...form.getHeaders(),
        },
      });

      this.logger.log(`Media uploaded successfully: ${response.data.id}`);
      return { mediaId: response.data.id };
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`Failed to upload media: ${error.message} - ${JSON.stringify(data)}`);
      throw new Error(`Failed to upload media: ${data?.error?.message || error.message}`);
    }
  }

  /**
   * Buscar URL de mídia do WhatsApp pelo media_id
   * Retorna a URL temporária para download (válida por alguns minutos)
   */
  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.data?.url) {
        this.logger.log(`Media URL retrieved for ${mediaId}`);
        return response.data.url;
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Failed to get media URL for ${mediaId}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Baixar mídia do WhatsApp e retornar como Buffer
   * Usa a URL temporária que requer autenticação
   */
  async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string; } | null> {
    try {
      // Primeiro, obter a URL temporária
      const mediaInfoUrl = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`;
      
      const infoResponse = await axios.get(mediaInfoUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!infoResponse.data?.url) {
        this.logger.warn(`No URL found for media ${mediaId}`);
        return null;
      }

      const downloadUrl = infoResponse.data.url;
      const mimeType = infoResponse.data.mime_type || 'application/octet-stream';
      
      // Baixar o arquivo binário
      const downloadResponse = await axios.get(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        responseType: 'arraybuffer',
      });

      this.logger.log(`✅ Media downloaded: ${mediaId} (${mimeType}, ${downloadResponse.data.length} bytes)`);
      
      return {
        buffer: Buffer.from(downloadResponse.data),
        mimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to download media ${mediaId}: ${error.message}`);
      return null;
    }
  }
}