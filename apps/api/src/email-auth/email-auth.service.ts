import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { OAuth2Client } from 'google-auth-library';
import * as nodemailer from 'nodemailer';
import axios from 'axios';

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

@Injectable()
export class EmailAuthService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  private async getGoogleConfig(): Promise<GoogleOAuthConfig> {
    const clientId =
      process.env.GOOGLE_OAUTH_CLIENT_ID ||
      (await this.settingsService.getSetting('google_oauth_client_id')) ||
      '';

    const clientSecret =
      process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
      (await this.settingsService.getSetting('google_oauth_client_secret')) ||
      '';

    const redirectUri =
      process.env.GOOGLE_OAUTH_REDIRECT_URI ||
      (await this.settingsService.getSetting('google_oauth_redirect_uri')) ||
      '';

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Google OAuth não configurado. Defina GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET/GOOGLE_OAUTH_REDIRECT_URI (ou via integration_settings).',
      );
    }

    return { clientId, clientSecret, redirectUri };
  }

  private async getGoogleClient(): Promise<OAuth2Client> {
    const cfg = await this.getGoogleConfig();
    return new OAuth2Client(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
  }

  async getGoogleAuthUrl(): Promise<string> {
    const client = await this.getGoogleClient();
    const scopes = [
      // Envio via SMTP OAuth2 / Gmail
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
    ];

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      include_granted_scopes: true,
    });
  }

  async handleGoogleCallback(code: string) {
    const client = await this.getGoogleClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      // Se o usuário já autorizou antes, Google pode não devolver refresh_token sem prompt=consent
      // Mas como usamos prompt=consent, isso normalmente vem.
      throw new Error('Google não retornou refresh_token. Tente conectar novamente.');
    }

    // Buscar e-mail do usuário
    client.setCredentials(tokens);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token as string,
      audience: (await this.getGoogleConfig()).clientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email || null;

    await this.prisma.oAuthToken.upsert({
      where: { provider: 'google' },
      update: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || null,
        email,
        updatedAt: new Date(),
      } as any,
      create: {
        provider: 'google',
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || null,
        email,
      },
    });

    return { connected: true, provider: 'google', email };
  }

  async getStatus() {
    const token = await this.prisma.oAuthToken.findUnique({
      where: { provider: 'google' },
      select: { provider: true, email: true, expiresAt: true, scope: true },
    });

    return {
      google: token
        ? {
            connected: true,
            email: token.email,
            expiresAt: token.expiresAt,
            scope: token.scope,
          }
        : { connected: false },
    };
  }

  async disconnectGoogle() {
    await this.prisma.oAuthToken.deleteMany({ where: { provider: 'google' } });
    return { success: true };
  }

  async getGoogleClientSecrets(): Promise<{ clientId: string; clientSecret: string }> {
    const clientId =
      process.env.GOOGLE_OAUTH_CLIENT_ID ||
      (await this.settingsService.getSetting('google_oauth_client_id')) ||
      '';

    const clientSecret =
      process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
      (await this.settingsService.getSetting('google_oauth_client_secret')) ||
      '';

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth não configurado (clientId/clientSecret).');
    }

    return { clientId, clientSecret };
  }

  async getGoogleAccessToken(): Promise<{ accessToken: string; email: string | null }> {
    const stored = await this.prisma.oAuthToken.findUnique({ where: { provider: 'google' } });
    if (!stored?.refreshToken) {
      throw new Error('Gmail não conectado.');
    }

    const client = await this.getGoogleClient();
    client.setCredentials({ refresh_token: stored.refreshToken });
    const res = await client.getAccessToken();
    const accessToken = res?.token;
    if (!accessToken) throw new Error('Não foi possível obter access token do Google.');

    // Atualiza access token/expiry no banco (silencioso)
    try {
      await this.prisma.oAuthToken.update({
        where: { provider: 'google' },
        data: {
          accessToken,
          // expiry_date não está disponível diretamente aqui sem uma chamada extra; mantém o valor anterior
          expiresAt: stored.expiresAt,
        } as any,
      });
    } catch {
      // ignore
    }

    return { accessToken, email: stored.email };
  }

  async getGmailTransport() {
    const stored = await this.prisma.oAuthToken.findUnique({ where: { provider: 'google' } });
    if (!stored?.refreshToken) {
      throw new Error('Gmail não conectado.');
    }

    const { accessToken, email } = await this.getGoogleAccessToken();
    const { clientId, clientSecret } = await this.getGoogleClientSecrets();

    const fromEmail =
      process.env.EMAIL_FROM ||
      (await this.settingsService.getSetting('email_from_email')) ||
      email ||
      null;

    const fromName =
      process.env.EMAIL_FROM_NAME ||
      (await this.settingsService.getSetting('email_from_name')) ||
      null;

    if (!fromEmail) {
      throw new Error('EMAIL_FROM não definido.');
    }

    const transport = nodemailer.createTransport({
      // Evita ENETUNREACH em ambientes sem rota IPv6 (ex.: Render)
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      family: 4,
      auth: {
        type: 'OAuth2',
        user: email || fromEmail,
        clientId,
        clientSecret,
        refreshToken: stored.refreshToken,
        accessToken,
      },
    });

    return { transport, fromEmail, fromName, connectedEmail: email };
  }

  async sendTestEmail(params: { to: string; subject: string; html: string }) {
    const { email: connectedEmail } = await this.getGoogleAccessToken();
    const fromEmail = connectedEmail || process.env.EMAIL_FROM || (await this.settingsService.getSetting('email_from_email')) || null;
    const fromName =
      process.env.EMAIL_FROM_NAME ||
      (await this.settingsService.getSetting('email_from_name')) ||
      null;
    const result = await this.sendViaGmailApi({
      from: fromName ? `"${fromName}" <${fromEmail}>` : String(fromEmail || ''),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { success: true, messageId: result.messageId };
  }

  private toBase64Url(input: string): string {
    return Buffer.from(input)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  async sendViaGmailApi(params: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<{ messageId: string | null }> {
    const { accessToken, email: connectedEmail } = await this.getGoogleAccessToken();

    const safeFrom = connectedEmail
      ? params.from.replace(/<[^>]+>/, `<${connectedEmail}>`)
      : params.from;

    const mime = [
      `From: ${safeFrom}`,
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      '',
      params.html,
    ].join('\r\n');

    const raw = this.toBase64Url(mime);

    let response: any;
    try {
      response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.error_description ||
        error?.message ||
        String(error);
      throw new Error(`Gmail API send failed: ${apiMessage}`);
    }

    return {
      messageId: response?.data?.id || null,
    };
  }
}

