import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 50, status?: string, assignedToId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
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
              optOut: true,
            },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
            optOut: true,
            lastMessageAt: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          include: {
            sentBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findByContactId(contactId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        contactId,
        status: { in: ['OPEN', 'PENDING'] },
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
            optOut: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          include: {
            sentBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async create(contactId: string, assignedToId?: string) {
    return this.prisma.conversation.create({
      data: {
        contactId,
        assignedToId,
        status: 'OPEN',
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
            optOut: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async update(id: string, data: {
    status?: 'OPEN' | 'PENDING' | 'CLOSED';
    assignedToId?: string;
  }) {
    return this.prisma.conversation.update({
      where: { id },
      data,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
            optOut: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async assign(id: string, assignedToId: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { assignedToId },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
            optOut: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async close(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { status: 'CLOSED' },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            tags: true,
            optOut: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getStats(assignedToId?: string) {
    const where = assignedToId ? { assignedToId } : {};

    const [total, open, pending, closed] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.conversation.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.conversation.count({ where: { ...where, status: 'CLOSED' } }),
    ]);

    return {
      total,
      open,
      pending,
      closed,
    };
  }
}

