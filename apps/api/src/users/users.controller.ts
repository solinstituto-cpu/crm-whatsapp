import { Controller, Get, Post, Put, Delete, Body, Param, Headers, HttpCode, BadRequestException, ForbiddenException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Helper para validar admin pelo email (fallback quando JWT não disponível)
   */
  private async validateAdmin(adminEmail: string) {
    if (!adminEmail) {
      throw new ForbiddenException('Email do administrador é obrigatório');
    }
    const users = await this.usersService.getAllUsers();
    const admin = users.find(u => u.email === adminEmail && (u.role === 'ADMIN' || u.role === 'SUPERVISOR'));
    if (!admin) {
      throw new ForbiddenException('Apenas administradores podem realizar esta ação');
    }
    return admin;
  }

  /**
   * Criar novo usuário (apenas ADMIN ou SUPERVISOR)
   * POST /api/users
   * IMPORTANTE: Esta rota deve vir ANTES das rotas com parâmetros
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  async createUser(
    @Body() body: { name: string; email: string; password: string; role?: string },
    @Headers('x-admin-email') adminEmail: string
  ) {
    await this.validateAdmin(adminEmail);

    if (!body.name || !body.email || !body.password) {
      throw new BadRequestException('Nome, email e senha são obrigatórios');
    }

    // Validar role
    const validRoles = ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'];
    if (body.role && !validRoles.includes(body.role)) {
      throw new BadRequestException('Função inválida');
    }

    try {
      const user = await this.usersService.createUser(body);
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Email já está em uso');
      }
      throw error;
    }
  }

  /**
   * Endpoint para enviar heartbeat (indica que usuário está ativo)
   * POST /api/users/heartbeat
   */
  @Post('heartbeat')
  @HttpCode(200)
  async heartbeat(
    @Body('userId') userId: string,
    @Headers('x-user-agent') userAgent: string
  ) {
    if (!userId) {
      return { success: false, message: 'userId é obrigatório' };
    }
    await this.usersService.updateActivity(userId, null, userAgent);
    return { success: true };
  }

  /**
   * Logout (remove sessão)
   * POST /api/users/logout
   */
  @Post('logout')
  @HttpCode(200)
  async logout(@Body('userId') userId: string) {
    if (!userId) {
      return { success: false };
    }
    await this.usersService.logout(userId);
    return { success: true };
  }

  /**
   * Lista usuários online 
   * GET /api/users/online
   */
  @Get('online')
  async getOnlineUsers() {
    const onlineUsers = await this.usersService.getOnlineUsers();
    return onlineUsers;
  }

  /**
   * Lista funções disponíveis
   * GET /api/users/roles
   */
  @Get('roles')
  async getRoles() {
    return [
      { value: 'ADMIN', label: 'Administrador', description: 'Acesso total ao sistema' },
      { value: 'SUPERVISOR', label: 'Supervisor', description: 'Gerencia atendentes e visualiza relatórios' },
      { value: 'AGENT', label: 'Atendente', description: 'Realiza atendimentos aos clientes' },
      { value: 'VIEWER', label: 'Visualizador', description: 'Apenas visualiza informações' },
    ];
  }

  /**
   * Lista todos os usuários
   * GET /api/users
   */
  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  /**
   * Atualizar cor do usuário (qualquer usuário pode atualizar a própria cor)
   * PUT /api/users/:id/color
   */
  @Put(':id/color')
  async updateUserColor(
    @Param('id') id: string,
    @Body() body: { color: string }
  ) {
    if (!body.color || !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      throw new BadRequestException('Cor inválida. Use formato hexadecimal (#RRGGBB)');
    }
    
    try {
      const user = await this.usersService.updateUser(id, { color: body.color });
      return { success: true, color: user.color };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Usuário não encontrado');
      }
      throw error;
    }
  }

  /**
   * Buscar usuário por ID
   * GET /api/users/:id
   */
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }
    return user;
  }

  /**
   * Atualizar usuário (apenas ADMIN ou SUPERVISOR)
   * PUT /api/users/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; password?: string; role?: string },
    @Headers('x-admin-email') adminEmail: string
  ) {
    await this.validateAdmin(adminEmail);

    // Validar role
    const validRoles = ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'];
    if (body.role && !validRoles.includes(body.role)) {
      throw new BadRequestException('Função inválida');
    }

    try {
      const user = await this.usersService.updateUser(id, body);
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Email já está em uso');
      }
      if (error.code === 'P2025') {
        throw new BadRequestException('Usuário não encontrado');
      }
      throw error;
    }
  }

  /**
   * Deletar usuário (apenas ADMIN)
   * DELETE /api/users/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteUser(
    @Param('id') id: string,
    @Headers('x-admin-email') adminEmail: string
  ) {
    const admin = await this.validateAdmin(adminEmail);

    // Não permitir excluir a si mesmo
    if (id === admin.id) {
      throw new BadRequestException('Você não pode excluir sua própria conta');
    }

    try {
      await this.usersService.deleteUser(id);
      return { success: true, message: 'Usuário excluído com sucesso' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Usuário não encontrado');
      }
      throw error;
    }
  }
}
