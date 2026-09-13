import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateSocialAccountDto {
  channel: 'FACEBOOK' | 'INSTAGRAM';
  name: string;
  pageId: string;
  pageName?: string;
  accessToken: string;
  igBusinessId?: string;
  appId?: string;
  webhookVerifyToken?: string;
  isActive?: boolean;
}

export type UpdateSocialAccountDto = Partial<CreateSocialAccountDto>;

/**
 * Contas sociais = Páginas do Facebook conectadas, usadas para alimentar o
 * inbox do Messenger e/ou do Instagram (a Meta unificou o envio/recebimento
 * dos dois através da Página conectada).
 *
 * Segue o mesmo padrão de src/whatsapp-accounts para manter consistência
 * com o resto do sistema.
 */
@Injectable()
export class SocialAccountsService {
  private readonly logger = new Logger(SocialAccountsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(channel?: 'FACEBOOK' | 'INSTAGRAM') {
    return this.prisma.socialAccount.findMany({
      where: channel ? { channel } : undefined,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.socialAccount.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Conta social ${id} não encontrada`);
    }
    return account;
  }

  async findByPageId(channel: string, pageId: string) {
    return this.prisma.socialAccount.findUnique({
      where: { channel_pageId: { channel, pageId } },
    });
  }

  /**
   * Usado na verificação do webhook (GET /api/wa/webhook) para aceitar
   * também os verify tokens configurados nas contas sociais.
   */
  async isKnownVerifyToken(token: string): Promise<boolean> {
    const match = await this.prisma.socialAccount.findFirst({
      where: { webhookVerifyToken: token },
      select: { id: true },
    });
    return !!match;
  }

  async create(data: CreateSocialAccountDto) {
    this.logger.log(`Criando conta social ${data.channel}: ${data.name}`);
    return this.prisma.socialAccount.create({
      data: {
        channel: data.channel,
        name: data.name,
        pageId: data.pageId,
        pageName: data.pageName,
        accessToken: data.accessToken,
        igBusinessId: data.igBusinessId,
        appId: data.appId,
        webhookVerifyToken: data.webhookVerifyToken || 'sol_verify_token',
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateSocialAccountDto) {
    await this.findOne(id);
    return this.prisma.socialAccount.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.socialAccount.delete({ where: { id } });
  }

  async setDefault(id: string) {
    const account = await this.findOne(id);
    await this.prisma.socialAccount.updateMany({
      where: { channel: account.channel },
      data: { isDefault: false },
    });
    return this.prisma.socialAccount.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  /**
   * Inscreve a Página (e a conta do Instagram ligada a ela) para o nosso
   * app receber os webhooks dela.
   *
   * Isto é DIFERENTE de ativar os campos no painel do Meta for Developers
   * (que diz quais TIPOS de evento o app sabe processar) - sem esta chamada
   * (`POST /{page-id}/subscribed_apps`), a Meta nunca envia nenhum evento
   * dessa Página específica pro nosso webhook, mesmo com os campos
   * ativados. Ver social-webhook.service.ts para o que processamos.
   */
  async subscribeWebhook(id: string) {
    const account = await this.findOne(id);
    return this.callSubscribedApps(account.pageId, account.accessToken, account.pageName);
  }

  /**
   * Mesma coisa, mas para todas as contas sociais ativas de uma vez
   * (evita ter que descobrir o id de cada uma). Como Facebook e Instagram
   * de uma mesma Página compartilham o mesmo pageId/token, cada Página só
   * é inscrita uma vez.
   */
  async subscribeAllWebhooks() {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { isActive: true },
      orderBy: { pageId: 'asc' },
    });

    const seen = new Set<string>();
    const results: any[] = [];
    for (const account of accounts) {
      if (!account.pageId || !account.accessToken || seen.has(account.pageId)) continue;
      seen.add(account.pageId);
      results.push(await this.callSubscribedApps(account.pageId, account.accessToken, account.pageName));
    }
    return results;
  }

  /**
   * IMPORTANTE: "comments" NÃO é um campo válido em POST /{page-id}/subscribed_apps
   * (confirmado na prática, 13/set/2026 - a Graph API rejeita a chamada inteira
   * com "(#100) Param subscribed_fields[...] must be one of {...}" e "comments"
   * não está nessa lista). Isso significa que, enquanto "comments" estava na
   * lista, a chamada inteira falhava e NADA era inscrito - nem "messages" -
   * o que explica por que nenhuma DM chegava no CRM.
   *
   * "feed" já cobre comentários públicos em posts do Facebook (o
   * processCommentChange em social-webhook.service.ts trata field:"feed" e
   * item:"comment"). Comentários do Instagram usam o campo "comments", mas
   * ele só é aceito no subscribed_apps da conta do INSTAGRAM BUSINESS
   * (instagram_business_account.id), não no da Página - por isso é uma
   * chamada separada, feita em subscribeInstagramComments.
   */
  private async callSubscribedApps(pageId: string, accessToken: string, pageName?: string | null) {
    const fields = [
      'messages',
      'messaging_postbacks',
      'message_deliveries',
      'message_reads',
      'message_echoes',
      'feed',
    ].join(',');

    try {
      const url = `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;
      const res = await fetch(url, { method: 'POST' });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error) {
        this.logger.error(`❌ Erro ao inscrever webhook da Página ${pageId}: ${JSON.stringify(json.error || json)}`);
        return { pageId, pageName, ok: false, error: json.error?.message || 'Falha ao inscrever a Página no webhook' };
      }

      this.logger.log(`✅ Página ${pageName || pageId} (${pageId}) inscrita no webhook: ${JSON.stringify(json)}`);

      const instagram = await this.subscribeInstagramComments(pageId, accessToken);

      return { pageId, pageName, ok: true, subscribedFields: fields.split(','), instagram };
    } catch (e: any) {
      this.logger.error(`❌ Erro ao inscrever webhook da Página ${pageId}: ${e.message}`);
      return { pageId, pageName, ok: false, error: e.message };
    }
  }

  /**
   * Descobre a conta do Instagram Business ligada à Página (instagram_business_account)
   * e inscreve ELA (não a Página) para o campo "comments" - ver nota acima.
   */
  private async subscribeInstagramComments(pageId: string, accessToken: string) {
    try {
      const lookupUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(accessToken)}`;
      const lookupRes = await fetch(lookupUrl);
      const lookupJson = await lookupRes.json().catch(() => ({}));
      const igId = lookupJson?.instagram_business_account?.id;

      if (!igId) {
        this.logger.warn(`⚠️ Página ${pageId} não tem conta do Instagram Business vinculada - comentários do Instagram não serão inscritos.`);
        return { ok: false, error: 'Nenhuma conta do Instagram Business vinculada a essa Página' };
      }

      const fields = ['comments', 'messages', 'messaging_postbacks'].join(',');
      const url = `https://graph.facebook.com/v21.0/${igId}/subscribed_apps?subscribed_fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;
      const res = await fetch(url, { method: 'POST' });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error) {
        this.logger.error(`❌ Erro ao inscrever comentários do Instagram (igId=${igId}): ${JSON.stringify(json.error || json)}`);
        return { ok: false, igId, error: json.error?.message || 'Falha ao inscrever comentários do Instagram' };
      }

      this.logger.log(`✅ Instagram Business ${igId} inscrito para comentários: ${JSON.stringify(json)}`);
      return { ok: true, igId, subscribedFields: fields.split(',') };
    } catch (e: any) {
      this.logger.error(`❌ Erro ao inscrever comentários do Instagram (pageId=${pageId}): ${e.message}`);
      return { ok: false, error: e.message };
    }
  }

  /**
   * Testa se o token da Página ainda é válido, chamando a Graph API.
   */
  async testConnection(id: string) {
    const account = await this.findOne(id);
    try {
      const url = `https://graph.facebook.com/v21.0/${account.pageId}?fields=id,name&access_token=${encodeURIComponent(account.accessToken)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.error) {
        return { ok: false, error: json.error?.message || 'Token inválido ou expirado' };
      }
      return { ok: true, page: json };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
}
