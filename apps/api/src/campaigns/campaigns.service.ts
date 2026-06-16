import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);
  private runningCampaigns = new Map<string, boolean>(); // Para controlar campanhas em execução

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
  ) {}

  // ==========================================
  // CRUD DE CAMPANHAS
  // ==========================================

  async findAll(page = 1, limit = 10, status?: string, accountId?: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};
    if (status) where.status = status;
    if (accountId) where.whatsappAccountId = accountId;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { messages: true }
          },
          whatsappAccount: {
            select: { id: true, name: true, phoneNumber: true },
          },
        }
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      campaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        messages: {
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { messages: true }
        }
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada');
    }

    return campaign;
  }

  async create(data: {
    name: string;
    description?: string;
    templateName: string;
    templateLanguage?: string;
    templateVariables?: any;
    filterTags?: string[];
    filterStatus?: string;
    filterSource?: string;
    filterCustomFields?: any; // { fieldName: value }
    excludeOptOut?: boolean;
    scheduledAt?: Date;
    sendRatePerMinute?: number;
    sendStartHour?: number;
    sendEndHour?: number;
    sendDays?: string; // "0,1,2,3,4,5,6" (0=Dom, 1=Seg...6=Sab)
    whatsappAccountId?: string;
  }) {
    this.logger.log(`Criando campanha: ${data.name} (conta: ${data.whatsappAccountId || 'padrão'})`);
    this.logger.log(`templateVariables recebido: ${JSON.stringify(data.templateVariables)?.slice(0, 500)}`);
    
    const campaign = await this.prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        templateName: data.templateName,
        templateLanguage: data.templateLanguage || 'pt_BR',
        templateVariables: data.templateVariables ? JSON.stringify(data.templateVariables) : null,
        filterTags: data.filterTags ? JSON.stringify(data.filterTags) : null,
        filterStatus: data.filterStatus,
        filterSource: data.filterSource,
        filterCustomFields: data.filterCustomFields ? JSON.stringify(data.filterCustomFields) : null,
        excludeOptOut: data.excludeOptOut ?? true,
        scheduledAt: data.scheduledAt,
        sendRatePerMinute: data.sendRatePerMinute || 10,
        sendStartHour: data.sendStartHour,
        sendEndHour: data.sendEndHour,
        sendDays: data.sendDays,
        whatsappAccountId: data.whatsappAccountId || undefined,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    this.logger.log(`Campanha criada: ${campaign.name} (${campaign.id}) - conta: ${campaign.whatsappAccountId || 'padrão'}`);
    return campaign;
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    templateName: string;
    templateLanguage: string;
    templateVariables: any;
    filterTags: string[];
    filterStatus: string;
    filterSource: string;
    excludeOptOut: boolean;
    scheduledAt: Date;
    sendRatePerMinute: number;
  }>) {
    const campaign = await this.findOne(id);
    
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new BadRequestException('Só é possível editar campanhas em rascunho ou agendadas');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...data,
        templateVariables: data.templateVariables ? JSON.stringify(data.templateVariables) : undefined,
        filterTags: data.filterTags ? JSON.stringify(data.filterTags) : undefined,
      },
    });
  }

  async delete(id: string) {
    const campaign = await this.findOne(id);
    
    if (campaign.status === 'RUNNING') {
      throw new BadRequestException('Não é possível excluir campanha em execução. Pause primeiro.');
    }

    await this.prisma.campaign.delete({ where: { id } });
    this.logger.log(`Campanha excluída: ${id}`);
    return { success: true };
  }

  // ==========================================
  // PREVIEW E CONTAGEM DE CONTATOS
  // ==========================================

  async previewContacts(filters: {
    filterTags?: string[];
    filterStatus?: string;
    filterSource?: string;
    filterCustomFields?: Record<string, string>; // { fieldName: value }
    excludeOptOut?: boolean;
  }) {
    // Buscar todos os contatos e filtrar no código para evitar problemas com Prisma
    let allContacts = await this.prisma.contact.findMany({
      select: {
        id: true,
        name: true,
        phoneE164: true,
        customerStatus: true,
        source: true,
        tags: true,
        optedOut: true,
        customFields: true,
      },
      orderBy: { name: 'asc' },
    });

    // Filtrar contatos com telefone válido
    allContacts = allContacts.filter(c => c.phoneE164 && c.phoneE164.trim() !== '');

    // Filtrar por tags
    if (filters.filterTags && filters.filterTags.length > 0) {
      allContacts = allContacts.filter(c => {
        if (!c.tags) return false;
        return filters.filterTags!.some(tag => c.tags?.includes(tag));
      });
    }

    // Filtrar por status
    if (filters.filterStatus) {
      allContacts = allContacts.filter(c => c.customerStatus === filters.filterStatus);
    }

    // Filtrar por origem
    if (filters.filterSource) {
      allContacts = allContacts.filter(c => c.source === filters.filterSource);
    }

    // Filtrar por campos personalizados
    if (filters.filterCustomFields && Object.keys(filters.filterCustomFields).length > 0) {
      allContacts = allContacts.filter(c => {
        if (!c.customFields) return false;
        try {
          const customFields = typeof c.customFields === 'string' 
            ? JSON.parse(c.customFields) 
            : c.customFields;
          
          return Object.entries(filters.filterCustomFields!).every(([fieldName, expectedValue]) => {
            const actualValue = customFields[fieldName];
            if (actualValue === undefined || actualValue === null) return false;
            // Comparação case-insensitive
            return String(actualValue).toLowerCase() === String(expectedValue).toLowerCase();
          });
        } catch {
          return false;
        }
      });
    }

    // Excluir opt-out
    if (filters.excludeOptOut !== false) {
      allContacts = allContacts.filter(c => !c.optedOut);
    }

    const total = allContacts.length;
    const contacts = allContacts.slice(0, 100); // Limitar preview

    return {
      contacts,
      total,
      showing: Math.min(contacts.length, 100),
    };
  }

  // ==========================================
  // EXECUÇÃO DA CAMPANHA
  // ==========================================

  async start(id: string, forceStart = false) {
    try {
      const campaign = await this.findOne(id);
      
      this.logger.log(`Iniciando campanha: ${campaign.name}`);
      this.logger.log(`Status atual: ${campaign.status}`);
      this.logger.log(`scheduledAt: ${campaign.scheduledAt}`);
      this.logger.log(`sendStartHour: ${campaign.sendStartHour}, sendEndHour: ${campaign.sendEndHour}`);
      this.logger.log(`Hora Brasil atual: ${this.getBrazilHour()}`);
      
      if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED' && campaign.status !== 'PAUSED') {
        throw new BadRequestException(`Não é possível iniciar campanha com status: ${campaign.status}`);
      }

      // Verificar se a campanha está agendada para o futuro
      if (campaign.scheduledAt && !forceStart) {
        const now = new Date();
        const scheduledTime = new Date(campaign.scheduledAt);
        
        if (scheduledTime > now) {
          const diffMs = scheduledTime.getTime() - now.getTime();
          const diffMins = Math.round(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          
          let timeStr = '';
          if (diffDays > 0) {
            timeStr = `${diffDays} dia(s) e ${diffHours % 24} hora(s)`;
          } else if (diffHours > 0) {
            timeStr = `${diffHours} hora(s) e ${diffMins % 60} minuto(s)`;
          } else {
            timeStr = `${diffMins} minuto(s)`;
          }
          
          throw new BadRequestException(
            `Esta campanha está agendada para ${scheduledTime.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}. ` +
            `Faltam ${timeStr}. A campanha será iniciada automaticamente no horário agendado.`
          );
        }
      }

      // NOTA: A verificação de horário é feita no processCampaign
      // Aqui permitimos iniciar a campanha a qualquer momento
      // O envio real só acontece dentro do horário permitido
      if (campaign.sendStartHour !== null && campaign.sendEndHour !== null) {
        const currentHour = this.getBrazilHour();
        if (currentHour < campaign.sendStartHour || currentHour >= campaign.sendEndHour) {
          this.logger.log(`Campanha iniciada fora do horário de envio (${currentHour}h). Mensagens serão enviadas quando entrar no horário ${campaign.sendStartHour}:00 - ${campaign.sendEndHour}:00`);
        } else {
          this.logger.log(`Dentro do horário de envio. Iniciando envios imediatamente.`);
        }
      }

      // Buscar contatos com filtros
      const filters = {
        filterTags: campaign.filterTags ? JSON.parse(campaign.filterTags) : undefined,
        filterStatus: campaign.filterStatus,
        filterSource: campaign.filterSource,
        filterCustomFields: campaign.filterCustomFields ? JSON.parse(campaign.filterCustomFields) : undefined,
        excludeOptOut: campaign.excludeOptOut,
        whatsappAccountId: campaign.whatsappAccountId || undefined,
      };

      this.logger.log(`Filtros da campanha: ${JSON.stringify(filters)}`);

      const { contacts, total } = await this.previewContacts(filters);

      if (total === 0) {
        throw new BadRequestException('Nenhum contato encontrado com os filtros selecionados');
    }

    // Criar mensagens pendentes para cada contato (se ainda não existem)
    const existingMessages = await this.prisma.campaignMessage.findMany({
      where: { campaignId: id },
      select: { contactId: true },
    });
    const existingContactIds = new Set(existingMessages.map(m => m.contactId));

    // Buscar todos os contatos filtrados
    const allContacts = await this.getFilteredContacts(filters);

    if (allContacts.length === 0) {
      throw new BadRequestException('Nenhum contato com telefone válido encontrado');
    }

    const newMessages = allContacts
      .filter(c => !existingContactIds.has(c.id) && c.phoneE164)
      .map(contact => ({
        campaignId: id,
        contactId: contact.id,
        contactPhone: contact.phoneE164!,
        contactName: contact.name || 'Sem nome',
        status: 'PENDING',
      }));

    if (newMessages.length > 0) {
      await this.prisma.campaignMessage.createMany({
        data: newMessages,
      });
    }

    // Atualizar campanha
    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'RUNNING',
        startedAt: campaign.startedAt || new Date(),
        totalContacts: allContacts.length,
      },
    });

    this.logger.log(`Campanha iniciada: ${campaign.name} - ${allContacts.length} contatos`);

    // Iniciar envio em background
    this.processCampaign(id);

    return { success: true, totalContacts: allContacts.length };
    } catch (error) {
      this.logger.error(`Erro ao iniciar campanha ${id}: ${error.message}`);
      throw error;
    }
  }

  async pause(id: string) {
    const campaign = await this.findOne(id);
    
    if (campaign.status !== 'RUNNING') {
      throw new BadRequestException('Só é possível pausar campanha em execução');
    }

    this.runningCampaigns.set(id, false);

    await this.prisma.campaign.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    this.logger.log(`Campanha pausada: ${campaign.name}`);
    return { success: true };
  }

  async cancel(id: string) {
    const campaign = await this.findOne(id);
    
    this.runningCampaigns.set(id, false);

    await this.prisma.campaign.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });

    this.logger.log(`Campanha cancelada: ${campaign.name}`);
    return { success: true };
  }

  // ==========================================
  // PROCESSAMENTO EM BACKGROUND
  // ==========================================

  // Obter hora atual no fuso horário do Brasil (UTC-3)
  private getBrazilHour(): number {
    const now = new Date();
    // Ajustar para UTC-3 (horário de Brasília)
    const brazilOffset = -3;
    const utcHour = now.getUTCHours();
    let brazilHour = utcHour + brazilOffset;
    if (brazilHour < 0) brazilHour += 24;
    if (brazilHour >= 24) brazilHour -= 24;
    return brazilHour;
  }
  
  // Obter dia da semana no fuso horário do Brasil (0=Domingo, 1=Segunda... 6=Sábado)
  private getBrazilDayOfWeek(): number {
    const now = new Date();
    // Ajustar para UTC-3 (horário de Brasília)
    const brazilOffset = -3 * 60 * 60 * 1000; // -3h em ms
    const brazilTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + brazilOffset);
    return brazilTime.getDay();
  }

  async processCampaign(campaignId: string) {
    this.runningCampaigns.set(campaignId, true);

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return;

    const delayMs = Math.floor(60000 / campaign.sendRatePerMinute); // Delay entre mensagens

    this.logger.log(`Processando campanha ${campaign.name} - ${campaign.sendRatePerMinute} msgs/min`);
    if (campaign.sendStartHour !== null && campaign.sendEndHour !== null) {
      this.logger.log(`Horário de envio: ${campaign.sendStartHour}:00 - ${campaign.sendEndHour}:00 (horário de Brasília)`);
    }
    if (campaign.sendDays) {
      this.logger.log(`Dias permitidos: ${campaign.sendDays} (0=Dom, 1=Seg...6=Sab)`);
    }

    while (this.runningCampaigns.get(campaignId)) {
      // Verificar dia da semana (usando horário de Brasília)
      if (campaign.sendDays) {
        const brazilDay = this.getBrazilDayOfWeek();
        const allowedDays = campaign.sendDays.split(',').map(d => parseInt(d.trim()));
        if (!allowedDays.includes(brazilDay)) {
          this.logger.log(`Dia ${brazilDay} não permitido para envio. Aguardando próximo dia válido...`);
          // Pausar e esperar 1 hora, depois verificar novamente
          await this.sleep(60 * 60 * 1000);
          continue;
        }
      }
      
      // Verificar horário de envio (usando horário de Brasília)
      if (campaign.sendStartHour !== null && campaign.sendEndHour !== null) {
        const currentHour = this.getBrazilHour();
        
        if (currentHour < campaign.sendStartHour || currentHour >= campaign.sendEndHour) {
          this.logger.log(`Fora do horário de envio (${currentHour}h Brasília). Aguardando próximo horário válido...`);
          // Pausar e esperar 5 minutos, depois verificar novamente
          await this.sleep(5 * 60 * 1000);
          continue;
        }
      }

      // Buscar próxima mensagem pendente
      const message = await this.prisma.campaignMessage.findFirst({
        where: {
          campaignId,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!message) {
        // Não há mais mensagens pendentes
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
        this.runningCampaigns.delete(campaignId);
        this.logger.log(`Campanha concluída: ${campaign.name}`);
        break;
      }

      // Enviar mensagem
      try {
        const templateVariables = campaign.templateVariables 
          ? JSON.parse(campaign.templateVariables) 
          : undefined;

        // Buscar dados do contato para substituir variáveis
        const contact = await this.prisma.contact.findUnique({
          where: { id: message.contactId },
        });

        // Converter variáveis para o formato da API do Meta
        const components = this.buildTemplateComponents(templateVariables, contact);
        
        // Só enviar components se houver algum válido
        const finalComponents = components.length > 0 ? components : undefined;
        
        this.logger.log(`Enviando template ${campaign.templateName} para ${message.contactPhone} - components: ${JSON.stringify(finalComponents)?.slice(0,200)}`);

        const result = await this.whatsappService.sendTemplate({
          to: message.contactPhone,
          templateName: campaign.templateName,
          language: campaign.templateLanguage,
          components: finalComponents,
        }, campaign.whatsappAccountId || undefined);

        // O WhatsApp retorna o ID em result.messages[0].id
        const waMessageId = result?.messages?.[0]?.id;
        this.logger.log(`📨 waMessageId recebido: ${waMessageId}`);

        // Atualizar mensagem como enviada
        await this.prisma.campaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'SENT',
            waMessageId: waMessageId,
            sentAt: new Date(),
          },
        });

        // Incrementar contador
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } },
        });

        this.logger.log(`✅ Enviado para ${message.contactPhone}`);

      } catch (error) {
        this.logger.error(`❌ Erro ao enviar para ${message.contactPhone}: ${error.message}`);

        await this.prisma.campaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            error: error.message,
          },
        });

        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });
      }

      // Aguardar antes da próxima mensagem
      await this.sleep(delayMs);
    }
  }

  private async getFilteredContacts(filters: any) {
    // Buscar contatos filtrados por conta WhatsApp quando disponível
    const where: any = {};
    if (filters.whatsappAccountId) {
      where.whatsappAccountId = filters.whatsappAccountId;
    }

    let allContacts = await this.prisma.contact.findMany({
      where,
      select: {
        id: true,
        name: true,
        phoneE164: true,
        customerStatus: true,
        source: true,
        tags: true,
        optedOut: true,
        customFields: true,
      },
    });

    // Filtrar contatos com telefone válido
    allContacts = allContacts.filter(c => c.phoneE164 && c.phoneE164.trim() !== '');

    // Filtrar por tags
    if (filters.filterTags && filters.filterTags.length > 0) {
      allContacts = allContacts.filter(c => {
        if (!c.tags) return false;
        return filters.filterTags.some((tag: string) => c.tags?.includes(tag));
      });
    }

    // Filtrar por status
    if (filters.filterStatus) {
      allContacts = allContacts.filter(c => c.customerStatus === filters.filterStatus);
    }

    // Filtrar por origem
    if (filters.filterSource) {
      allContacts = allContacts.filter(c => c.source === filters.filterSource);
    }

    // Filtrar por campos personalizados
    if (filters.filterCustomFields && Object.keys(filters.filterCustomFields).length > 0) {
      allContacts = allContacts.filter(c => {
        if (!c.customFields) return false;
        try {
          const customFields = typeof c.customFields === 'string' 
            ? JSON.parse(c.customFields) 
            : c.customFields;
          
          return Object.entries(filters.filterCustomFields).every(([fieldName, expectedValue]) => {
            const actualValue = customFields[fieldName];
            if (actualValue === undefined || actualValue === null) return false;
            return String(actualValue).toLowerCase() === String(expectedValue).toLowerCase();
          });
        } catch {
          return false;
        }
      });
    }

    // Excluir opt-out
    if (filters.excludeOptOut !== false) {
      allContacts = allContacts.filter(c => !c.optedOut);
    }

    return allContacts;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================
  // ESTATÍSTICAS
  // ==========================================

  async getStats() {
    const [total, draft, scheduled, running, completed, cancelled] = await Promise.all([
      this.prisma.campaign.count(),
      this.prisma.campaign.count({ where: { status: 'DRAFT' } }),
      this.prisma.campaign.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.campaign.count({ where: { status: 'RUNNING' } }),
      this.prisma.campaign.count({ where: { status: 'COMPLETED' } }),
      this.prisma.campaign.count({ where: { status: 'CANCELLED' } }),
    ]);

    // Totais de mensagens
    const messageStats = await this.prisma.campaignMessage.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const messages = messageStats.reduce((acc, curr) => {
      acc[curr.status.toLowerCase()] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      campaigns: { total, draft, scheduled, running, completed, cancelled },
      messages: {
        total: Object.values(messages).reduce((a, b) => a + b, 0),
        ...messages,
      },
    };
  }

  async getCampaignMessages(campaignId: string, page = 1, limit = 50, status?: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { campaignId };
    if (status) where.status = status;

    const [messages, total] = await Promise.all([
      this.prisma.campaignMessage.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaignMessage.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  // ==========================================
  // CONVERSÃO DE VARIÁVEIS DO TEMPLATE
  // ==========================================

  private buildTemplateComponents(templateVariables: any, contact: any): any[] {
    if (!templateVariables) return [];

    const components: any[] = [];

    // Header com mídia (apenas se foi configurado)
    if (templateVariables.headerMedia && templateVariables.headerMedia.url) {
      const mediaType = templateVariables.headerMedia.type; // image, video, document
      const mediaUrl = templateVariables.headerMedia.url;

      const headerComponent: any = {
        type: 'header',
        parameters: [],
      };

      if (mediaType === 'image') {
        headerComponent.parameters.push({
          type: 'image',
          image: { id: mediaUrl }, // Use media ID from Meta API
        });
      } else if (mediaType === 'video') {
        headerComponent.parameters.push({
          type: 'video',
          video: { id: mediaUrl },
        });
      } else if (mediaType === 'document') {
        headerComponent.parameters.push({
          type: 'document',
          document: { id: mediaUrl },
        });
      }

      if (headerComponent.parameters.length > 0) {
        components.push(headerComponent);
      }
    }

    // Header com variáveis de texto
    if (templateVariables.header && templateVariables.header.length > 0) {
      const headerParams = templateVariables.header.map((v: any) => ({
        type: 'text',
        text: this.resolveVariableValue(v, contact),
      }));

      // Verificar se já tem header (com mídia), se não adicionar
      const existingHeader = components.find(c => c.type === 'header');
      if (existingHeader) {
        existingHeader.parameters.push(...headerParams);
      } else {
        components.push({
          type: 'header',
          parameters: headerParams,
        });
      }
    }

    // Body
    if (templateVariables.body && templateVariables.body.length > 0) {
      components.push({
        type: 'body',
        parameters: templateVariables.body.map((v: any) => ({
          type: 'text',
          text: this.resolveVariableValue(v, contact),
        })),
      });
    }

    return components;
  }

  private resolveVariableValue(variable: any, contact: any): string {
    if (!variable) return '';

    // Se for valor fixo
    if (variable.type === 'fixed' || variable.type === 'text') {
      return variable.value || '';
    }

    // Se for campo do contato
    if (variable.type === 'contact_field' && contact) {
      const field = variable.value;
      
      // Campos padrão
      if (field === 'name') return contact.name || 'Cliente';
      if (field === 'firstName') {
        return (contact.name || 'Cliente').split(' ')[0];
      }
      if (field === 'phone') return contact.phone || contact.phoneE164 || '';
      if (field === 'email') return contact.email || '';
      if (field === 'company') return contact.company || '';
      if (field === 'source') return contact.source || '';
      if (field === 'customerStatus') return contact.customerStatus || '';
      
      // Campos customizados
      if (contact.customFields) {
        try {
          const customFields = typeof contact.customFields === 'string' 
            ? JSON.parse(contact.customFields) 
            : contact.customFields;
          if (customFields[field]) return customFields[field];
        } catch {}
      }
      
      return variable.fallback || '';
    }

    return variable.value || '';
  }
}
