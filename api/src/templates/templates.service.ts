import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    category: string;
    language: string;
    components: any;
    waTemplateName?: string;
  }) {
    return this.prisma.template.create({
      data,
    });
  }

  async findAll(page = 1, limit = 50, category?: string, enabled?: boolean) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.template.count({ where }),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.template.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.prisma.template.findFirst({
      where: { name },
    });
  }

  async update(id: string, data: {
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

  async delete(id: string) {
    return this.prisma.template.delete({
      where: { id },
    });
  }

  async getCategories() {
    const categories = await this.prisma.template.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map(c => c.category);
  }

  async getEnabledTemplates() {
    return this.prisma.template.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
  }

  async getTemplatesByCategory(category: string) {
    return this.prisma.template.findMany({
      where: { category },
      orderBy: { name: 'asc' },
    });
  }

  async testTemplate(id: string, testData: any) {
    const template = await this.findById(id);
    
    if (!template) {
      throw new Error('Template not found');
    }

    // This would integrate with WhatsApp API to test the template
    // For now, just return the template with test data
    return {
      template,
      testData,
      preview: this.generatePreview(template.components, testData),
    };
  }

  private generatePreview(components: any, testData: any): string {
    // Simple preview generation
    let preview = '';
    
    for (const component of components) {
      if (component.type === 'header') {
        if (component.format === 'TEXT') {
          preview += `Header: ${component.text}\n`;
        }
      } else if (component.type === 'body') {
        preview += `Body: ${component.text}\n`;
      } else if (component.type === 'footer') {
        preview += `Footer: ${component.text}\n`;
      }
    }
    
    return preview;
  }
}

