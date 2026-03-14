import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTemplate(data: {
    name: string;
    category: string;
    language: string;
    components: any;
    waTemplateName?: string;
  }) {
    return this.prisma.template.create({
      data: {
        name: data.name,
        category: data.category,
        language: data.language,
        components: data.components,
        waTemplateName: data.waTemplateName,
      },
    });
  }

  async getTemplates(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.template.count(),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTemplate(id: string) {
    return this.prisma.template.findUnique({
      where: { id },
    });
  }

  async updateTemplate(id: string, data: {
    name?: string;
    category?: string;
    language?: string;
    components?: any;
    waTemplateName?: string;
    enabled?: boolean;
  }) {
    return this.prisma.template.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.template.delete({
      where: { id },
    });
  }

  async getTemplateByName(name: string) {
    return this.prisma.template.findFirst({
      where: { name },
    });
  }

  async getTemplatesByCategory(category: string) {
    return this.prisma.template.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  async getEnabledTemplates() {
    return this.prisma.template.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
  }
}

