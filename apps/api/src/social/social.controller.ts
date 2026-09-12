import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { MetaGraphService } from './meta-graph.service';

interface SendSocialMessageBody {
  conversationId: string;
  text: string;
  userId?: string;
}

/**
 * Endpoints para o inbox responder manualmente conversas de
 * Facebook Messenger / Instagram Direct.
 *
 * Não existe "template" nem automação aqui (ao contrário do WhatsApp) -
 * Messenger/Instagram não têm o conceito de mensagem de template aprovada
 * pela Meta da mesma forma que o WhatsApp Cloud API.
 */
@Controller('social')
@UseGuards(ThrottlerGuard)
export class SocialController {
  constructor(
    private prisma: PrismaService,
    private metaGraphService: MetaGraphService,
  ) {}

  @Post('send')
  async sendMessage(@Body() body: SendSocialMessageBody, @Res({ passthrough: true }) res: Response) {
    const { conversationId, text } = body;

    if (!conversationId || !text?.trim()) {
      res.status(400);
      return { message: 'conversationId e text são obrigatórios' };
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true, socialAccount: true },
    });

    if (!conversation) {
      res.status(404);
      return { message: 'Conversa não encontrada' };
    }

    if (conversation.channel === 'WHATSAPP') {
      res.status(400);
      return { message: 'Esta conversa é do WhatsApp - use /api/wa/send-public' };
    }

    if (!conversation.contact?.externalId || !conversation.socialAccount) {
      res.status(400);
      return { message: 'Conversa sem conta social ou contato associado' };
    }

    try {
      const result = await this.metaGraphService.sendText(
        conversation.socialAccount.pageId,
        conversation.socialAccount.accessToken,
        conversation.contact.externalId,
        text,
      );

      const message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUT',
          type: 'text',
          body: text,
          waMessageId: result?.message_id,
          status: 'SENT',
          channel: conversation.channel,
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      return { ok: true, message };
    } catch (error: any) {
      const metaError = error?.metaError;
      let errorMessage = error.message || 'Erro ao enviar mensagem';

      if (metaError?.code === 190) {
        errorMessage = 'Token de acesso da Página expirado ou inválido. Gere um novo token em Configurações.';
      } else if (metaError?.code === 10 || metaError?.error_subcode === 2018278) {
        errorMessage =
          'Fora da janela de 24h para responder livremente (regra da Meta para Messenger/Instagram). É necessário que o contato envie uma nova mensagem primeiro.';
      }

      res.status(error.statusCode && error.statusCode >= 400 ? error.statusCode : 500);
      return { message: errorMessage, error: 'Falha no envio da mensagem' };
    }
  }
}
