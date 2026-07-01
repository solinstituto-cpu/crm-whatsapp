import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);
  
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1, 
    limit = 10, 
    status?: string, 
    accountId?: string,
    filters?: { unreadOnly?: boolean; assignedToId?: string; search?: string; hasTags?: boolean }
  ) {
    try {
      // Garantir que page e limit são números
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;
      
      // Construir filtro where
      const where: any = {};
      if (status) {
        where.status = status;
      }
      // Filtrar por conta WhatsApp (se especificado)
      if (accountId) {
        where.whatsappAccountId = accountId;
      }
      
      // Filtros adicionais
      if (filters?.unreadOnly) {
        where.unreadCount = { gt: 0 };
      }
      if (filters?.assignedToId) {
        where.assignedToId = filters.assignedToId;
      }
      if (filters?.search) {
        where.OR = [
          { phoneE164: { contains: filters.search } },
          { contact: { name: { contains: filters.search, mode: 'insensitive' } } },
          { contact: { phoneE164: { contains: filters.search } } },
        ];
      }
      
      if (filters?.hasTags !== undefined) {
        if (filters.hasTags === true) {
          // Campanhas: tem tags que NÃO sejam vazias ou apenas Golden/gold
          where.contact = {
            ...(where.contact || {}),
            tags: {
              notIn: ['[]', '', '["Golden"]', '["golden"]', '["Gold"]', '["gold"]'],
            }
          };
        } else {
          // Ativas: sem contato OU contato sem tags OU que contenha a tag Golden/gold
          const noTagsCondition = {
            OR: [
              { contactId: null },
              { contact: { tags: { in: ['[]', ''] } } },
              { contact: { tags: { contains: 'olden', mode: 'insensitive' as const } } },
            ]
          };
          
          if (where.OR) {
            where.AND = [
              { OR: where.OR },
              noTagsCondition
            ];
            delete where.OR;
          } else {
            where.OR = noTagsCondition.OR;
          }
        }
      }

      this.logger.log(`Fetching conversations: page=${pageNum}, limit=${limitNum}, status=${status || 'all'}, accountId=${accountId || 'all'}, filters=${JSON.stringify(filters)}`);

      const [conversations, total] = await Promise.all([
        this.prisma.conversation.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            contact: true,
            assignedTo: {
              select: { id: true, name: true, email: true, color: true },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            // Incluir dados da conta WhatsApp
            whatsappAccount: {
              select: { id: true, name: true, phoneNumber: true },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
        }),
        this.prisma.conversation.count({ where }),
      ]);

      this.logger.log(`Found ${conversations.length} conversations`);

      return {
        conversations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            assignedTo: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, color: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        // Incluir dados da conta WhatsApp
        whatsappAccount: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { status },
    });
  }

  async markMessagesAsRead(conversationId: string) {
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        direction: 'IN',
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
      },
    });
    
    // Zerar contador de não lidas
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
    
    this.logger.log(`Marked ${result.count} messages as read in conversation ${conversationId}`);
    return { marked: result.count };
  }

  async addMessage(conversationId: string, messageData: any) {
    return this.prisma.message.create({
      data: {
        conversationId,
        ...messageData,
      },
    });
  }

  async findOrCreateByPhone(
    phoneE164: string,
    whatsappAccountId?: string | null,
    contactId?: string,
  ) {
    const accountId = whatsappAccountId ?? null;
    this.logger.log(
      `Finding or creating conversation for ${phoneE164} (account: ${accountId || 'none'}, contactId: ${contactId || 'none'})`,
    );

    const conversationInclude = {
      contact: true,
      messages: {
        orderBy: { createdAt: 'desc' as const },
        take: 20,
      },
    };

    let contact = contactId
      ? await this.prisma.contact.findUnique({ where: { id: contactId } })
      : null;

    if (!contact) {
      contact = await this.prisma.contact.findFirst({
        where: {
          phoneE164_whatsappAccountId: {
            phoneE164,
            whatsappAccountId: accountId,
          },
        },
      });
    }

    if (!contact) {
      this.logger.log(`Creating new contact for ${phoneE164} on account ${accountId || 'none'}`);
      contact = await this.prisma.contact.create({
        data: {
          phoneE164,
          name: phoneE164,
          tags: '[]',
          whatsappAccountId: accountId,
        },
      });
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        ...(accountId ? { whatsappAccountId: accountId } : {}),
      },
      include: conversationInclude,
    });

    if (!conversation && accountId) {
      conversation = await this.prisma.conversation.findFirst({
        where: { phoneE164, whatsappAccountId: accountId },
        include: conversationInclude,
      });
      if (conversation && !conversation.contactId) {
        conversation = await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { contactId: contact.id },
          include: conversationInclude,
        });
      }
    }

    if (!conversation) {
      this.logger.log(`Creating new conversation for contact ${contact.id} on account ${accountId || 'none'}`);
      conversation = await this.prisma.conversation.create({
        data: {
          contactId: contact.id,
          phoneE164,
          status: 'OPEN',
          whatsappAccountId: accountId ?? undefined,
        },
        include: conversationInclude,
      });
    } else if (!conversation.whatsappAccountId && accountId) {
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { whatsappAccountId: accountId },
        include: conversationInclude,
      });
    }

    this.logger.log(`Returning conversation ${conversation.id}`);
    return conversation;
  }

  async remove(id: string) {
    this.logger.log(`Deleting conversation ${id} and all its messages`);
    
    // Primeiro deletar todas as mensagens
    await this.prisma.message.deleteMany({
      where: { conversationId: id },
    });
    
    // Depois deletar a conversa
    await this.prisma.conversation.delete({
      where: { id },
    });
    
    this.logger.log(`Conversation ${id} deleted successfully`);
    return { deleted: true, id };
  }

  // ==========================================
  // ATRIBUIÇÃO DE ATENDENTE
  // ==========================================

  /**
   * Atribuir um atendente a uma conversa
   */
  async assignToUser(conversationId: string, userId: string, userName: string, transferredBy?: string) {
    this.logger.log(`Assigning conversation ${conversationId} to user ${userId} (${userName})`);

    // Verificar se já tem alguém atribuído
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        assignedTo: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversa não encontrada');
    }

    // Se já tem alguém atribuído e não é o mesmo usuário
    // Se for uma transferência (transferredBy), permitir a reatribuição
    if (conversation.assignedToId && conversation.assignedToId !== userId && !transferredBy) {
      return {
        success: false,
        alreadyAssigned: true,
        assignedTo: conversation.assignedTo,
        message: `Esta conversa já está sendo atendida por ${conversation.assignedTo?.name}`,
      };
    }

    // Se é o mesmo usuário, apenas confirmar
    if (conversation.assignedToId === userId) {
      // Buscar dados completos do usuário atual
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, color: true },
      });
      return {
        success: true,
        alreadyAssigned: false,
        assignedTo: currentUser,
        message: 'Você já está atendendo esta conversa',
      };
    }

    // Atribuir ao novo usuário e adicionar mensagem de sistema
    let messageText = `Atendimento iniciado por ${userName}`;
    if (transferredBy) {
      messageText = `Conversa transferida de ${transferredBy} para ${userName}`;
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          assignedToId: userId,
          assignedAt: new Date(),
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, color: true },
          },
        },
      }),
      this.prisma.message.create({
        data: {
          conversationId,
          direction: 'OUT',
          type: 'system',
          body: messageText,
          status: 'SENT'
        }
      })
    ]);

    // Também atualizar o contato vinculado com o mesmo atendente
    if (conversation.contactId) {
      await this.prisma.contact.update({
        where: { id: conversation.contactId },
        data: { assignedToId: userId },
      });
      this.logger.log(`Contact ${conversation.contactId} also assigned to ${userName}`);
    }

    this.logger.log(`Conversation ${conversationId} assigned to ${userName}`);

    return {
      success: true,
      alreadyAssigned: false,
      assignedTo: updated.assignedTo,
      message: `Conversa atribuída a ${userName}`,
    };
  }

  /**
   * Liberar atendente de uma conversa
   */
  async unassign(conversationId: string) {
    this.logger.log(`Unassigning conversation ${conversationId}`);

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedToId: null,
        assignedAt: null,
      },
    });

    return {
      success: true,
      message: 'Atendimento liberado',
    };
  }

  /**
   * Verificar quem está atendendo uma conversa
   */
  async getAssignment(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!conversation) {
      return { assigned: false };
    }

    return {
      assigned: !!conversation.assignedToId,
      assignedTo: conversation.assignedTo,
      assignedAt: conversation.assignedAt,
    };
  }

  /**
   * Arquivar ou desarquivar uma conversa
   */
  async archiveConversation(conversationId: string, archived: boolean) {
    this.logger.log(`${archived ? 'Archiving' : 'Unarchiving'} conversation ${conversationId}`);

    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: archived ? 'ARCHIVED' : 'OPEN',
      },
    });

    return {
      success: true,
      archived,
      message: archived ? 'Conversa arquivada' : 'Conversa desarquivada',
    };
  }

  /**
   * Popular lastIncomingMessageAt para conversas existentes
   * Este método busca a última mensagem recebida (direction = IN) de cada conversa
   * e atualiza o campo lastIncomingMessageAt
   */
  async populateLastIncomingMessageAt() {
    this.logger.log('Populating lastIncomingMessageAt for existing conversations...');

    // Buscar todas as conversas que não têm lastIncomingMessageAt
    const conversations = await this.prisma.conversation.findMany({
      where: {
        lastIncomingMessageAt: null,
      },
      select: { id: true },
    });

    this.logger.log(`Found ${conversations.length} conversations without lastIncomingMessageAt`);

    let updated = 0;

    for (const conv of conversations) {
      // Buscar a última mensagem recebida do cliente nesta conversa
      const lastIncoming = await this.prisma.message.findFirst({
        where: {
          conversationId: conv.id,
          direction: 'IN', // Mensagem do cliente
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      if (lastIncoming) {
        await this.prisma.conversation.update({
          where: { id: conv.id },
          data: { lastIncomingMessageAt: lastIncoming.createdAt },
        });
        updated++;
      }
    }

    this.logger.log(`Updated ${updated} conversations with lastIncomingMessageAt`);

    return {
      total: conversations.length,
      updated,
      message: `${updated} conversas atualizadas com lastIncomingMessageAt`,
    };
  }

  /**
   * Corrigir conversas órfãs sem whatsappAccountId
   * Para cada conversa sem conta, copia o whatsappAccountId do contato vinculado
   * Isso corrige conversas criadas por campanhas que tinham o bug de não salvar a conta
   */
  async fixOrphanedConversationAccounts() {
    this.logger.log('Corrigindo conversas órfãs sem whatsappAccountId...');

    // Buscar conversas sem whatsappAccountId que têm contato com conta
    const orphanedConversations = await this.prisma.conversation.findMany({
      where: {
        whatsappAccountId: null,
      },
      include: {
        contact: {
          select: { id: true, name: true, whatsappAccountId: true },
        },
      },
    });

    this.logger.log(`Encontradas ${orphanedConversations.length} conversas sem whatsappAccountId`);

    let fixed = 0;
    let skipped = 0;

    for (const conv of orphanedConversations) {
      if (conv.contact?.whatsappAccountId) {
        await this.prisma.conversation.update({
          where: { id: conv.id },
          data: { whatsappAccountId: conv.contact.whatsappAccountId },
        });
        fixed++;
        this.logger.log(`✅ Conversa ${conv.id} (${conv.contact?.name}) → conta ${conv.contact.whatsappAccountId}`);
      } else {
        skipped++;
      }
    }

    this.logger.log(`Migração concluída: ${fixed} corrigidas, ${skipped} sem conta no contato`);

    return {
      total: orphanedConversations.length,
      fixed,
      skipped,
      message: `${fixed} conversas vinculadas à conta WhatsApp correta. ${skipped} conversas sem conta no contato (ignoradas).`,
    };
  }
}