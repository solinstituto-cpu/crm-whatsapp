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
import { WhatsAppAccountsService, CreateWhatsAppAccountDto, UpdateWhatsAppAccountDto } from './whatsapp-accounts.service';

@Controller('whatsapp-accounts')
@UseGuards(JwtAuthGuard)
export class WhatsAppAccountsController {
  constructor(private readonly whatsAppAccountsService: WhatsAppAccountsService) {}

  /**
   * GET /api/whatsapp-accounts
   * Lista todas as contas WhatsApp
   * Se userId for passado, retorna apenas as contas que o usuário pode acessar
   */
  @Get()
  async findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.whatsAppAccountsService.findAllForUser(userId);
    }
    return this.whatsAppAccountsService.findAll();
  }

  /**
   * GET /api/whatsapp-accounts/default
   * Retorna a conta padrão
   */
  @Get('default')
  async findDefault() {
    return this.whatsAppAccountsService.findDefault();
  }

  /**
   * GET /api/whatsapp-accounts/:id
   * Retorna uma conta específica (com usuários que têm acesso)
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.whatsAppAccountsService.findOneWithUsers(id);
  }

  /**
   * POST /api/whatsapp-accounts
   * Cria uma nova conta WhatsApp (apenas ADMIN)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() data: CreateWhatsAppAccountDto) {
    return this.whatsAppAccountsService.create(data);
  }

  /**
   * PUT /api/whatsapp-accounts/:id
   * Atualiza uma conta WhatsApp (apenas ADMIN)
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() data: UpdateWhatsAppAccountDto) {
    return this.whatsAppAccountsService.update(id, data);
  }

  /**
   * DELETE /api/whatsapp-accounts/:id
   * Remove uma conta WhatsApp (apenas ADMIN)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.whatsAppAccountsService.remove(id);
  }

  /**
   * POST /api/whatsapp-accounts/:id/set-default
   * Define uma conta como padrão (apenas ADMIN)
   */
  @Post(':id/set-default')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async setDefault(@Param('id') id: string) {
    return this.whatsAppAccountsService.setDefault(id);
  }

  /**
   * POST /api/whatsapp-accounts/:id/test
   * Testa a conexão com a API do WhatsApp (apenas ADMIN)
   */
  @Post(':id/test')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async testConnection(@Param('id') id: string) {
    return this.whatsAppAccountsService.testConnection(id);
  }

  /**
   * POST /api/whatsapp-accounts/:id/users
   * Define quais usuários podem acessar esta conta (apenas ADMIN)
   * Body: { userIds: string[] }
   */
  @Post(':id/users')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async setAccountUsers(@Param('id') id: string, @Body() body: { userIds: string[] }) {
    return this.whatsAppAccountsService.setAccountUsers(id, body.userIds || []);
  }
}