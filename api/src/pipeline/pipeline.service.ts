import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Pipeline Stages
  async createStage(data: { name: string; order: number }) {
    return this.prisma.pipelineStage.create({
      data,
    });
  }

  async getStages() {
    return this.prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async updateStage(id: string, data: { name?: string; order?: number }) {
    return this.prisma.pipelineStage.update({
      where: { id },
      data,
    });
  }

  async deleteStage(id: string) {
    return this.prisma.pipelineStage.delete({
      where: { id },
    });
  }

  // Deals
  async createDeal(data: {
    contactId: string;
    stageId: string;
    amount?: number;
    notes?: string;
    assignedToId?: string;
  }) {
    return this.prisma.deal.create({
      data,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
          },
        },
        stage: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getDeals(page = 1, limit = 50, stageId?: string, assignedToId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (stageId) {
      where.stageId = stageId;
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take: limit,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phoneE164: true,
              tags: true,
            },
          },
          stage: true,
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      deals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDeal(id: string) {
    return this.prisma.deal.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
          },
        },
        stage: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateDeal(id: string, data: {
    stageId?: string;
    amount?: number;
    notes?: string;
    assignedToId?: string;
  }) {
    return this.prisma.deal.update({
      where: { id },
      data,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
          },
        },
        stage: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async deleteDeal(id: string) {
    return this.prisma.deal.delete({
      where: { id },
    });
  }

  async moveDeal(id: string, stageId: string) {
    return this.prisma.deal.update({
      where: { id },
      data: { stageId },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
          },
        },
        stage: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getPipelineStats() {
    const stages = await this.prisma.pipelineStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });

    const totalDeals = await this.prisma.deal.count();
    const totalValue = await this.prisma.deal.aggregate({
      _sum: { amount: true },
    });

    return {
      stages: stages.map(stage => ({
        ...stage,
        dealCount: stage._count.deals,
      })),
      totalDeals,
      totalValue: totalValue._sum.amount || 0,
    };
  }
}

