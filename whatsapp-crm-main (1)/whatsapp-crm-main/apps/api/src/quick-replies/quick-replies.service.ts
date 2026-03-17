import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuickRepliesService {
  private readonly logger = new Logger(QuickRepliesService.name);

  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CATEGORIAS
  // ==========================================

  async getAllCategories() {
    try {
      // @ts-ignore - novos campos adicionados na migration
      const categories = await this.prisma.quickReplyCategory.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }, // Ordenar categorias alfabeticamente
        include: {
          quickReplies: {
            where: { active: true },
            orderBy: { name: 'asc' }, // Ordenar respostas alfabeticamente
          },
        },
      });
      return categories;
    } catch (error) {
      this.logger.warn('Tabela quickReplyCategory não existe ainda, retornando vazio');
      return [];
    }
  }

  async createCategory(data: { name: string; description?: string; color?: string }) {
    try {
      // @ts-ignore
      const maxOrder = await this.prisma.quickReplyCategory.aggregate({
        _max: { order: true },
      });
      
      // @ts-ignore
      return this.prisma.quickReplyCategory.create({
        data: {
          ...data,
          order: (maxOrder._max?.order || 0) + 1,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  async updateCategory(id: string, data: { name?: string; description?: string; color?: string; order?: number; active?: boolean }) {
    // @ts-ignore
    return this.prisma.quickReplyCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    // Soft delete - apenas desativa
    // @ts-ignore
    return this.prisma.quickReplyCategory.update({
      where: { id },
      data: { active: false },
    });
  }

  // ==========================================
  // RESPOSTAS RÁPIDAS
  // ==========================================

  async getAllQuickReplies(categoryId?: string) {
    try {
      const where: any = { active: true };
      if (categoryId) {
        where.categoryId = categoryId;
      }

      return await this.prisma.quickReply.findMany({
        where,
        orderBy: { name: 'asc' },
        // @ts-ignore
        include: {
          category: true,
        },
      });
    } catch (error) {
      // Fallback para versão antiga sem os novos campos
      return this.prisma.quickReply.findMany({
        orderBy: { name: 'asc' },
      });
    }
  }

  async getQuickReplyById(id: string) {
    try {
      return await this.prisma.quickReply.findUnique({
        where: { id },
        // @ts-ignore
        include: { category: true },
      });
    } catch {
      return this.prisma.quickReply.findUnique({
        where: { id },
      });
    }
  }

  async createQuickReply(data: {
    name: string;
    content: string;
    shortcut?: string;
    categoryId?: string;
    variables?: string[];
  }) {
    try {
      return await this.prisma.quickReply.create({
        // @ts-ignore
        data: {
          name: data.name,
          content: data.content,
          shortcut: data.shortcut,
          categoryId: data.categoryId || null,
          variables: JSON.stringify(data.variables || []),
          order: 0,
          active: true,
        },
        include: { category: true },
      });
    } catch {
      // Fallback sem novos campos
      return this.prisma.quickReply.create({
        data: {
          name: data.name,
          content: data.content,
          variables: JSON.stringify(data.variables || []),
        },
      });
    }
  }

  async updateQuickReply(id: string, data: {
    name?: string;
    content?: string;
    shortcut?: string;
    categoryId?: string;
    variables?: string[];
    order?: number;
    active?: boolean;
  }) {
    const updateData: any = { ...data };
    if (data.variables) {
      updateData.variables = JSON.stringify(data.variables);
    }

    try {
      return await this.prisma.quickReply.update({
        where: { id },
        data: updateData,
        // @ts-ignore
        include: { category: true },
      });
    } catch {
      return this.prisma.quickReply.update({
        where: { id },
        data: {
          name: data.name,
          content: data.content,
          variables: data.variables ? JSON.stringify(data.variables) : undefined,
        },
      });
    }
  }

  async deleteQuickReply(id: string) {
    try {
      // Soft delete
      return await this.prisma.quickReply.update({
        where: { id },
        // @ts-ignore
        data: { active: false },
      });
    } catch {
      // Hard delete se active não existir
      return this.prisma.quickReply.delete({
        where: { id },
      });
    }
  }

  // Buscar por atalho
  async findByShortcut(shortcut: string) {
    try {
      return await this.prisma.quickReply.findFirst({
        // @ts-ignore
        where: {
          shortcut: shortcut.toLowerCase(),
          active: true,
        },
        include: { category: true },
      });
    } catch {
      return null;
    }
  }

  // Buscar por texto (para autocomplete)
  async search(query: string) {
    try {
      return await this.prisma.quickReply.findMany({
        where: {
          // @ts-ignore
          active: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
        // @ts-ignore
        include: { category: true },
        take: 10,
      });
    } catch {
      return this.prisma.quickReply.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { content: { contains: query } },
          ],
        },
        take: 10,
      });
    }
  }

  // Aplicar variáveis ao conteúdo
  applyVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }
}
