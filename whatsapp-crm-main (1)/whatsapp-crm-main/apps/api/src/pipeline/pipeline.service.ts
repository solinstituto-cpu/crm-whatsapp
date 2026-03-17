import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== STAGES ====================

  async findAllStages() {
    const stages = await this.prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        deals: {
          include: {
            contact: {
              select: { id: true, name: true, phoneE164: true, email: true }
            },
            owner: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Calculate totals per stage
    return stages.map(stage => ({
      ...stage,
      totalValue: stage.deals.reduce((sum, deal) => sum + deal.amount, 0),
      dealCount: stage.deals.length
    }));
  }

  async createStage(data: { name: string; color?: string }) {
    // Get max order
    const maxOrder = await this.prisma.pipelineStage.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const newOrder = (maxOrder?.order || 0) + 1;

    return this.prisma.pipelineStage.create({
      data: {
        name: data.name,
        color: data.color || '#6B7280',
        order: newOrder
      }
    });
  }

  async updateStage(id: string, data: { name?: string; color?: string; order?: number }) {
    const stage = await this.prisma.pipelineStage.findUnique({ where: { id } });
    if (!stage) {
      throw new NotFoundException('Estágio não encontrado');
    }

    // If order is changing, need to reorder other stages
    if (data.order !== undefined && data.order !== stage.order) {
      await this.reorderStages(stage.order, data.order);
    }

    return this.prisma.pipelineStage.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        order: data.order
      }
    });
  }

  async deleteStage(id: string) {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id },
      include: { deals: true }
    });

    if (!stage) {
      throw new NotFoundException('Estágio não encontrado');
    }

    if (stage.deals.length > 0) {
      throw new BadRequestException('Não é possível excluir estágio com deals. Mova os deals primeiro.');
    }

    return this.prisma.pipelineStage.delete({ where: { id } });
  }

  private async reorderStages(fromOrder: number, toOrder: number) {
    if (fromOrder < toOrder) {
      // Moving down - decrease order of stages between
      await this.prisma.pipelineStage.updateMany({
        where: {
          order: { gt: fromOrder, lte: toOrder }
        },
        data: { order: { decrement: 1 } }
      });
    } else {
      // Moving up - increase order of stages between
      await this.prisma.pipelineStage.updateMany({
        where: {
          order: { gte: toOrder, lt: fromOrder }
        },
        data: { order: { increment: 1 } }
      });
    }
  }

  // ==================== DEALS ====================

  async findAllDeals(filters?: {
    stageId?: string;
    contactId?: string;
    ownerId?: string;
    minAmount?: number;
    maxAmount?: number;
  }) {
    const where: any = {};

    if (filters?.stageId) where.stageId = filters.stageId;
    if (filters?.contactId) where.contactId = filters.contactId;
    if (filters?.ownerId) where.ownerId = filters.ownerId;
    if (filters?.minAmount) where.amount = { gte: filters.minAmount };
    if (filters?.maxAmount) where.amount = { ...where.amount, lte: filters.maxAmount };

    return this.prisma.deal.findMany({
      where,
      include: {
        contact: {
          select: { id: true, name: true, phoneE164: true, email: true }
        },
        stage: {
          select: { id: true, name: true, color: true, order: true }
        },
        owner: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findDealById(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        contact: true,
        stage: true,
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!deal) {
      throw new NotFoundException('Deal não encontrado');
    }

    return deal;
  }

  async createDeal(data: {
    title: string;
    contactId: string;
    stageId: string;
    amount?: number;
    description?: string;
    probability?: number;
    expectedCloseDate?: string;
    source?: string;
    ownerId?: string;
  }) {
    // Validate contact exists
    const contact = await this.prisma.contact.findUnique({ where: { id: data.contactId } });
    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    // Validate stage exists
    const stage = await this.prisma.pipelineStage.findUnique({ where: { id: data.stageId } });
    if (!stage) {
      throw new NotFoundException('Estágio não encontrado');
    }

    return this.prisma.deal.create({
      data: {
        title: data.title,
        contactId: data.contactId,
        stageId: data.stageId,
        amount: data.amount || 0,
        description: data.description,
        probability: data.probability || 50,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        source: data.source,
        ownerId: data.ownerId
      },
      include: {
        contact: { select: { id: true, name: true, phoneE164: true } },
        stage: { select: { id: true, name: true, color: true } },
        owner: { select: { id: true, name: true } }
      }
    });
  }

  async updateDeal(id: string, data: {
    title?: string;
    amount?: number;
    description?: string;
    probability?: number;
    expectedCloseDate?: string | null;
    source?: string;
    lostReason?: string;
    ownerId?: string | null;
    stageId?: string;
  }) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      throw new NotFoundException('Deal não encontrado');
    }

    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.probability !== undefined) updateData.probability = data.probability;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.lostReason !== undefined) updateData.lostReason = data.lostReason;
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId || null;
    if (data.stageId !== undefined) updateData.stageId = data.stageId;
    
    if (data.expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = data.expectedCloseDate ? new Date(data.expectedCloseDate) : null;
    }

    return this.prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        contact: { select: { id: true, name: true, phoneE164: true } },
        stage: { select: { id: true, name: true, color: true } },
        owner: { select: { id: true, name: true } }
      }
    });
  }

  async moveDeal(id: string, stageId: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      throw new NotFoundException('Deal não encontrado');
    }

    const stage = await this.prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (!stage) {
      throw new NotFoundException('Estágio não encontrado');
    }

    // Check if it's a "won" or "lost" stage by name
    const updateData: any = { stageId };
    
    const stageName = stage.name.toLowerCase();
    if (stageName.includes('ganho') || stageName.includes('fechad') || stageName.includes('matrícula')) {
      updateData.wonAt = new Date();
      updateData.lostAt = null;
    } else if (stageName.includes('perdido') || stageName.includes('cancelado')) {
      updateData.lostAt = new Date();
      updateData.wonAt = null;
    } else {
      // Reset if moving back to active stage
      updateData.wonAt = null;
      updateData.lostAt = null;
    }

    return this.prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        contact: { select: { id: true, name: true, phoneE164: true } },
        stage: { select: { id: true, name: true, color: true } },
        owner: { select: { id: true, name: true } }
      }
    });
  }

  async deleteDeal(id: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      throw new NotFoundException('Deal não encontrado');
    }

    return this.prisma.deal.delete({ where: { id } });
  }

  // ==================== STATS ====================

  async getStats() {
    const deals = await this.prisma.deal.findMany({
      include: { stage: true }
    });

    const stages = await this.prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' }
    });

    const totalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);
    const totalDeals = deals.length;
    
    const wonDeals = deals.filter(d => d.wonAt !== null);
    const lostDeals = deals.filter(d => d.lostAt !== null);
    
    const wonValue = wonDeals.reduce((sum, deal) => sum + deal.amount, 0);
    const conversionRate = totalDeals > 0 
      ? Math.round((wonDeals.length / totalDeals) * 100) 
      : 0;

    // Value by stage
    const valueByStage = stages.map(stage => ({
      stageId: stage.id,
      stageName: stage.name,
      value: deals.filter(d => d.stageId === stage.id).reduce((sum, d) => sum + d.amount, 0),
      count: deals.filter(d => d.stageId === stage.id).length
    }));

    // Deals pendentes (não ganhos e não perdidos)
    const pendingDeals = deals.filter(d => d.wonAt === null && d.lostAt === null);
    const pendingValue = pendingDeals.reduce((sum, deal) => sum + deal.amount, 0);
    
    // Valor esperado (ponderado pela probabilidade)
    const expectedValue = pendingDeals.reduce((sum, deal) => {
      const prob = deal.probability || 50;
      return sum + (deal.amount * prob / 100);
    }, 0);

    // Valor perdido
    const lostValue = lostDeals.reduce((sum, deal) => sum + deal.amount, 0);

    return {
      totalValue,
      totalDeals,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      pendingDeals: pendingDeals.length,
      wonValue,
      lostValue,
      pendingValue,
      expectedValue: Math.round(expectedValue * 100) / 100,
      conversionRate,
      valueByStage
    };
  }

  // ==================== SEED DEFAULT STAGES ====================

  async seedDefaultStages() {
    const existingStages = await this.prisma.pipelineStage.count();
    
    if (existingStages > 0) {
      this.logger.log('Stages already exist, skipping seed');
      return;
    }

    const defaultStages = [
      { name: 'Novo Lead', order: 1, color: '#3B82F6' },           // blue
      { name: 'Contato Realizado', order: 2, color: '#06B6D4' },   // cyan
      { name: 'Visita Agendada', order: 3, color: '#F59E0B' },     // amber
      { name: 'Em Negociação', order: 4, color: '#F97316' },       // orange
      { name: 'Proposta Enviada', order: 5, color: '#8B5CF6' },    // violet
      { name: 'Matrícula Fechada', order: 6, color: '#22C55E' },   // green
      { name: 'Perdido', order: 7, color: '#EF4444' },             // red
    ];

    for (const stage of defaultStages) {
      await this.prisma.pipelineStage.create({ data: stage });
    }

    this.logger.log('✅ Default pipeline stages created');
  }

  async resetPipeline() {
    // Delete all deals first (foreign key constraint)
    await this.prisma.deal.deleteMany({});
    this.logger.log('✅ All deals deleted');

    // Delete all stages
    await this.prisma.pipelineStage.deleteMany({});
    this.logger.log('✅ All pipeline stages deleted');

    // Recreate default stages
    await this.seedDefaultStages();
    this.logger.log('✅ Pipeline reset complete');
  }
}
