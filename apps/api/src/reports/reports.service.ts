import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ReportFilters {
  period?: string; // '7d', '30d', 'month', 'custom'
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  // Helper para calcular datas baseado no período
  private getDateRange(filters: ReportFilters): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (filters.period) {
      case '30d':
        start = new Date(end);
        start.setDate(start.getDate() - 30);
        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 30);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
        break;
      case 'custom':
        start = filters.startDate ? new Date(filters.startDate) : new Date(end);
        start.setDate(start.getDate() - 7);
        const customDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - customDays);
        if (filters.endDate) {
          end.setTime(new Date(filters.endDate).getTime());
        }
        break;
      case '7d':
      default:
        start = new Date(end);
        start.setDate(start.getDate() - 7);
        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 7);
        break;
    }

    return { start, end, previousStart, previousEnd };
  }

  // Calcular variação percentual
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    this.logger.log('Gerando estatísticas do dashboard...');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Contagem de contatos
    const [totalContacts, contactsThisWeek, contactsThisMonth] = await Promise.all([
      this.prisma.contact.count(),
      this.prisma.contact.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.contact.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    // Contagem de conversas
    const [totalConversations, activeConversations, unreadConversations] = await Promise.all([
      this.prisma.conversation.count(),
      this.prisma.conversation.count({ where: { status: 'OPEN' } }),
      this.prisma.conversation.count({ where: { unreadCount: { gt: 0 } } }),
    ]);

    // Contagem de mensagens
    const [messagesToday, messagesThisWeek, totalMessages] = await Promise.all([
      this.prisma.message.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.message.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.message.count(),
    ]);

    // Contagem de deals
    const [totalDeals, wonDeals, lostDeals, totalRevenue] = await Promise.all([
      this.prisma.deal.count(),
      this.prisma.deal.count({ where: { wonAt: { not: null } } }),
      this.prisma.deal.count({ where: { lostAt: { not: null } } }),
      this.prisma.deal.aggregate({ where: { wonAt: { not: null } }, _sum: { amount: true } }),
    ]);

    // Deals abertos (nem ganhos nem perdidos)
    const openDeals = totalDeals - wonDeals - lostDeals;

    // Campanhas
    const [totalCampaigns, runningCampaigns, completedCampaigns] = await Promise.all([
      this.prisma.campaign.count(),
      this.prisma.campaign.count({ where: { status: 'RUNNING' } }),
      this.prisma.campaign.count({ where: { status: 'COMPLETED' } }),
    ]);

    // Estatísticas de campanhas (soma de todos os contadores)
    const campaignStats = await this.prisma.campaign.aggregate({
      _sum: {
        sentCount: true,
        deliveredCount: true,
        readCount: true,
        failedCount: true,
      },
    });

    // Atividade recente - combina várias fontes
    const [recentInboundMessages, recentOutboundMessages, recentContactsCreated, recentCampaignsSent] = await Promise.all([
      // Últimas mensagens recebidas
      this.prisma.message.findMany({
        where: { direction: 'INBOUND' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          conversation: {
            include: { contact: true },
          },
        },
      }),
      // Últimas mensagens enviadas
      this.prisma.message.findMany({
        where: { direction: 'OUTBOUND' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          conversation: {
            include: { contact: true },
          },
        },
      }),
      // Últimos contatos criados
      this.prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      // Últimas campanhas concluídas
      this.prisma.campaign.findMany({
        where: { status: { in: ['COMPLETED', 'RUNNING'] } },
        orderBy: { updatedAt: 'desc' },
        take: 2,
      }),
    ]);

    // Combinar todas as atividades
    const activities: any[] = [];

    recentInboundMessages.forEach(m => {
      activities.push({
        id: m.id,
        type: 'message_in',
        title: `Mensagem de ${m.conversation?.contact?.name || 'Desconhecido'}`,
        description: m.body?.slice(0, 40) + (m.body && m.body.length > 40 ? '...' : '') || 'Mídia recebida',
        time: m.createdAt,
      });
    });

    recentOutboundMessages.forEach(m => {
      activities.push({
        id: m.id,
        type: 'message_out',
        title: `Mensagem para ${m.conversation?.contact?.name || 'Desconhecido'}`,
        description: m.body?.slice(0, 40) + (m.body && m.body.length > 40 ? '...' : '') || 'Template enviado',
        time: m.createdAt,
      });
    });

    recentContactsCreated.forEach(c => {
      activities.push({
        id: c.id,
        type: 'contact',
        title: `Novo contato: ${c.name}`,
        description: c.phoneE164,
        time: c.createdAt,
      });
    });

    recentCampaignsSent.forEach(c => {
      activities.push({
        id: c.id,
        type: 'campaign',
        title: `Campanha: ${c.name}`,
        description: c.status === 'COMPLETED' ? `${c.sentCount} enviadas` : 'Em execução',
        time: c.updatedAt,
      });
    });

    // Ordenar por tempo e pegar os 8 mais recentes
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentActivity = activities.slice(0, 8);

    // Novos contatos recentes
    const recentContacts = await this.prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Campanhas recentes
    const recentCampaigns = await this.prisma.campaign.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        sentCount: true,
        deliveredCount: true,
        completedAt: true,
        createdAt: true,
      },
    });

    // SLA stats por Atendente
    const openConversationsSLA = await this.prisma.conversation.findMany({
      where: { unreadCount: { gt: 0 } },
      include: { assignedTo: true },
    });

    const agentSlaStatsMap: Record<string, any> = {};
    const nowTime = new Date().getTime();

    openConversationsSLA.forEach(conv => {
      const agentId = conv.assignedToId || 'unassigned';
      const agentName = conv.assignedTo?.name || 'Sem Atendente';
      
      if (!agentSlaStatsMap[agentId]) {
        agentSlaStatsMap[agentId] = {
          agentId,
          agentName,
          green: 0,
          yellow: 0,
          red: 0,
          white: 0,
          total: 0,
        };
      }

      const incomingTime = conv.lastIncomingMessageAt || conv.updatedAt || new Date().toISOString();
      const waitTimeMs = nowTime - new Date(incomingTime).getTime();
      const waitTimeHours = waitTimeMs / (1000 * 60 * 60);

      agentSlaStatsMap[agentId].total++;
      if (waitTimeHours > 6) {
        agentSlaStatsMap[agentId].white++;
      } else if (waitTimeHours > 4) {
        agentSlaStatsMap[agentId].red++;
      } else if (waitTimeHours > 2) {
        agentSlaStatsMap[agentId].yellow++;
      } else {
        agentSlaStatsMap[agentId].green++;
      }
    });

    const agentSlaStats = Object.values(agentSlaStatsMap).sort((a: any, b: any) => b.total - a.total);

    return {
      // Cards principais
      summary: {
        totalContacts,
        contactsThisWeek,
        contactsThisMonth,
        totalConversations,
        activeConversations,
        unreadConversations,
        messagesToday,
        messagesThisWeek,
        totalMessages,
        totalDeals,
        openDeals,
        wonDeals,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      // Campanhas
      campaigns: {
        total: totalCampaigns,
        running: runningCampaigns,
        completed: completedCampaigns,
        messagesSent: campaignStats._sum.sentCount || 0,
        messagesDelivered: campaignStats._sum.deliveredCount || 0,
        messagesRead: campaignStats._sum.readCount || 0,
        messagesFailed: campaignStats._sum.failedCount || 0,
      },
      // Atividade recente (já montada acima)
      recentActivity,
      // Novos contatos
      recentContacts: recentContacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phoneE164,
        createdAt: c.createdAt,
      })),
      // Campanhas recentes
      recentCampaigns: recentCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        sent: c.sentCount,
        delivered: c.deliveredCount,
        completedAt: c.completedAt,
        createdAt: c.createdAt,
      })),
      // SLA por Atendente
      agentSlaStats,
      // Timestamp
      generatedAt: new Date(),
    };
  }

  // ==========================================
  // REPORTS PAGE - MÉTRICAS COM FILTROS
  // ==========================================
  async getReportMetrics(filters: ReportFilters) {
    this.logger.log('Gerando métricas de relatório com filtros:', filters);

    const { start, end, previousStart, previousEnd } = this.getDateRange(filters);

    // Contatos no período atual vs anterior
    const [contactsCurrent, contactsPrevious] = await Promise.all([
      this.prisma.contact.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.contact.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
    ]);

    // Conversas no período atual vs anterior
    const [conversationsCurrent, conversationsPrevious] = await Promise.all([
      this.prisma.conversation.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.conversation.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
    ]);

    // Receita no período atual vs anterior
    const [revenueCurrent, revenuePrevious] = await Promise.all([
      this.prisma.deal.aggregate({
        where: { wonAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.deal.aggregate({
        where: { wonAt: { gte: previousStart, lte: previousEnd } },
        _sum: { amount: true },
      }),
    ]);

    // Deals fechados para calcular conversão
    const [totalDealsCurrent, wonDealsCurrent, totalDealsPrevious, wonDealsPrevious] = await Promise.all([
      this.prisma.deal.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.deal.count({ where: { wonAt: { gte: start, lte: end } } }),
      this.prisma.deal.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
      this.prisma.deal.count({ where: { wonAt: { gte: previousStart, lte: previousEnd } } }),
    ]);

    // Total de contatos (acumulado)
    const totalContacts = await this.prisma.contact.count();
    const totalConversations = await this.prisma.conversation.count();
    const totalRevenue = await this.prisma.deal.aggregate({
      where: { wonAt: { not: null } },
      _sum: { amount: true },
    });

    const currentRevenue = revenueCurrent._sum.amount || 0;
    const previousRevenue = revenuePrevious._sum.amount || 0;

    const conversionCurrent = totalDealsCurrent > 0 ? (wonDealsCurrent / totalDealsCurrent) * 100 : 0;
    const conversionPrevious = totalDealsPrevious > 0 ? (wonDealsPrevious / totalDealsPrevious) * 100 : 0;

    return {
      totalContacts,
      contactsGrowth: this.calculateGrowth(contactsCurrent, contactsPrevious),
      contactsInPeriod: contactsCurrent,
      totalConversations,
      conversationsGrowth: this.calculateGrowth(conversationsCurrent, conversationsPrevious),
      conversationsInPeriod: conversationsCurrent,
      totalRevenue: totalRevenue._sum.amount || 0,
      revenueInPeriod: currentRevenue,
      revenueGrowth: this.calculateGrowth(currentRevenue, previousRevenue),
      conversionRate: Math.round(conversionCurrent * 10) / 10,
      conversionGrowth: this.calculateGrowth(conversionCurrent, conversionPrevious),
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        previousStart: previousStart.toISOString(),
        previousEnd: previousEnd.toISOString(),
      },
    };
  }

  // ==========================================
  // CONVERSAS POR DIA (GRÁFICO)
  // ==========================================
  async getConversationsChart(filters: ReportFilters) {
    const { start, end } = this.getDateRange(filters);

    // Buscar todas as conversas no período
    const conversations = await this.prisma.conversation.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    });

    // Agrupar por dia
    const dayMap: Record<string, number> = {};
    const current = new Date(start);
    while (current <= end) {
      const dateKey = current.toISOString().split('T')[0];
      dayMap[dateKey] = 0;
      current.setDate(current.getDate() + 1);
    }

    conversations.forEach((conv) => {
      const dateKey = conv.createdAt.toISOString().split('T')[0];
      if (dayMap[dateKey] !== undefined) {
        dayMap[dateKey]++;
      }
    });

    // Mensagens por dia também
    const messages = await this.prisma.message.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true },
    });

    const messageDayMap: Record<string, number> = {};
    Object.keys(dayMap).forEach((key) => (messageDayMap[key] = 0));

    messages.forEach((msg) => {
      const dateKey = msg.createdAt.toISOString().split('T')[0];
      if (messageDayMap[dateKey] !== undefined) {
        messageDayMap[dateKey]++;
      }
    });

    return {
      labels: Object.keys(dayMap).map((d) => {
        const date = new Date(d);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }),
      conversations: Object.values(dayMap),
      messages: Object.values(messageDayMap),
    };
  }

  // ==========================================
  // TOP CONTATOS
  // ==========================================
  async getTopContacts(filters: ReportFilters) {
    const { start, end } = this.getDateRange(filters);

    // Contatos com mais mensagens e maior receita
    const contacts = await this.prisma.contact.findMany({
      include: {
        conversations: {
          include: {
            messages: {
              where: { createdAt: { gte: start, lte: end } },
              select: { id: true },
            },
          },
        },
        deals: {
          where: { wonAt: { gte: start, lte: end } },
          select: { amount: true },
        },
      },
    });

    const ranked = contacts
      .map((c) => {
        const messageCount = c.conversations.reduce((acc, conv) => acc + conv.messages.length, 0);
        const totalRevenue = c.deals.reduce((acc, deal) => acc + (deal.amount || 0), 0);
        return {
          id: c.id,
          name: c.name,
          phone: c.phoneE164,
          messageCount,
          revenue: totalRevenue,
        };
      })
      .filter((c) => c.messageCount > 0 || c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue || b.messageCount - a.messageCount)
      .slice(0, 10);

    return ranked.map((c, index) => ({ ...c, rank: index + 1 }));
  }

  // ==========================================
  // ATIVIDADE POR PERÍODO (TABELA)
  // ==========================================
  async getActivityByPeriod() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const periods = [
      { label: 'Hoje', start: startOfToday, end: now },
      { label: 'Ontem', start: startOfYesterday, end: startOfToday },
      { label: 'Esta Semana', start: startOfWeek, end: now },
      { label: 'Semana Passada', start: startOfLastWeek, end: startOfWeek },
      { label: 'Este Mês', start: startOfMonth, end: now },
      { label: 'Mês Passado', start: startOfLastMonth, end: endOfLastMonth },
    ];

    const results = await Promise.all(
      periods.map(async (p) => {
        const [contacts, messages, deals, revenue] = await Promise.all([
          this.prisma.contact.count({ where: { createdAt: { gte: p.start, lt: p.end } } }),
          this.prisma.message.count({ where: { createdAt: { gte: p.start, lt: p.end } } }),
          this.prisma.deal.count({ where: { wonAt: { gte: p.start, lt: p.end } } }),
          this.prisma.deal.aggregate({
            where: { wonAt: { gte: p.start, lt: p.end } },
            _sum: { amount: true },
          }),
        ]);
        return {
          period: p.label,
          contacts,
          messages,
          deals,
          revenue: revenue._sum.amount || 0,
        };
      }),
    );

    return results;
  }

  // ==========================================
  // EXPORTAR DADOS (CSV)
  // ==========================================
  async exportData(filters: ReportFilters, exportType: string) {
    const { start, end } = this.getDateRange(filters);

    let data: any[] = [];
    let headers: string[] = [];

    switch (exportType) {
      case 'contacts':
        headers = ['Nome', 'Telefone', 'Email', 'Empresa', 'Status', 'Criado Em'];
        const contacts = await this.prisma.contact.findMany({
          where: { createdAt: { gte: start, lte: end } },
          orderBy: { createdAt: 'desc' },
        });
        data = contacts.map((c) => [
          c.name,
          c.phoneE164,
          c.email || '',
          c.company || '',
          c.customerStatus || 'LEAD',
          c.createdAt.toISOString().split('T')[0],
        ]);
        break;

      case 'conversations':
        headers = ['Contato', 'Telefone', 'Status', 'Mensagens', 'Última Atividade'];
        const conversations = await this.prisma.conversation.findMany({
          where: { createdAt: { gte: start, lte: end } },
          include: {
            contact: true,
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: 'desc' },
        });
        data = conversations.map((c) => [
          c.contact.name,
          c.contact.phoneE164,
          c.status,
          c._count.messages,
          c.updatedAt.toISOString().split('T')[0],
        ]);
        break;

      case 'deals':
        headers = ['Contato', 'Título', 'Valor', 'Status', 'Etapa', 'Data'];
        const deals = await this.prisma.deal.findMany({
          where: {
            OR: [{ createdAt: { gte: start, lte: end } }, { wonAt: { gte: start, lte: end } }],
          },
          include: { contact: true },
          orderBy: { createdAt: 'desc' },
        });
        data = deals.map((d) => [
          d.contact?.name || 'N/A',
          d.title,
          d.amount || 0,
          d.wonAt ? 'Ganho' : d.lostAt ? 'Perdido' : 'Aberto',
          d.stageId,
          (d.wonAt || d.createdAt).toISOString().split('T')[0],
        ]);
        break;

      case 'metrics':
        headers = ['Métrica', 'Valor'];
        const metrics = await this.getReportMetrics(filters);
        data = [
          ['Total de Contatos', metrics.totalContacts],
          ['Contatos no Período', metrics.contactsInPeriod],
          ['Crescimento Contatos (%)', metrics.contactsGrowth],
          ['Total de Conversas', metrics.totalConversations],
          ['Conversas no Período', metrics.conversationsInPeriod],
          ['Crescimento Conversas (%)', metrics.conversationsGrowth],
          ['Receita Total', metrics.totalRevenue],
          ['Receita no Período', metrics.revenueInPeriod],
          ['Crescimento Receita (%)', metrics.revenueGrowth],
          ['Taxa de Conversão (%)', metrics.conversionRate],
        ];
        break;

      case 'all':
      default:
        headers = ['Tipo', 'Nome', 'Mensagens', 'Deals', 'Receita', 'Data'];
        const allContacts = await this.prisma.contact.findMany({
          where: { createdAt: { gte: start, lte: end } },
          include: {
            conversations: { include: { _count: { select: { messages: true } } } },
            deals: { where: { wonAt: { not: null } }, select: { amount: true } },
          },
        });
        data = allContacts.map((c) => {
          const msgCount = c.conversations.reduce((acc, conv) => acc + conv._count.messages, 0);
          const dealCount = c.deals.length;
          const revenue = c.deals.reduce((acc, d) => acc + (d.amount || 0), 0);
          return ['Contato', c.name, msgCount, dealCount, revenue, c.createdAt.toISOString().split('T')[0]];
        });
        break;
    }

    // Gerar CSV
    const csvLines = [headers.join(',')];
    data.forEach((row) => {
      csvLines.push(row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    });

    return {
      csv: csvLines.join('\n'),
      filename: `relatorio-crm-${new Date().toISOString().split('T')[0]}.csv`,
      rowCount: data.length,
    };
  }
}
