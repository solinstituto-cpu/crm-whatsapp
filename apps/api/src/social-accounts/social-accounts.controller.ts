import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  SocialAccountsService,
  CreateSocialAccountDto,
  UpdateSocialAccountDto,
} from './social-accounts.service';

@Controller('social-accounts')
@UseGuards(JwtAuthGuard)
export class SocialAccountsController {
  constructor(private readonly socialAccountsService: SocialAccountsService) {}

  /**
   * GET /api/social-accounts?channel=INSTAGRAM
   */
  @Get()
  async findAll(@Query('channel') channel?: 'FACEBOOK' | 'INSTAGRAM') {
    return this.socialAccountsService.findAll(channel);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.socialAccountsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() data: CreateSocialAccountDto) {
    return this.socialAccountsService.create(data);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() data: UpdateSocialAccountDto) {
    return this.socialAccountsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.socialAccountsService.remove(id);
  }

  @Post(':id/set-default')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async setDefault(@Param('id') id: string) {
    return this.socialAccountsService.setDefault(id);
  }

  @Post(':id/test')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async testConnection(@Param('id') id: string) {
    return this.socialAccountsService.testConnection(id);
  }
}
