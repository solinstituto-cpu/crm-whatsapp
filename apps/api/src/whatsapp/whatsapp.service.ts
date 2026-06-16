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
   * Prioridade: accountId > conta da conversa (por telefone) > conta padrão do banco > variáveis de ambiente
   */
  async getCredentials(accountId?: string, phoneNumber?: string): Promise<WhatsAppCredentials & { accountId?: string }> {
    let phoneNumberId = this.defaultPhoneNumberId;
    let accessToken = this.defaultAccessToken;
    let resolvedAccountId: string | undefined;

    try {
      if (accountId) {
        // Busca conta específica
        const account = await this.prisma.whatsAppAccount.findUnique({
          where: { id: accountId },
        });
        if (account && account.isActive) {
          phoneNumberId = account.phoneNumberId;
          accessToken = account.accessToken;
          resolvedAccountId = account.id;
          this.logger.log(`📱 Usando conta específica: ${account.name} (${account.phoneNumber})`);
        } else {
          this.logger.warn(`⚠️ Conta ${accountId} não encontrada ou inativa, tentando fallback`);
        }
      }
      
      // Se não resolveu por accountId, tenta pela conversa do contato
      if (!resolvedAccountId && phoneNumber) {
        const conversation = await this.prisma.conversation.findFirst({
          where: { 
            phoneE164: phoneNumber,
            whatsappAccountId: { not: null },
          },
          orderBy: { updatedAt: 'desc' },
          include: { whatsappAccount: true },
        });
        if (conversation?.whatsappAccount?.isActive) {
          phoneNumberId = conversation.whatsappAccount.phoneNumberId;
          accessToken = conversation.whatsappAccount.accessToken;
          resolvedAccountId = conversation.whatsappAccount.id;
          this.logger.log(`📱 Conta detectada pela conversa: ${conversation.whatsappAccount.name}`);
        }
      }
      
      // Fallback: conta padrão do banco
      if (!resolvedAccountId) {
        const defaultAccount = await this.prisma.whatsAppAccount.findFirst({
          where: { isDefault: true, isActive: true },
        });
        if (defaultAccount) {
          phoneNumberId = defaultAccount.phoneNumberId;
          accessToken = defaultAccount.accessToken;
          resolvedAccountId = defaultAccount.id;
          this.logger.log(`📱 Usando conta padrão: ${defaultAccount.name} (${defaultAccount.phoneNumber})`);
        } else {
          // Última tentativa: qualquer conta ativa
          const anyAccount = await this.prisma.whatsAppAccount.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          });
          if (anyAccount) {
            phoneNumberId = anyAccount.phoneNumberId;
            accessToken = anyAccount.accessToken;
            resolvedAccountId = anyAccount.id;
            this.logger.warn(`⚠️ Nenhuma conta padrão, usando: ${anyAccount.name}`);
          } else {
            this.logger.warn(`⚠️ Nenhuma conta WhatsApp ativa no banco, usando .env`);
          }
        }
      }
    } catch (error) {
      // Se der erro (ex: tabela não existe ainda), usa fallback do .env
      this.logger.warn(`Usando credenciais do .env (fallback): ${error.message}`);
    }

    if (!phoneNumberId || !accessToken) {
      throw new Error('Credenciais do WhatsApp não configuradas. Cadastre uma conta em Configurações > Contas WhatsApp.');
    }

    const apiUrl = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

    return { phoneNumberId, accessToken, apiUrl, accountId: resolvedAccountId };
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

  /**
   * Verifica se o token de validação coincide com algum cadastrado no banco de dados
   */
  async verifyDatabaseToken(verifyToken: string): Promise<boolean> {
    try {
      const account = await this.prisma.whatsAppAccount.findFirst({
        where: { webhookVerifyToken: verifyToken, isActive: true },
      });
      return !!account;
    } catch (error) {
      this.logger.error(`Error verifying database token: ${error.message}`);
      return false;
    }
  }

  // Propriedades legadas para compatibilidade (serão removidas no futuro)
  private get phoneNumberId() { return this.defaultPhoneNumberId; }
  private get accessToken() { return this.defaultAccessToken; }
  private get apiUrl() { return `https://graph.facebook.com/${this.apiVersion}/${this.defaultPhoneNumberId}/messages`; }

  async sendMessage(sendMessageDto: SendMessageDto, skipWindowCheck = false, accountId?: string) {
    try {
      // Obtém credenciais da conta (ou auto-detecta pela conversa)
      const credentials = await this.getCredentials(accountId, sendMessageDto.to);

      // Check if contact has opted out
      const contact = await this.prisma.contact.findFirst({
        where: { 
          phoneE164: sendMessageDto.to,
          whatsappAccountId: credentials.accountId || null,
        },
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

      // Save to database (passing resolved accountId to link conversation)
      await this.saveOutboundMessage(sendMessageDto, response.data.messages[0].id, credentials.accountId);

      this.logger.log(`outbound_text_ok to=${sendMessageDto.to} type=${sendMessageDto.type} waId=${response.data?.messages?.[0]?.id} ms=${elapsed} account=${credentials.accountId || 'env'}`);
      return response.data;
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`outbound_text_fail to=${sendMessageDto.to} err=${error.message} api=${this.apiVersion} details=${JSON.stringify(data)?.slice(0,300)}`);
      throw error;
    }
  }

  async sendTemplate(sendTemplateDto: SendTemplateDto, accountId?: string) {
    try {
      // Obtém credenciais da conta (ou auto-detecta)
      const credentials = await this.getCredentials(accountId, sendTemplateDto.to);

      const contact = await this.prisma.contact.findFirst({
        where: { 
          phoneE164: sendTemplateDto.to,
          whatsappAccountId: credentials.accountId || null,
        },
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
      await this.saveOutboundTemplate(sendTemplateDto, response.data.messages[0].id, credentials.accountId);

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

  private async isWithin24HourWindow(phoneNumber: string, whatsappAccountId?: string): Promise<boolean> {
    const contact = await this.prisma.contact.findFirst({
      where: { 
        phoneE164: phoneNumber,
        whatsappAccountId: whatsappAccountId || null,
      },
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

  private async saveOutboundMessage(sendMessageDto: SendMessageDto, waMessageId: string, resolvedAccountId?: string) {
    // Find or create contact
    let contact = await this.prisma.contact.findFirst({
      where: { 
        phoneE164: sendMessageDto.to,
        whatsappAccountId: resolvedAccountId || null,
      },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          name: sendMessageDto.to,
          phoneE164: sendMessageDto.to,
          whatsappAccountId: resolvedAccountId || null,
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
          whatsappAccountId: resolvedAccountId || undefined,
        },
      });
    } else if (!conversation.whatsappAccountId && resolvedAccountId) {
      // Vincular conta à conversa existente que não tem conta
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { whatsappAccountId: resolvedAccountId },
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

  private async saveOutboundTemplate(sendTemplateDto: SendTemplateDto, waMessageId: string, resolvedAccountId?: string) {
    // Similar to saveOutboundMessage but for templates
    let contact = await this.prisma.contact.findFirst({
      where: { 
        phoneE164: sendTemplateDto.to,
        whatsappAccountId: resolvedAccountId || null,
      },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          name: sendTemplateDto.to,
          phoneE164: sendTemplateDto.to,
          whatsappAccountId: resolvedAccountId || null,
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
          whatsappAccountId: resolvedAccountId || undefined,
        },
      });
    } else if (!conversation.whatsappAccountId && resolvedAccountId) {
      // Vincular conta à conversa existente que não tem conta (backfill)
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { whatsappAccountId: resolvedAccountId },
      });
    }

    // Usar texto do frontend que já tem as variáveis substituídas
    // Só buscar do Meta se não foi fornecido pelo frontend
    let templateBody = sendTemplateDto.bodyText || `Template: ${sendTemplateDto.templateName}`;
    
    // Se não veio bodyText do frontend, buscar template original do Meta
    if (!sendTemplateDto.bodyText) {
      try {
        // Usar credenciais da conta específica se disponível
        let wabaId = this.configService.get('WHATSAPP_BUSINESS_ACCOUNT_ID');
        let token = this.defaultAccessToken;
        
        if (resolvedAccountId) {
          const account = await this.prisma.whatsAppAccount.findUnique({
            where: { id: resolvedAccountId },
            select: { businessId: true, accessToken: true },
          });
          if (account) {
            wabaId = account.businessId || wabaId;
            token = account.accessToken || token;
          }
        }
        
        const templatesUrl = `https://graph.facebook.com/${this.apiVersion}/${wabaId}/message_templates?name=${sendTemplateDto.templateName}`;
        const response = await axios.get(templatesUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
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

  async processOptOut(phoneNumber: string, whatsappAccountId?: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { 
        phoneE164: phoneNumber,
        whatsappAccountId: whatsappAccountId || null,
      },
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
   * Diagnóstico completo de todas as contas WhatsApp cadastradas
   * Verifica se existem, qual é a padrão e se os tokens são válidos
   */
  async getAccountsDiagnostics() {
    try {
      const accounts = await this.prisma.whatsAppAccount.findMany({
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        include: {
          _count: { select: { conversations: true } },
        },
      });

      const results = [];
      for (const account of accounts) {
        let tokenValid = false;
        let tokenError = '';
        let phoneDisplay = '';

        try {
          const url = `https://graph.facebook.com/${this.apiVersion}/${account.phoneNumberId}`;
          const resp = await axios.get(url, {
            headers: { Authorization: `Bearer ${account.accessToken}` },
            params: { fields: 'id,display_phone_number,verified_name' },
            timeout: 5000,
          });
          tokenValid = true;
          phoneDisplay = resp.data?.display_phone_number || '';
        } catch (e: any) {
          tokenError = e?.response?.data?.error?.message || e.message || 'Erro desconhecido';
        }

        results.push({
          id: account.id,
          name: account.name,
          phoneNumber: account.phoneNumber,
          phoneNumberId: account.phoneNumberId,
          isDefault: account.isDefault,
          isActive: account.isActive,
          tokenValid,
          tokenError: tokenError || undefined,
          phoneDisplay: phoneDisplay || undefined,
          conversationCount: account._count.conversations,
          tokenPreview: account.accessToken ? `${account.accessToken.substring(0, 20)}...` : 'VAZIO',
        });
      }

      const envConfig = {
        WHATSAPP_BUSINESS_PHONE_ID: this.defaultPhoneNumberId ? 'configurado' : 'NÃO configurado',
        WHATSAPP_ACCESS_TOKEN: this.defaultAccessToken ? 'configurado' : 'NÃO configurado',
        WHATSAPP_API_VERSION: this.apiVersion,
      };

      return {
        totalAccounts: accounts.length,
        defaultAccount: accounts.find(a => a.isDefault)?.name || 'NENHUMA',
        activeAccounts: accounts.filter(a => a.isActive).length,
        accounts: results,
        envFallback: envConfig,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        error: error.message,
        hint: 'Tabela whatsapp_accounts pode não existir. Execute prisma db push.',
      };
    }
  }

  /**
   * Upload de mídia para a API do Meta
   * Retorna o media_id que pode ser usado nos templates
   */
  async uploadMedia(file: Buffer, mimeType: string, filename: string, accountId?: string): Promise<{ mediaId: string }> {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', file, { filename, contentType: mimeType });
      form.append('messaging_product', 'whatsapp');
      form.append('type', mimeType);

      const credentials = await this.getCredentials(accountId);

      const url = `https://graph.facebook.com/${this.apiVersion}/${credentials.phoneNumberId}/media`;
      
      const response = await axios.post(url, form, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          ...form.getHeaders(),
        },
      });

      this.logger.log(`Media uploaded successfully: ${response.data.id} (account: ${credentials.accountId || 'default'})`);
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
  async getMediaUrl(mediaId: string, accountId?: string): Promise<string | null> {
    try {
      const credentials = await this.getCredentials(accountId);
      const url = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
        },
      });

      if (response.data?.url) {
        this.logger.log(`Media URL retrieved for ${mediaId} (account: ${credentials.accountId || 'default'})`);
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
  async downloadMedia(mediaId: string, accountId?: string): Promise<{ buffer: Buffer; mimeType: string; } | null> {
    try {
      const credentials = await this.getCredentials(accountId);
      
      // Primeiro, obter a URL temporária
      const mediaInfoUrl = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`;
      
      const infoResponse = await axios.get(mediaInfoUrl, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
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
          'Authorization': `Bearer ${credentials.accessToken}`,
        },
        responseType: 'arraybuffer',
      });

      this.logger.log(`✅ Media downloaded: ${mediaId} (${mimeType}, ${downloadResponse.data.length} bytes, account: ${credentials.accountId || 'default'})`);
      
      return {
        buffer: Buffer.from(downloadResponse.data),
        mimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to download media ${mediaId}: ${error.message}`);
      return null;
    }
  }

  async cancelActiveFlows(phoneE164: string, userId?: string) {
    try {
      const result = await this.prisma.flowSession.updateMany({
        where: { contactId: phoneE164, status: 'ACTIVE' },
        data: { status: 'CANCELLED' }
      });
      if (result.count > 0) {
        this.logger.log(`Active flows cancelled for ${phoneE164} by human interaction.`);
      }

      // Auto-assign conversation ONLY if nobody is currently assigned.
      // If a consultant is already assigned, don't steal it — even if an admin sends a message.
      if (userId) {
        // Encontrar a conversa mais recente desse número
        const conversation = await this.prisma.conversation.findFirst({
          where: { phoneE164 },
          orderBy: { updatedAt: 'desc' }
        });
        
        if (conversation && !conversation.assignedToId) {
          await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { 
              assignedToId: userId,
              assignedAt: new Date(),
              status: 'OPEN' 
            }
          });
          this.logger.log(`Conversation ${conversation.id} auto-assigned to ${userId} (was unassigned).`);
        } else if (conversation && conversation.assignedToId) {
          this.logger.log(`Conversation ${conversation.id} stays with ${conversation.assignedToId} — admin/other user just sent a message.`);
        }
      }
    } catch (e) {
      this.logger.error(`Failed to cancel flows for ${phoneE164}: ${e.message}`);
    }
  }
}