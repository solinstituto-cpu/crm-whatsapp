import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  async create(@Body() body: {
    name: string;
    phoneE164: string;
    tags?: string[];
    assignedToId?: string;
  }) {
    return this.contactsService.create(body);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
  ) {
    const tagsArray = tags ? tags.split(',') : undefined;
    return this.contactsService.findAll(
      parseInt(page) || 1,
      parseInt(limit) || 50,
      search,
      tagsArray,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contactsService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      phoneE164?: string;
      tags?: string[];
      assignedToId?: string;
      optOut?: boolean;
    },
  ) {
    return this.contactsService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.contactsService.delete(id);
  }

  @Post(':id/tags')
  async addTags(
    @Param('id') id: string,
    @Body() body: { tags: string[] },
  ) {
    return this.contactsService.addTags(id, body.tags);
  }

  @Delete(':id/tags')
  async removeTags(
    @Param('id') id: string,
    @Body() body: { tags: string[] },
  ) {
    return this.contactsService.removeTags(id, body.tags);
  }

  @Post('import')
  async importFromCSV(@Body() body: {
    data: Array<{
      name: string;
      phoneE164: string;
      tags?: string;
    }>;
  }) {
    return this.contactsService.importFromCSV(body.data);
  }
}

