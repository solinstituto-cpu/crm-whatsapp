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

  /**
   * Inscreve a Página desta conta social para o app receber webhooks dela
   * (POST /{page-id}/subscribed_apps na Graph API). Sem isso a Meta nunca
   * entrega eventos (DM nem comentário), mesmo com os campos ativados no
   * painel do Meta for Developers. Ver social-accounts.service.ts.
   */
  @Post(':id/subscribe-webhook')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async subscribeWebhook(@Param('id') id: string) {
    return this.socialAccountsService.subscribeWebhook(id);
  }

  /**
   * Mesma coisa, mas para todas as contas sociais ativas de uma vez.
   */
  @Post('subscribe-all-webhooks')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async subscribeAllWebhooks() {
    return this.socialAccountsService.subscribeAllWebhooks();
  }
}
