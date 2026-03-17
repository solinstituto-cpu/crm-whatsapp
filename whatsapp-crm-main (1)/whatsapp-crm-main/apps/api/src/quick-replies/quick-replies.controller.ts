import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { QuickRepliesService } from './quick-replies.service';

@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private readonly quickRepliesService: QuickRepliesService) {}

  // ==========================================
  // CATEGORIAS
  // ==========================================

  /**
   * Lista todas as categorias com suas respostas rápidas
   * GET /api/quick-replies/categories
   */
  @Get('categories')
  async getAllCategories() {
    return this.quickRepliesService.getAllCategories();
  }

  /**
   * Criar nova categoria
   * POST /api/quick-replies/categories
   */
  @Post('categories')
  async createCategory(
    @Body() body: { name: string; description?: string; color?: string }
  ) {
    return this.quickRepliesService.createCategory(body);
  }

  /**
   * Atualizar categoria
   * PUT /api/quick-replies/categories/:id
   */
  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; color?: string; order?: number; active?: boolean }
  ) {
    return this.quickRepliesService.updateCategory(id, body);
  }

  /**
   * Deletar categoria (soft delete)
   * DELETE /api/quick-replies/categories/:id
   */
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.quickRepliesService.deleteCategory(id);
  }

  // ==========================================
  // RESPOSTAS RÁPIDAS
  // ==========================================

  /**
   * Lista todas as respostas rápidas
   * GET /api/quick-replies?categoryId=xxx
   */
  @Get()
  async getAllQuickReplies(@Query('categoryId') categoryId?: string) {
    return this.quickRepliesService.getAllQuickReplies(categoryId);
  }

  /**
   * Buscar respostas rápidas por texto
   * GET /api/quick-replies/search?q=xxx
   */
  @Get('search')
  async search(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return [];
    }
    return this.quickRepliesService.search(query);
  }

  /**
   * Buscar por atalho
   * GET /api/quick-replies/shortcut/:shortcut
   */
  @Get('shortcut/:shortcut')
  async findByShortcut(@Param('shortcut') shortcut: string) {
    return this.quickRepliesService.findByShortcut(shortcut);
  }

  /**
   * Buscar resposta rápida por ID
   * GET /api/quick-replies/:id
   */
  @Get(':id')
  async getQuickReply(@Param('id') id: string) {
    return this.quickRepliesService.getQuickReplyById(id);
  }

  /**
   * Criar nova resposta rápida
   * POST /api/quick-replies
   */
  @Post()
  async createQuickReply(
    @Body() body: {
      name: string;
      content: string;
      shortcut?: string;
      categoryId?: string;
      variables?: string[];
    }
  ) {
    return this.quickRepliesService.createQuickReply(body);
  }

  /**
   * Atualizar resposta rápida
   * PUT /api/quick-replies/:id
   */
  @Put(':id')
  async updateQuickReply(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      content?: string;
      shortcut?: string;
      categoryId?: string;
      variables?: string[];
      order?: number;
      active?: boolean;
    }
  ) {
    return this.quickRepliesService.updateQuickReply(id, body);
  }

  /**
   * Deletar resposta rápida (soft delete)
   * DELETE /api/quick-replies/:id
   */
  @Delete(':id')
  async deleteQuickReply(@Param('id') id: string) {
    return this.quickRepliesService.deleteQuickReply(id);
  }

  /**
   * Aplicar variáveis ao conteúdo
   * POST /api/quick-replies/:id/apply
   */
  @Post(':id/apply')
  async applyVariables(
    @Param('id') id: string,
    @Body() body: { variables: Record<string, string> }
  ) {
    const quickReply = await this.quickRepliesService.getQuickReplyById(id);
    if (!quickReply) {
      return { error: 'Resposta rápida não encontrada' };
    }

    const content = this.quickRepliesService.applyVariables(
      quickReply.content,
      body.variables
    );

    return { content };
  }
}
