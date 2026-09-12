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
