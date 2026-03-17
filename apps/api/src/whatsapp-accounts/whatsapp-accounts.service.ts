import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateWhatsAppAccountDto {
  name: string;
  phoneNumber: string;
  phoneNumberId: string;
  businessId: string;
  accessToken: string;
  webhookVerifyToken?: string;
  isDefault?: boolean;
}

export interface UpdateWhatsAppAccountDto {
  name?: string;
  phoneNumber?: string;
  phoneNumberId?: string;
  businessId?: string;
  accessToken?: string;
  webhookVerifyToken?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

@Injectable()
export class WhatsAppAccountsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todas as contas WhatsApp
   */
  async findAll() {
    return this.prisma.whatsAppAccount.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });
  }

  /**
   * Busca uma conta por ID
   */
  async findOne(id: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Conta WhatsApp não encontrada');
    }

    return account;
  }

  /**
   * Busca uma conta pelo phoneNumberId (usado no webhook)
   */
  async findByPhoneNumberId(phoneNumberId: string) {
    return this.prisma.whatsAppAccount.findUnique({
      where: { phoneNumberId },
    });
  }

  /**
   * Busca a conta padrão do sistema
   */
  async findDefault() {
    // Primeiro tenta encontrar a conta marcada como padrão
    let account = await this.prisma.whatsAppAccount.findFirst({
      where: { isDefault: true, isActive: true },
    });

    // Se não houver conta padrão, retorna a primeira conta ativa
    if (!account) {
      account = await this.prisma.whatsAppAccount.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    return account;
  }

  /**
   * Cria uma nova conta WhatsApp
   */
  async create(data: CreateWhatsAppAccountDto) {
    // Se for a primeira conta ou marcada como padrão, garante que é única
    if (data.isDefault) {
      await this.prisma.whatsAppAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Se for a primeira conta, marca como padrão automaticamente
    const count = await this.prisma.whatsAppAccount.count();
    const isDefault = count === 0 ? true : data.isDefault || false;

    return this.prisma.whatsAppAccount.create({
      data: {
        ...data,
        isDefault,
      },
    });
  }

  /**
   * Atualiza uma conta WhatsApp
   */
  async update(id: string, data: UpdateWhatsAppAccountDto) {
    // Verifica se a conta existe
    await this.findOne(id);

    // Se está marcando como padrão, desmarca as outras
    if (data.isDefault) {
      await this.prisma.whatsAppAccount.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.whatsAppAccount.update({
      where: { id },
      data,
    });
  }

  /**
   * Remove uma conta WhatsApp
   */
  async remove(id: string) {
    const account = await this.findOne(id);

    // Não permite remover a única conta do sistema
    const count = await this.prisma.whatsAppAccount.count();
    if (count <= 1) {
      throw new BadRequestException('Não é possível remover a única conta do sistema');
    }

    // Não permite remover conta com conversas ativas
    if (account._count.conversations > 0) {
      // Podemos desvincular as conversas ou impedir a remoção
      // Por segurança, vamos desvincular
      await this.prisma.conversation.updateMany({
        where: { whatsappAccountId: id },
        data: { whatsappAccountId: null },
      });
    }

    // Se era a conta padrão, marca outra como padrão
    if (account.isDefault) {
      const nextDefault = await this.prisma.whatsAppAccount.findFirst({
        where: { id: { not: id }, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (nextDefault) {
        await this.prisma.whatsAppAccount.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return this.prisma.whatsAppAccount.delete({
      where: { id },
    });
  }

  /**
   * Define uma conta como padrão
   */
  async setDefault(id: string) {
    // Verifica se a conta existe
    await this.findOne(id);

    // Desmarca todas as outras
    await this.prisma.whatsAppAccount.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Marca a conta selecionada como padrão
    return this.prisma.whatsAppAccount.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  /**
   * Testa a conexão com a API do WhatsApp
   */
  async testConnection(id: string) {
    const account = await this.findOne(id);

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${account.phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'Erro ao conectar com a API',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          verifiedName: data.verified_name,
          displayPhoneNumber: data.display_phone_number,
          qualityRating: data.quality_rating,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro de conexão',
      };
    }
  }

  /**
   * Cria conta padrão a partir das variáveis de ambiente (migração inicial)
   * Usa as mesmas variáveis que o sistema já usa: WHATSAPP_BUSINESS_PHONE_ID, etc.
   */
  async createFromEnvIfEmpty() {
    const count = await this.prisma.whatsAppAccount.count();
    
    if (count === 0) {
      // Usar as variáveis de ambiente que já existem no sistema
      const phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_ID;
      const businessId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.WHATSAPP_BUSINESS_ID || '';
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const verifyToken = process.env.WA_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || 'sol_verify_token';

      if (phoneNumberId && accessToken) {
        console.log('🔄 Criando conta WhatsApp padrão a partir do .env...');
        
        await this.create({
          name: 'Principal',
          phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || 'Número Principal',
          phoneNumberId,
          businessId,
          accessToken,
          webhookVerifyToken: verifyToken,
          isDefault: true,
        });

        console.log('✅ Conta WhatsApp padrão criada com sucesso!');
        return true;
      } else {
        console.log('⚠️ Variáveis de ambiente do WhatsApp não configuradas, pulando criação de conta padrão');
      }
    } else {
      console.log(`ℹ️ Já existem ${count} conta(s) WhatsApp cadastrada(s)`);
    }
    
    return false;
  }

  // ==========================================
  // CONTROLE DE ACESSO POR USUÁRIO
  // ==========================================

  /**
   * Lista contas WhatsApp que um usuário pode acessar
   * Se o usuário não tem nenhuma conta atribuída, retorna TODAS (admin/compatibilidade)
   */
  async findAllForUser(userId: string) {
    // Verifica se o usuário tem contas específicas atribuídas
    const userAccounts = await this.prisma.userWhatsAppAccount.findMany({
      where: { userId },
      select: { accountId: true },
    });

    // Se não tem nenhuma conta específica, retorna todas (para compatibilidade e admins)
    if (userAccounts.length === 0) {
      return this.findAll();
    }

    // Retorna apenas as contas atribuídas ao usuário
    const accountIds = userAccounts.map(ua => ua.accountId);
    return this.prisma.whatsAppAccount.findMany({
      where: {
        id: { in: accountIds },
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
      },
    });
  }

  /**
   * Busca uma conta incluindo os usuários que têm acesso
   */
  async findOneWithUsers(id: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            campaigns: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Conta WhatsApp não encontrada');
    }

    // Formata os usuários para facilitar no frontend
    return {
      ...account,
      allowedUsers: account.users.map(u => u.user),
    };
  }

  /**
   * Atribui usuários a uma conta WhatsApp
   */
  async setAccountUsers(accountId: string, userIds: string[]) {
    // Verifica se a conta existe
    await this.findOne(accountId);

    // Remove todas as atribuições atuais
    await this.prisma.userWhatsAppAccount.deleteMany({
      where: { accountId },
    });

    // Se não houver userIds (array vazio), todos terão acesso (sem restrição)
    if (userIds.length === 0) {
      return { message: 'Acesso aberto a todos os usuários', userIds: [] };
    }

    // Cria novas atribuições
    await this.prisma.userWhatsAppAccount.createMany({
      data: userIds.map(userId => ({
        userId,
        accountId,
      })),
      skipDuplicates: true,
    });

    return { message: 'Usuários atualizados', userIds };
  }

  /**
   * Verifica se um usuário tem acesso a uma conta específica
   */
  async userHasAccess(userId: string, accountId: string): Promise<boolean> {
    // Verifica se o usuário tem restrições
    const userAccountsCount = await this.prisma.userWhatsAppAccount.count({
      where: { userId },
    });

    // Se não tem nenhuma conta atribuída, tem acesso a todas
    if (userAccountsCount === 0) {
      return true;
    }

    // Verifica se tem acesso à conta específica
    const hasAccess = await this.prisma.userWhatsAppAccount.findFirst({
      where: { userId, accountId },
    });

    return !!hasAccess;
  }
}