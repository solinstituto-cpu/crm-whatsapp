import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
} from '@nestjs/common';
import { KnowledgeService, CreateKnowledgeDto } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  private readonly logger = new Logger(KnowledgeController.name);

  constructor(private knowledgeService: KnowledgeService) {}

  @Get()
  async findAll() {
    this.logger.log('GET /api/knowledge');
    return this.knowledgeService.findAll();
  }

  @Get('categories')
  async getCategories() {
    this.logger.log('GET /api/knowledge/categories');
    return this.knowledgeService.getCategories();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`GET /api/knowledge/${id}`);
    return this.knowledgeService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateKnowledgeDto) {
    this.logger.log('POST /api/knowledge');
    return this.knowledgeService.create(dto);
  }

  @Post('import')
  async importBulk(@Body() items: CreateKnowledgeDto[]) {
    this.logger.log(`POST /api/knowledge/import - ${items.length} items`);
    return this.knowledgeService.importBulk(items);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateKnowledgeDto>) {
    this.logger.log(`PUT /api/knowledge/${id}`);
    return this.knowledgeService.update(id, dto);
  }

  @Put(':id/toggle')
  async toggle(@Param('id') id: string) {
    this.logger.log(`PUT /api/knowledge/${id}/toggle`);
    return this.knowledgeService.toggle(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    this.logger.log(`DELETE /api/knowledge/${id}`);
    return this.knowledgeService.delete(id);
  }
}
