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
   * Cria uma nova conta WhatsApp
   */
  @Post()
  async create(@Body() data: CreateWhatsAppAccountDto) {
    return this.whatsAppAccountsService.create(data);
  }

  /**
   * PUT /api/whatsapp-accounts/:id
   * Atualiza uma conta WhatsApp
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateWhatsAppAccountDto) {
    return this.whatsAppAccountsService.update(id, data);
  }

  /**
   * DELETE /api/whatsapp-accounts/:id
   * Remove uma conta WhatsApp
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.whatsAppAccountsService.remove(id);
  }

  /**
   * POST /api/whatsapp-accounts/:id/set-default
   * Define uma conta como padrão
   */
  @Post(':id/set-default')
  async setDefault(@Param('id') id: string) {
    return this.whatsAppAccountsService.setDefault(id);
  }

  /**
   * POST /api/whatsapp-accounts/:id/test
   * Testa a conexão com a API do WhatsApp
   */
  @Post(':id/test')
  async testConnection(@Param('id') id: string) {
    return this.whatsAppAccountsService.testConnection(id);
  }

  /**
   * POST /api/whatsapp-accounts/:id/users
   * Define quais usuários podem acessar esta conta
   * Body: { userIds: string[] }
   * Se userIds for vazio [], todos terão acesso (sem restrição)
   */
  @Post(':id/users')
  async setAccountUsers(@Param('id') id: string, @Body() body: { userIds: string[] }) {
    return this.whatsAppAccountsService.setAccountUsers(id, body.userIds || []);
  }
}