import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppWebhookDto } from '../common/schemas';
import { WhatsAppService } from './whatsapp.service';
import { FlowEngineService } from '../flows/flow-engine.service';
import { TemplatesService } from '../templates/templates.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
    @Inject(forwardRef(() => FlowEngineService))
    private flowEngineService: FlowEngineService,
    private templatesService: TemplatesService,
  ) {}

  async processWebhook(webhookData: any) {
    this.logger.log(`📥 Webhook received: ${JSON.stringify(webhookData).substring(0, 500)}`);
    
    try {
      for (const entry of webhookData.entry || []) {
        for (const change of entry.changes || []) {
          this.logger.log(`📨 Processing change field: ${change.field}`);
          if (change.field === 'messages') {
            await this.processMessagesChange(change.value);
          }
        }
      }
      this.logger.log('✅ Webhook processed successfully');
    } catch (error) {
      this.logger.error('❌ Error processing webhook', error);
      throw error;
    }
  }

  private async processMessagesChange(value: any) {
    // Identificar de qual número/conta WhatsApp veio a mensagem
    const phoneNumberId = value?.metadata?.phone_number_id;
    let whatsappAccountId: string | null = null;

    if (phoneNumberId) {
      try {
        const account = await this.whatsappService.getAccountByPhoneNumberId(phoneNumberId);
        if (account) {
          whatsappAccountId = account.id;
          this.logger.log(`📱 Mensagem recebida na conta: ${account.name} (${account.phoneNumber})`);
        }
      } catch (e) {
        // Tabela ainda não existe ou erro - continua sem account
        this.logger.debug(`Conta WhatsApp não identificada (phoneNumberId: ${phoneNumberId})`);
      }
    }

    // Process incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        // Pass the entire value object which contains contacts, metadata, etc.
        await this.processInboundMessage(message, value, whatsappAccountId);
      }
    }

    // Process message status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.processStatusUpdate(status);
      }
    }
  }

  private async processInboundMessage(message: any, webhookValue: any, whatsappAccountId?: string | null) {
    const phoneNumber = `+${message.from}`;
    
    // Check for opt-out keywords
    if (this.isOptOutMessage(message)) {
      await this.whatsappService.processOptOut(phoneNumber);
      return;
    }

    // Find or create contact
    let contact = await this.prisma.contact.findUnique({
      where: {
        phoneE164_whatsappAccountId: {
          phoneE164: phoneNumber,
          whatsappAccountId: whatsappAccountId || null,
        }
      },
    });

    if (!contact) {
      // Extract name from contacts array in webhook value
      const contactName = webhookValue?.contacts?.[0]?.profile?.name || phoneNumber;
      
      contact = await this.prisma.contact.create({
        data: {
          name: contactName,
          phoneE164: phoneNumber,
          whatsappAccountId: whatsappAccountId || null,
          tags: JSON.stringify([]),
          lastMessageAt: new Date(),
          firstContactAt: new Date(), // Primeira vez que o contato enviou mensagem
          lastContactAt: new Date(),  // Primeira vez também é a última
          consentedAt: new Date(), // Implied consent by messaging us
        },
      });
    } else {
      // Update last message time and last contact time
      const updateData: any = { 
        lastMessageAt: new Date(),
        lastContactAt: new Date() // Atualiza sempre que o cliente enviar mensagem
      };
      
      // Se não tem firstContactAt, define agora
      if (!contact.firstContactAt) {
        updateData.firstContactAt = new Date();
      }
      
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: updateData,
      });
    }

    // Find conversation by contact OR by phone number (for orphaned conversations)
    // Also filter by whatsappAccountId if available
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { contactId: contact.id, ...(whatsappAccountId ? { whatsappAccountId } : {}) },
          { phoneE164: phoneNumber, contactId: null, ...(whatsappAccountId ? { whatsappAccountId } : {}) },
          // Fallback: buscar conversa sem accountId (conversas antigas)
          { contactId: contact.id, whatsappAccountId: null },
          { phoneE164: phoneNumber, contactId: null, whatsappAccountId: null },
        ]
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          contactId: contact.id,
          phoneE164: phoneNumber,
          status: 'OPEN',
          whatsappAccountId: whatsappAccountId || undefined,
        },
      });
    } else {
      // Vincular contato à conversa órfã se necessário
      // Também atualiza o whatsappAccountId se estava null
      const updateData: any = {};
      
      if (!conversation.contactId) {
        updateData.contactId = contact.id;
      }
      
      if (!conversation.whatsappAccountId && whatsappAccountId) {
        updateData.whatsappAccountId = whatsappAccountId;
      }
      
      if (Object.keys(updateData).length > 0) {
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: updateData,
        });
      }
      
      if (conversation.status === 'CLOSED') {
        // Reopen conversation
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { status: 'OPEN' },
        });
      }
    }

    // Create message record
    const messageBody = this.extractMessageBody(message);
    
    // Enriquecer mensagem com URL da mídia para stickers, imagens, vídeos, etc.
    let enrichedMessage = { ...message };
    let mediaProxyUrl: string | null = null;
    
    if (['sticker', 'image', 'video', 'audio', 'document'].includes(message.type)) {
      const mediaId = message[message.type]?.id;
      if (mediaId) {
        // Gerar URL do proxy local que não expira
        // O frontend vai usar essa URL para buscar a mídia
        mediaProxyUrl = `/api/wa/media/${mediaId}`;
        
        enrichedMessage = {
          ...message,
          [message.type]: {
            ...message[message.type],
            mediaId: mediaId,
          },
          mediaId: mediaId,
          mediaUrl: mediaProxyUrl, // URL do proxy local
        };
        this.logger.log(`📎 Media proxy URL set for ${message.type}: ${mediaId}`);
      }
    }
    
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'IN',
        type: message.type,
        body: messageBody,
        json: JSON.stringify(enrichedMessage),
        waMessageId: message.id,
        status: 'UNREAD',  // Nova mensagem começa como não lida
      },
    });

    // Update conversation timestamp and increment unread count
    // Also update lastIncomingMessageAt for 24h window tracking
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { 
        lastMessageAt: new Date(),
        lastIncomingMessageAt: new Date(), // Para rastrear janela de 24h
        unreadCount: { increment: 1 },
      },
    });

    this.logger.log(`✅ Saved inbound message from ${phoneNumber} to conversation ${conversation.id}`);

    // ==========================================
    // PROCESSAR FLUXOS DE AUTOMAÇÃO
    // ==========================================
    // 🛑 HUMAN TAKEOVER: Se um operador humano está atribuído à conversa, a IA fica em silêncio
    if (conversation.assignedToId) {
      this.logger.log(`🙋 Human takeover ativo para ${phoneNumber} (operador: ${conversation.assignedToId}) — IA pausada.`);
      return;
    }

    try {
      const flowResult = await this.flowEngineService.processIncomingMessage(phoneNumber, messageBody);
      
      if (flowResult.handled) {
        this.logger.log(`🤖 Flow processed for ${phoneNumber} - Session: ${flowResult.sessionId}`);
        
        // Enviar mensagens geradas pelo fluxo
        if (flowResult.messages && flowResult.messages.length > 0) {
          this.logger.log(`📨 Flow has ${flowResult.messages.length} messages to send`);
          
          for (const msg of flowResult.messages) {
            this.logger.log(`📧 Processing message: type=${msg.type}, templateName=${msg.templateName || 'none'}, content=${msg.content?.substring(0, 50) || 'none'}`);
            
            try {
              if (msg.type === 'text' && msg.content) {
                await this.whatsappService.sendMessage({
                  to: phoneNumber,
                  type: 'text',
                  text: msg.content,
                });
                this.logger.log(`📤 Flow sent text to ${phoneNumber}: "${msg.content.substring(0, 50)}..."`);
              } else if (msg.type === 'template' && msg.templateName) {
                // Buscar informações do template (incluindo idioma correto)
                let templateLanguage = 'pt_BR'; // fallback
                try {
                  const templates = await this.templatesService.getTemplates();
                  const template = templates.find((t: any) => t.name === msg.templateName);
                  if (template) {
                    templateLanguage = template.language;
                    this.logger.log(`📋 Found template "${msg.templateName}" with language: ${templateLanguage}`);
                  } else {
                    this.logger.warn(`⚠️ Template "${msg.templateName}" not found in Meta, using fallback language pt_BR`);
                  }
                } catch (e) {
                  this.logger.warn(`⚠️ Could not fetch template info: ${e.message}`);
                }
                
                // Construir components para o template
                const components: any[] = [];
                
                // Se tem mídia (header)
                if (msg.mediaId || msg.mediaUrl) {
                  components.push({
                    type: 'header',
                    parameters: [{
                      type: 'image',
                      image: msg.mediaId ? { id: msg.mediaId } : { link: msg.mediaUrl }
                    }]
                  });
                }
                
                // Se tem parâmetros de corpo
                const templateParams = msg.templateParams || [];
                if (templateParams.length > 0) {
                  components.push({
                    type: 'body',
                    parameters: templateParams.map((p: string) => ({ type: 'text', text: p }))
                  });
                } else if (msg.content) {
                  // Fallback: tentar parsear do content
                  try {
                    const params = JSON.parse(msg.content);
                    if (Array.isArray(params) && params.length > 0) {
                      components.push({
                        type: 'body',
                        parameters: params.map((p: string) => ({ type: 'text', text: p }))
                      });
                    }
                  } catch (e) {
                    // Content não é JSON, ignorar
                  }
                }
                
                this.logger.log(`📤 Sending template "${msg.templateName}" (lang: ${templateLanguage}) with ${components.length} components to ${phoneNumber}`);
                
                await this.whatsappService.sendTemplate({
                  to: phoneNumber,
                  templateName: msg.templateName,
                  language: templateLanguage,
                  components: components.length > 0 ? components : undefined,
                });
                this.logger.log(`✅ Flow sent template "${msg.templateName}" to ${phoneNumber}`);
              } else if (msg.type === 'image' && (msg.mediaId || msg.mediaUrl)) {
                await this.whatsappService.sendMessage({
                  to: phoneNumber,
                  type: 'image',
                  media: {
                    ...(msg.mediaId ? { id: msg.mediaId } : { link: msg.mediaUrl }),
                    caption: msg.content || undefined,
                  },
                });
                this.logger.log(`📤 Flow sent image to ${phoneNumber}`);
              } else if (msg.type === 'interactive') {
                // Mensagem interativa com botões ou lista
                const interactivePayload: any = {
                  to: phoneNumber,
                  type: 'interactive',
                  interactive: {
                    type: msg.interactiveType || 'button',
                    body: { text: msg.bodyText || 'Escolha uma opção:' },
                    action: {},
                  },
                };
                
                // Header opcional
                if (msg.headerText) {
                  interactivePayload.interactive.header = { type: 'text', text: msg.headerText };
                }
                
                // Footer opcional
                if (msg.footerText) {
                  interactivePayload.interactive.footer = { text: msg.footerText };
                }
                
                // Botões ou lista
                if (msg.interactiveType === 'list') {
                  // Limpar campos internos (nextNodeId) das seções antes de enviar para API do WhatsApp
                  const cleanSections = (msg.listSections || []).map((section: any) => ({
                    title: section.title || 'Opções',
                    rows: (section.rows || []).map((row: any) => {
                      const cleanRow: any = {
                        id: row.id,
                        title: (row.title || '').substring(0, 24), // Limite de 24 caracteres
                      };
                      // Só adicionar description se existir
                      if (row.description) {
                        cleanRow.description = row.description.substring(0, 72); // Limite de 72 caracteres
                      }
                      return cleanRow;
                    }),
                  }));
                  
                  this.logger.log(`📋 Sending list with ${cleanSections.length} sections: ${JSON.stringify(cleanSections)}`);
                  
                  interactivePayload.interactive.action = {
                    button: (msg.listButtonText || 'Ver opções').substring(0, 20), // Limite de 20 caracteres
                    sections: cleanSections,
                  };
                } else {
                  // Botões simples (máximo 3) - limpar nextNodeId
                  const cleanButtons = (msg.buttons || []).map((btn: any) => ({
                    type: 'reply',
                    reply: {
                      id: btn.id,
                      title: btn.title,
                    },
                  }));
                  
                  interactivePayload.interactive.action = {
                    buttons: cleanButtons,
                  };
                }
                
                await this.whatsappService.sendMessage(interactivePayload);
                this.logger.log(`📤 Flow sent interactive (${msg.interactiveType}) to ${phoneNumber}`);
              } else if (msg.type === 'text' && !msg.content) {
                this.logger.warn(`⚠️ Text message has empty content, skipping`);
              } else {
                this.logger.warn(`⚠️ Unknown message type or missing data: type=${msg.type}, content=${msg.content ? 'present' : 'empty'}, templateName=${msg.templateName || 'none'}`);
              }
            } catch (sendError) {
              this.logger.error(`❌ Failed to send flow message: ${sendError.message}`);
              this.logger.error(`   Details: ${JSON.stringify((sendError as any)?.response?.data || {})}`);
            }
          }
        } else {
          this.logger.log(`ℹ️ Flow handled but no messages to send`);
        }
      }
    } catch (flowError) {
      this.logger.error(`❌ Error processing flow: ${flowError.message}`);
      // Não lançar erro - fluxo é opcional
    }
  }

  private async processStatusUpdate(status: any) {
    this.logger.log(`📨 Status update recebido: id=${status.id}, status=${status.status}, recipient=${status.recipient_id}`);
    
    // Update message status in Messages table
    const updatedMessages = await this.prisma.message.updateMany({
      where: { waMessageId: status.id },
      data: { status: status.status.toUpperCase() },
    });
    this.logger.log(`📨 Messages atualizadas: ${updatedMessages.count}`);

    // Update conversation last WhatsApp status
    const message = await this.prisma.message.findFirst({
      where: { waMessageId: status.id },
      include: { conversation: true },
    });

    if (message) {
      await this.prisma.conversation.update({
        where: { id: message.conversationId },
        data: { lastWAStatus: status.status },
      });
    }

    // ==========================================
    // ATUALIZAR STATUS DE MENSAGENS DE CAMPANHA
    // ==========================================
    const campaignMessage = await this.prisma.campaignMessage.findFirst({
      where: { waMessageId: status.id },
    });

    this.logger.log(`📨 CampaignMessage encontrada: ${campaignMessage ? campaignMessage.id : 'NÃO ENCONTRADA'} para waMessageId=${status.id}`);

    if (campaignMessage) {
      const statusUpper = status.status.toUpperCase();
      const updateData: any = { status: statusUpper };

      if (statusUpper === 'DELIVERED' && !campaignMessage.deliveredAt) {
        updateData.deliveredAt = new Date();
      } else if (statusUpper === 'READ' && !campaignMessage.readAt) {
        updateData.readAt = new Date();
        // Se foi lido, também foi entregue
        if (!campaignMessage.deliveredAt) {
          updateData.deliveredAt = new Date();
        }
      }

      await this.prisma.campaignMessage.update({
        where: { id: campaignMessage.id },
        data: updateData,
      });

      // Atualizar contadores da campanha
      await this.updateCampaignStats(campaignMessage.campaignId);

      this.logger.log(`📊 Campaign message ${status.id} -> ${statusUpper}`);
    }

    this.logger.log(`Updated message status: ${status.id} -> ${status.status}`);
  }

  // Atualiza as estatísticas da campanha baseado nas mensagens
  private async updateCampaignStats(campaignId: string) {
    // Contar mensagens por status
    const stats = await this.prisma.campaignMessage.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { status: true },
    });

    // Contar entregues (tem deliveredAt preenchido)
    const delivered = await this.prisma.campaignMessage.count({
      where: { campaignId, deliveredAt: { not: null } },
    });

    // Contar lidos (tem readAt preenchido)
    const read = await this.prisma.campaignMessage.count({
      where: { campaignId, readAt: { not: null } },
    });

    // Contar enviados = todos que não estão PENDING ou FAILED
    // Uma mensagem SENT, DELIVERED ou READ conta como enviada
    const sent = await this.prisma.campaignMessage.count({
      where: { 
        campaignId, 
        status: { in: ['SENT', 'DELIVERED', 'READ'] },
      },
    });

    const failed = stats
      .filter(s => s.status === 'FAILED')
      .reduce((sum, s) => sum + s._count.status, 0);

    this.logger.log(`📊 Stats campanha ${campaignId}: sent=${sent}, delivered=${delivered}, read=${read}, failed=${failed}`);

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount: sent,
        deliveredCount: delivered,
        readCount: read,
        failedCount: failed,
      },
    });
  }

  private isOptOutMessage(message: any): boolean {
    if (message.type !== 'text') return false;
    
    const optOutKeywords = ['STOP', 'PARAR', 'SAIR', 'CANCELAR', 'UNSUBSCRIBE'];
    const messageText = message.text?.body?.toUpperCase().trim();
    
    return optOutKeywords.includes(messageText);
  }

  private extractMessageBody(message: any): string {
    switch (message.type) {
      case 'text':
        return message.text.body;
      case 'image':
        return message.image.caption || 'Image received';
      case 'document':
        return message.document.caption || `Document: ${message.document.filename}`;
      case 'audio':
        return 'Audio message received';
      case 'video':
        return message.video.caption || 'Video received';
      case 'voice':
        return 'Voice message received';
      case 'sticker':
        return 'Sticker received';
      case 'location':
        return 'Location shared';
      case 'contacts':
        return 'Contact card received';
      case 'button':
        // Resposta de botão de template (quick reply)
        return message.button?.text || message.button?.payload || 'Botão clicado';
      case 'interactive':
        // Resposta de botão interativo ou lista
        if (message.interactive?.type === 'button_reply') {
          return message.interactive.button_reply?.title || message.interactive.button_reply?.id || 'Botão clicado';
        }
        if (message.interactive?.type === 'list_reply') {
          return message.interactive.list_reply?.title || message.interactive.list_reply?.id || 'Item selecionado';
        }
        return message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || 'Resposta interativa';
      default:
        return `${message.type} message received`;
    }
  }
}