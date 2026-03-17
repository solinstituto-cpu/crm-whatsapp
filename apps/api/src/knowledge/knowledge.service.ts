import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateKnowledgeDto {
  title: string;
  content: string;
  keywords?: string;
  category?: string;
  priority?: number;
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateKnowledgeDto) {
    return this.prisma.knowledgeBase.create({
      data: {
        title: dto.title,
        content: dto.content,
        keywords: dto.keywords || '',
        category: dto.category || 'Geral',
        priority: dto.priority || 0,
      },
    });
  }

  async findAll() {
    return this.prisma.knowledgeBase.findMany({
      orderBy: [
        { category: 'asc' },
        { priority: 'desc' },
        { title: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    return this.prisma.knowledgeBase.findUnique({
      where: { id },
    });
  }

  async update(id: string, dto: Partial<CreateKnowledgeDto>) {
    return this.prisma.knowledgeBase.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        keywords: dto.keywords,
        category: dto.category,
        priority: dto.priority,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.knowledgeBase.delete({
      where: { id },
    });
  }

  async toggle(id: string) {
    const item = await this.prisma.knowledgeBase.findUnique({ where: { id } });
    return this.prisma.knowledgeBase.update({
      where: { id },
      data: { isActive: !item?.isActive },
    });
  }

  async getCategories() {
    const items = await this.prisma.knowledgeBase.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return items.map(i => i.category).filter(Boolean);
  }

  async importBulk(items: CreateKnowledgeDto[]) {
    const results = await Promise.all(
      items.map(item => this.create(item))
    );
    return { imported: results.length };
  }
}
