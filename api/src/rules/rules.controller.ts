import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/rules')
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('enabled') enabled?: string,
  ) {
    return this.rulesService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 50,
      enabled === 'true' ? true : enabled === 'false' ? false : undefined,
    );
  }

  @Get('enabled')
  async getEnabledRules() {
    return this.rulesService.getEnabledRules();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rulesService.findById(id);
  }

  @Post()
  async create(@Body() body: {
    name: string;
    when: any;
    then: any;
    enabled?: boolean;
  }) {
    return this.rulesService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      when?: any;
      then?: any;
      enabled?: boolean;
    },
  ) {
    return this.rulesService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.rulesService.delete(id);
  }

  @Post(':id/run')
  async runRule(
    @Param('id') id: string,
    @Body() body: { context: any },
  ) {
    return this.rulesService.runRule(id, body.context);
  }

  @Post('run')
  async runAllRules(@Body() body: { context: any }) {
    return this.rulesService.runAllRules(body.context);
  }
}

