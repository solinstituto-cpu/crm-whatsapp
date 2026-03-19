import { Controller, Get, Query, Res, Delete, Post, Body } from '@nestjs/common';
import { Response } from 'express';
import { EmailAuthService } from './email-auth.service';

@Controller('email-auth')
export class EmailAuthController {
  constructor(private readonly emailAuthService: EmailAuthService) {}

  @Get('status')
  async status() {
    return this.emailAuthService.getStatus();
  }

  @Get('google/url')
  async googleUrl() {
    const url = await this.emailAuthService.getGoogleAuthUrl();
    return { url };
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code?: string, @Res() res?: Response) {
    if (!code) {
      return res?.status(400).send('Missing code');
    }

    try {
      await this.emailAuthService.handleGoogleCallback(code);
    } catch (e: any) {
      const msg = encodeURIComponent(e?.message || 'Falha ao conectar Gmail');
      const webUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
      return res?.redirect(`${webUrl}/settings?gmail=error&msg=${msg}`);
    }

    const webUrl = process.env.WEBAPP_URL || 'http://localhost:3000';
    return res?.redirect(`${webUrl}/settings?gmail=connected`);
  }

  @Delete('google')
  async disconnectGoogle() {
    return this.emailAuthService.disconnectGoogle();
  }

  @Post('google/test-send')
  async testSend(
    @Body()
    body: {
      to: string;
      subject?: string;
      html?: string;
    },
  ) {
    if (!body?.to) {
      return { success: false, message: 'Informe o e-mail de destino (to).' };
    }

    const subject = body.subject || 'Teste de envio - CRM';
    const html =
      body.html ||
      `<div style="font-family:Arial,sans-serif;padding:16px"><h2 style="margin:0 0 8px">Teste de envio</h2><p style="margin:0">Se você recebeu este e-mail, a conexão com o Gmail está OK.</p></div>`;

    return this.emailAuthService.sendTestEmail({
      to: body.to,
      subject,
      html,
    });
  }
}

