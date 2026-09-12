import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SseService } from '../sse/sse.service';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
import { MetaGraphService } from './meta-graph.service';

type Channel = 'FACEBOOK' | 'INSTAGRAM';

/**
 * Processa os webhooks da Meta para Messenger (object: "page") e Instagram
 * Direct (object: "instagram"), alimentando o MESMO inbox (Contact /
 * Conversation / Message) usado pelo WhatsApp.
 *
 * Importante (decisão do Rogérius, 12/set/2026): aqui NÃO há automação/IA —
 * as mensagens só entram na caixa de entrada para um atendente humano
 * responder manualmente. O motor de fluxos (FlowEngineService) é
 * propositalmente não usado neste serviço.
 */
@Injectable()
export class SocialWebhookService {
  private readonly logger = new Logger(SocialWebhookService.name);

  constructor(
    private prisma: PrismaService,
    private sseService: SseService,
    private socialAccountsService: SocialAccountsService,
    private metaGraphService: MetaGraphService,
  ) {}

  async processMessengerWebhook(webhookData: any) {
    await this.processEntries(webhookData, 'FACEBOOK');
  }

  async processInstagramWebhook(webhookData: any) {
    await this.processEntries(webhookData, 'INSTAGRAM');
  }

  private async processEntries(webhookData: any, channel: Channel) {
    for (const entry of webhookData.entry || []) {
      const entryId: string | undefined = entry.id;
      const account = await this.resolveAccount(channel, entryId);

      if (!account) {
        this.logger.warn(
          `⚠️ Nenhuma conta social ${channel} cadastrada para o id "${entryId}" — evento ignorado. Cadastre a conta em Configurações.`,
        );
        continue;
      }

      for (const event of entry.messaging || []) {
        try {
          await this.processMessagingEvent(channel, account, event);
        } catch (error) {
          this.logger.error(`❌ Erro processando evento ${channel}: ${(error as Error).message}`, (error as Error).stack);
        }
      }
    }
  }

  private async resolveAccount(channel: Channel, entryId?: string) {
    if (!entryId) return null;

    // Messenger: entry.id é o próprio pageId.
    // Instagram: entry.id normalmente é o IG Business Account ID, mas alguns
    // formatos de webhook mandam o pageId - checamos os dois.
    const byPageId = await this.socialAccountsService.findByPageId(channel, entryId);
    if (byPageId) return byPageId;

    if (channel === 'INSTAGRAM') {
      return this.prisma.socialAccount.findFirst({
        where: { channel, igBusinessId: entryId, isActive: true },
      });
    }

    return null;
  }

  private async processMessagingEvent(channel: Channel, account: { id: string; accessToken: string; pageId: string }, event: any) {
    // Ignora eco de mensagens que o próprio CRM acabou de enviar
    if (event?.message?.is_echo) return;

    // Ignora eventos sem mensagem (delivery/read receipts, postbacks, etc.) por enquanto
    if (!event?.message) return;

    const externalId: string | undefined = event.sender?.id;
    if (!externalId) return;

    const contact = await this.findOrCreateContact(channel, account, externalId);
    const conversation = await this.findOrCreateConversation(channel, account, contact);

    const message = event.message;
    const attachment = Array.isArray(message.attachments) ? message.attachments[0] : undefined;
    const type = message.text ? 'text' : attachment?.type || 'text';
    const body: string | null = message.text || attachment?.payload?.url || null;

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'IN',
        type,
        body,
        json: JSON.stringify(message),
        waMessageId: message.mid,
        status: 'UNREAD',
        channel,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastIncomingMessageAt: new Date(),
        unreadCount: { increment: 1 },
        ...(conversation.status === 'CLOSED' ? { status: 'OPEN' } : {}),
      },
    });

    await this.prisma.contact.update({
      where: { id: contact.id },
      data: { lastMessageAt: new Date(), lastContactAt: new Date() },
    });

    this.logger.log(`✅ Mensagem ${channel} recebida de ${contact.name} (${externalId}) → conversa ${conversation.id}`);

    try {
      this.sseService.emit({
        type: 'new_message',
        conversationId: conversation.id,
        data: {
          contactName: contact.name,
          channel,
          messagePreview: (body || '').substring(0, 100),
          messageType: type,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      this.logger.warn(`SSE emit error: ${(e as Error).message}`);
    }
  }

  private async findOrCreateContact(channel: Channel, account: { id: string; accessToken: string }, externalId: string) {
    let contact = await this.prisma.contact.findUnique({
      where: {
        channel_externalId_socialAccountId: {
          channel,
          externalId,
          socialAccountId: account.id,
        },
      },
    });

    if (contact) return contact;

    const profile = await this.metaGraphService.getUserProfile(account.accessToken, externalId);
    const fallbackName = channel === 'INSTAGRAM' ? 'Contato do Instagram' : 'Contato do Facebook';

    // phoneE164 é obrigatório no schema atual (histórico do WhatsApp). Para
    // contatos vindos de Messenger/Instagram usamos um identificador
    // sintético e não-telefônico só para satisfazer essa coluna; o
    // identificador real do canal fica em `externalId`.
    const syntheticPhone = `${channel.toLowerCase()}:${externalId}`;

    return this.prisma.contact.create({
      data: {
        name: profile?.name || fallbackName,
        phoneE164: syntheticPhone,
        channel,
        externalId,
        socialAccountId: account.id,
        tags: JSON.stringify([]),
        source: channel === 'INSTAGRAM' ? 'Instagram' : 'Facebook',
        lastMessageAt: new Date(),
        firstContactAt: new Date(),
        lastContactAt: new Date(),
        consentedAt: new Date(),
      },
    });
  }

  private async findOrCreateConversation(channel: Channel, account: { id: string }, contact: { id: string }) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, channel },
      orderBy: { updatedAt: 'desc' },
    });

    if (conversation) return conversation;

    return this.prisma.conversation.create({
      data: {
        contactId: contact.id,
        channel,
        socialAccountId: account.id,
        status: 'OPEN',
      },
    });
  }
}
