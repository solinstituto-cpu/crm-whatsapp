import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('enabled') enabled?: string,
  ) {
    return this.templatesService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 50,
      category,
      enabled === 'true' ? true : enabled === 'false' ? false : undefined,
    );
  }

  @Get('categories')
  async getCategories() {
    return this.templatesService.getCategories();
  }

  @Get('enabled')
  async getEnabledTemplates() {
    return this.templatesService.getEnabledTemplates();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @Post()
  async create(@Body() body: {
    name: string;
    category: string;
    language: string;
    components: any;
    waTemplateName?: string;
  }) {
    return this.templatesService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      category?: string;
      language?: string;
      components?: any;
      waTemplateName?: string;
      enabled?: boolean;
    },
  ) {
    return this.templatesService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }

  @Post(':id/test')
  async testTemplate(
    @Param('id') id: string,
    @Body() body: { testData: any },
  ) {
    return this.templatesService.testTemplate(id, body.testData);
  }
}

