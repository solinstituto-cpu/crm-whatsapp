import { Controller, Get, Post, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { TemplatesService, CreateTemplateDto } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * Lista todos os templates do WhatsApp Business
   * GET /api/templates
   * Query params: 
   *   - status (APPROVED, PENDING, REJECTED, etc.)
   *   - accountId (ID da conta WhatsApp para multi-números)
   */
  @Get()
  async getTemplates(@Query('status') status?: string, @Query('accountId') accountId?: string) {
    try {
      const templates = await this.templatesService.getTemplates(status, accountId);
      
      // Formatar para o frontend
      const formattedTemplates = templates.map(template => ({
        id: template.id,
        name: template.name,
        status: template.status,
        category: template.category,
        language: template.language,
        bodyText: this.templatesService.getTemplateBodyText(template),
        headerText: this.templatesService.getTemplateHeaderText(template),
        headerFormat: this.templatesService.getTemplateHeaderFormat(template),
        requiresMedia: this.templatesService.templateRequiresMedia(template),
        footerText: this.templatesService.getTemplateFooterText(template),
        components: template.components,
        qualityScore: template.quality_score?.score || null,
      }));

      return formattedTemplates;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch templates',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Busca um template específico
   * GET /api/templates/:id
   */
  @Get(':id')
  async getTemplate(@Param('id') id: string) {
    try {
      const template = await this.templatesService.getTemplateById(id);
      return {
        id: template.id,
        name: template.name,
        status: template.status,
        category: template.category,
        language: template.language,
        bodyText: this.templatesService.getTemplateBodyText(template),
        headerText: this.templatesService.getTemplateHeaderText(template),
        footerText: this.templatesService.getTemplateFooterText(template),
        components: template.components,
        qualityScore: template.quality_score?.score || null,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Template not found',
        HttpStatus.NOT_FOUND
      );
    }
  }

  /**
   * Cria um novo template (será enviado para aprovação do Meta)
   * POST /api/templates
   */
  @Post()
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    try {
      const result = await this.templatesService.createTemplate(createTemplateDto);
      return {
        success: true,
        message: 'Template created and submitted for approval',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create template',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Deleta um template pelo nome
   * DELETE /api/templates/:name
   */
  @Delete(':name')
  async deleteTemplate(@Param('name') name: string) {
    try {
      const result = await this.templatesService.deleteTemplate(name);
      return {
        success: true,
        message: `Template ${name} deleted successfully`,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete template',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Retorna estatísticas dos templates
   * GET /api/templates/stats/summary
   */
  @Get('stats/summary')
  async getTemplateStats() {
    try {
      const templates = await this.templatesService.getTemplates();
      
      const stats = {
        total: templates.length,
        approved: templates.filter(t => t.status === 'APPROVED').length,
        pending: templates.filter(t => t.status === 'PENDING').length,
        rejected: templates.filter(t => t.status === 'REJECTED').length,
        byCategory: {
          marketing: templates.filter(t => t.category === 'MARKETING').length,
          utility: templates.filter(t => t.category === 'UTILITY').length,
          authentication: templates.filter(t => t.category === 'AUTHENTICATION').length,
        },
      };

      return stats;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch stats',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
