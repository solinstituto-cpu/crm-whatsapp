import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Atualiza a última atividade do usuário (heartbeat)
   */
  async updateActivity(userId: string, ipAddress?: string, userAgent?: string) {
    const session = await this.prisma.userSession.upsert({
      where: { userId },
      update: {
        lastActivity: new Date(),
        ipAddress,
        userAgent,
      },
      create: {
        userId,
        lastActivity: new Date(),
        ipAddress,
        userAgent,
      },
    });

    return session;
  }

  /**
   * Lista usuários online (ativos nos últimos 5 minutos)
   */
  async getOnlineUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineSessions = await this.prisma.userSession.findMany({
      where: {
        lastActivity: {
          gte: fiveMinutesAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    return onlineSessions.map(session => ({
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      lastActivity: session.lastActivity,
      isOnline: true,
    }));
  }

  /**
   * Lista todos os usuários do sistema
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        color: true,
        createdAt: true,
        session: {
          select: {
            lastActivity: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      color: user.color,
      createdAt: user.createdAt,
      isOnline: user.session 
        ? user.session.lastActivity >= fiveMinutesAgo 
        : false,
      lastActivity: user.session?.lastActivity || null,
    }));
  }

  /**
   * Registra logout do usuário
   */
  async logout(userId: string) {
    await this.prisma.userSession.deleteMany({
      where: { userId },
    });

    return { success: true };
  }

  /**
   * Buscar usuário por ID
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        color: true,
        createdAt: true,
      },
    });
  }

  /**
   * Criar novo usuário
   */
  async createUser(data: { name: string; email: string; password: string; role?: string }) {
    // Importar bcrypt para hash da senha
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'AGENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Atualizar usuário
   */
  async updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string; color?: string }) {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.color) updateData.color = data.color;
    
    if (data.password) {
      const bcrypt = await import('bcrypt');
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        color: true,
        createdAt: true,
      },
    });
  }

  /**
   * Deletar usuário
   */
  async deleteUser(id: string) {
    // Primeiro remover sessão se existir
    await this.prisma.userSession.deleteMany({
      where: { userId: id },
    });

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
