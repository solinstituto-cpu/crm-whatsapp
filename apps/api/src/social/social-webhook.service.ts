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

      // "Comentário vira lead": eventos de comentário público em posts
      // chegam em entry.changes (não em entry.messaging, que é só DM).
      for (const change of entry.changes || []) {
        try {
          await this.processCommentChange(channel, account, change);
        } catch (error) {
          this.logger.error(`❌ Erro processando comentário ${channel}: ${(error as Error).message}`, (error as Error).stack);
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
    const { conversation } = await this.findOrCreateConversation(channel, account, contact);

    // Se a pessoa respondeu por DM (inclusive respondendo à nossa resposta
    // privada de um comentário), a janela normal de mensagens está aberta -
    // não há mais um "comentário pendente" a responder de forma especial.
    if (conversation.pendingCommentId) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { pendingCommentId: null, pendingCommentAt: null },
      });
    }

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

  /**
   * Trata comentários públicos em posts (Facebook: field "feed", item
   * "comment"; Instagram: field "comments"), criando/atualizando um
   * lead/conversa no inbox "Instagram/Facebook" — decisão do Rogérius,
   * 13/set/2026 ("Comentário vira lead/conversa privada").
   */
  private async processCommentChange(
    channel: Channel,
    account: { id: string; accessToken: string; pageId: string },
    change: any,
  ) {
    const { field, value } = change || {};
    if (!value) return;

    let commentId: string | undefined;
    let fromId: string | undefined;
    let fromName: string | undefined;
    let text: string | undefined;

    if (channel === 'FACEBOOK' && field === 'feed') {
      // O campo "feed" também dispara para posts, reações, etc. — só nos
      // interessam comentários novos (não edições/remoções).
      if (value.item !== 'comment') return;
      if (value.verb && value.verb !== 'add') return;
      commentId = value.comment_id;
      fromId = value.from?.id;
      fromName = value.from?.name;
      text = value.message;
    } else if (channel === 'INSTAGRAM' && field === 'comments') {
      commentId = value.id;
      fromId = value.from?.id;
      fromName = value.from?.username;
      text = value.text;
    } else {
      return;
    }

    if (!commentId || !fromId) return;

    // Ignora comentários feitos pela própria Página (ex.: resposta pública
    // do atendente, ou eco de algum outro fluxo) para não virar "lead" de nós mesmos.
    if (fromId === account.pageId) return;

    // Evita reprocessar o mesmo comentário em reentregas de webhook da Meta.
    const already = await this.prisma.message.findFirst({
      where: { waMessageId: commentId, channel },
      select: { id: true },
    });
    if (already) return;

    const contact = await this.findOrCreateContact(channel, account, fromId, fromName);
    const { conversation, isNew } = await this.findOrCreateConversation(channel, account, contact);

    const priorOutgoing = isNew
      ? 0
      : await this.prisma.message.count({ where: { conversationId: conversation.id, direction: 'OUT' } });
    // Só marcamos o comentário como "pendente de resposta privada" se ainda
    // não respondemos essa conversa - depois da primeira resposta privada a
    // Meta abre a janela normal de mensagens e o envio volta a ser normal.
    const shouldSetPending = priorOutgoing === 0;

    const body = text || '(comentário sem texto)';

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'IN',
        type: 'comment',
        body,
        json: JSON.stringify(value),
        waMessageId: commentId,
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
        ...(shouldSetPending ? { pendingCommentId: commentId, pendingCommentAt: new Date() } : {}),
      },
    });

    await this.prisma.contact.update({
      where: { id: contact.id },
      data: { lastMessageAt: new Date(), lastContactAt: new Date() },
    });

    this.logger.log(
      `💬 Comentário ${channel} de ${contact.name} (${fromId}) → conversa ${conversation.id}${shouldSetPending ? ' (aguardando resposta privada)' : ''}`,
    );

    try {
      this.sseService.emit({
        type: 'new_message',
        conversationId: conversation.id,
        data: {
          contactName: contact.name,
          channel,
          messagePreview: body.substring(0, 100),
          messageType: 'comment',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      this.logger.warn(`SSE emit error: ${(e as Error).message}`);
    }
  }

  private async findOrCreateContact(
    channel: Channel,
    account: { id: string; accessToken: string },
    externalId: string,
    preferredName?: string,
  ) {
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
    const fallbackName = preferredName || (channel === 'INSTAGRAM' ? 'Contato do Instagram' : 'Contato do Facebook');

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

  private async findOrCreateConversation(
    channel: Channel,
    account: { id: string },
    contact: { id: string },
  ): Promise<{ conversation: any; isNew: boolean }> {
    const existing = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, channel },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing) return { conversation: existing, isNew: false };

    const created = await this.prisma.conversation.create({
      data: {
        contactId: contact.id,
        channel,
        socialAccountId: account.id,
        status: 'OPEN',
      },
    });
    return { conversation: created, isNew: true };
  }
}
