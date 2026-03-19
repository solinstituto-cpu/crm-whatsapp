import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EmailAuthService } from '../email-auth/email-auth.service';
import * as nodemailer from 'nodemailer';
import crypto from 'crypto';

type EmailContactForCampaign = {
  id: string;
  name: string;
  email: string;
  customerStatus: string | null;
  source: string | null;
  tags: string | null;
  customFields: string | null;
  phoneE164: string;
  company: string | null;
  city: string | null;
};

type CampaignAutomationConfig = {
  enabled?: boolean;
  trigger?: 'OPEN' | 'CLICK' | 'BOTH';
  targetStageId?: string;
  followupSubject?: string;
  followupHtml?: string;
};

@Injectable()
export class EmailCampaignsService {
  private readonly logger = new Logger(EmailCampaignsService.name);

  // Controla envios em execução (pause/cancel)
  private runningCampaigns = new Map<string, boolean>();

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private emailAuthService: EmailAuthService,
  ) {}

  async findAll(page = 1, limit = 10, status?: string) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = status ? { status } : {};

    const [campaigns, total] = await Promise.all([
      this.prisma.emailCampaign.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.emailCampaign.count({ where }),
    ]);

    return {
      campaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async getStats() {
    const [campaignTotal, messageTotal] = await Promise.all([
      this.prisma.emailCampaign.count(),
      this.prisma.emailCampaignMessage.count(),
    ]);

    // Contagens por status (campanhas)
    const [draft, running, scheduled, completed, cancelled, paused] = await Promise.all([
      this.prisma.emailCampaign.count({ where: { status: 'DRAFT' } }),
      this.prisma.emailCampaign.count({ where: { status: 'RUNNING' } }),
      this.prisma.emailCampaign.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.emailCampaign.count({ where: { status: 'COMPLETED' } }),
      this.prisma.emailCampaign.count({ where: { status: 'CANCELLED' } }),
      this.prisma.emailCampaign.count({ where: { status: 'PAUSED' } }),
    ]);

    const [sent, delivered, read, clicked, failed] = await Promise.all([
      this.prisma.emailCampaignMessage.count({ where: { status: 'SENT' } }),
      this.prisma.emailCampaignMessage.count({ where: { status: 'DELIVERED' } }),
      this.prisma.emailCampaignMessage.count({ where: { status: 'READ' } }),
      this.prisma.emailCampaignMessage.count({ where: { clickCount: { gt: 0 } } }),
      this.prisma.emailCampaignMessage.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      campaigns: {
        total: campaignTotal,
        draft,
        running,
        scheduled,
        completed,
        cancelled,
        paused,
      },
      messages: {
        total: messageTotal,
        sent,
        delivered,
        read,
        clicked,
        failed,
      },
    };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        messages: {
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada');
    }

    return campaign;
  }

  async create(data: {
    name: string;
    description?: string;
    subject: string;
    preheader?: string;
    htmlTemplate: string;
    filterTags?: string[];
    filterStatus?: string;
    filterSource?: string;
    filterCustomFields?: any;
    excludeOptOut?: boolean;
    sendRatePerMinute?: number;
    fromEmail?: string;
    fromName?: string;
    scheduledAt?: string;
  }) {
    this.logger.log(`Criando campanha de e-mail: ${data.name}`);

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        name: data.name,
        description: data.description,
        subject: data.subject,
        preheader: data.preheader,
        htmlTemplate: data.htmlTemplate,
        filterTags: data.filterTags ? JSON.stringify(data.filterTags) : null,
        filterStatus: data.filterStatus ?? null,
        filterSource: data.filterSource ?? null,
        filterCustomFields: data.filterCustomFields
          ? JSON.stringify(data.filterCustomFields)
          : null,
        excludeOptOut: data.excludeOptOut ?? true,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        sendRatePerMinute: data.sendRatePerMinute || 10,
        fromEmail: data.fromEmail ?? null,
        fromName: data.fromName ?? null,
      },
    });

    return campaign;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      subject: string;
      preheader?: string;
      htmlTemplate: string;
      filterTags?: string[];
      filterStatus?: string;
      filterSource?: string;
      filterCustomFields?: any;
      excludeOptOut?: boolean;
      sendRatePerMinute?: number;
      fromEmail?: string;
      fromName?: string;
      scheduledAt?: string | null;
    }>,
  ) {
    const campaign = await this.findOne(id);

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Só é possível editar campanhas em rascunho (DRAFT)');
    }

    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        ...data,
        filterTags: data.filterTags ? JSON.stringify(data.filterTags) : undefined,
        filterCustomFields: data.filterCustomFields ? JSON.stringify(data.filterCustomFields) : undefined,
        scheduledAt: data.scheduledAt === undefined ? undefined : data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: data.scheduledAt === undefined ? undefined : data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });
  }

  async delete(id: string) {
    const campaign = await this.findOne(id);

    if (campaign.status === 'RUNNING') {
      throw new BadRequestException('Não é possível excluir campanha em execução. Pause/cancel primeiro.');
    }

    await this.prisma.emailCampaign.delete({ where: { id } });
    return { success: true };
  }

  private parseTags(tagsRaw: any): string[] {
    if (!tagsRaw) return [];
    if (Array.isArray(tagsRaw)) return tagsRaw.map(String);
    if (typeof tagsRaw === 'string') {
      try {
        const parsed = JSON.parse(tagsRaw);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // fallback
      }
      // fallback: tenta separar por vírgula/; (quando não for JSON)
      return tagsRaw.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  private safeParseJson(value: any): any {
    if (!value) return null;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private getTrackingSecret() {
    return process.env.EMAIL_TRACKING_SECRET || process.env.JWT_SECRET || 'email_tracking_secret';
  }

  private signTrackingToken(messageId: string) {
    return crypto
      .createHmac('sha256', this.getTrackingSecret())
      .update(messageId)
      .digest('hex');
  }

  private isValidTrackingToken(messageId: string, token?: string) {
    if (!token) return false;
    const expected = this.signTrackingToken(messageId);
    const a = Buffer.from(expected);
    const b = Buffer.from(token);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  private getPublicApiBaseUrl() {
    const raw =
      process.env.PUBLIC_API_URL ||
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.WEBAPP_URL ||
      'http://localhost:4000';
    return String(raw).replace(/\/$/, '');
  }

  private rewriteLinksForTracking(html: string, messageId: string) {
    const token = this.signTrackingToken(messageId);
    const base = this.getPublicApiBaseUrl();
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    return html.replace(hrefRegex, (full, href: string) => {
      const target = String(href || '').trim();
      if (!/^https?:\/\//i.test(target)) return full;
      const tracked = `${base}/api/email-campaigns/track/click/${messageId}?token=${token}&url=${encodeURIComponent(target)}`;
      return full.replace(href, tracked);
    });
  }

  private injectOpenPixel(html: string, messageId: string) {
    const token = this.signTrackingToken(messageId);
    const base = this.getPublicApiBaseUrl();
    const pixelTag = `<img src="${base}/api/email-campaigns/track/open/${messageId}?token=${token}" width="1" height="1" style="display:none!important;opacity:0;" alt="" />`;
    if (/<\/body>/i.test(html)) {
      return html.replace(/<\/body>/i, `${pixelTag}</body>`);
    }
    return `${html}\n${pixelTag}`;
  }

  private applyTrackingToHtml(html: string, messageId: string) {
    const withLinks = this.rewriteLinksForTracking(html, messageId);
    return this.injectOpenPixel(withLinks, messageId);
  }

  private getAutomationConfig(filterCustomFields: string | null): CampaignAutomationConfig | null {
    const parsed = this.safeParseJson(filterCustomFields);
    if (!parsed || typeof parsed !== 'object') return null;
    const automation = (parsed as any)?.automation;
    if (!automation || typeof automation !== 'object') return null;
    return automation as CampaignAutomationConfig;
  }

  async previewContacts(filters: {
    filterTags?: string[];
    filterStatus?: string;
    filterSource?: string;
    excludeOptOut?: boolean;
  }) {
    let contacts = await this.prisma.contact.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phoneE164: true,
        customerStatus: true,
        source: true,
        tags: true,
        optedOut: true,
        customFields: true,
        company: true,
        city: true,
      },
      orderBy: { name: 'asc' },
    });

    // E-mail precisa existir
    contacts = contacts.filter(c => c.email && String(c.email).trim() !== '');

    // Tags
    if (filters.filterTags && filters.filterTags.length > 0) {
      const wanted = new Set(filters.filterTags);
      contacts = contacts.filter(c => {
        const tags = this.parseTags(c.tags);
        return tags.some(t => wanted.has(t));
      });
    }

    // Status
    if (filters.filterStatus) {
      contacts = contacts.filter(c => c.customerStatus === filters.filterStatus);
    }

    // Origem
    if (filters.filterSource) {
      contacts = contacts.filter(c => c.source === filters.filterSource);
    }

    // Opt-out
    if (filters.excludeOptOut !== false) {
      contacts = contacts.filter(c => !c.optedOut);
    }

    const total = contacts.length;
    const showingContacts = contacts.slice(0, 100);

    return {
      contacts: showingContacts.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
      })),
      total,
      showing: Math.min(showingContacts.length, 100),
    };
  }

  private renderTemplate(text: string, contact: EmailContactForCampaign, customFields: Record<string, any>) {
    // Render simples por placeholders: {{name}}, {{email}}, {{company}}, {{custom.seu_campo}}
    return text.replace(/\{\{([^}]+)\}\}/g, (match, rawToken: string) => {
      const token = String(rawToken).trim();
      switch (token) {
        case 'name':
          return contact.name || '';
        case 'email':
          return contact.email || '';
        case 'phoneE164':
          return contact.phoneE164 || '';
        case 'company':
          return contact.company || '';
        case 'city':
          return contact.city || '';
        case 'customerStatus':
          return contact.customerStatus || '';
        case 'source':
          return contact.source || '';
        case 'preheader':
          return '';
        default: {
          if (token.startsWith('custom.')) {
            const key = token.slice('custom.'.length);
            const v = customFields?.[key];
            return v === undefined || v === null ? '' : String(v);
          }
          return '';
        }
      }
    });
  }

  private async getEmailTransport() {
    // 1) Preferir Gmail OAuth conectado (login/autorizar dentro do CRM)
    const status = await this.emailAuthService.getStatus();
    if (status.google?.connected) {
      const { email: connectedGoogleEmail } = await this.emailAuthService.getGoogleAccessToken();
      const fromEmail = connectedGoogleEmail || process.env.EMAIL_FROM || (await this.settingsService.getSetting('email_from_email')) || null;
      const fromName =
        process.env.EMAIL_FROM_NAME ||
        (await this.settingsService.getSetting('email_from_name')) ||
        null;

      if (!fromEmail) {
        throw new Error('EMAIL_FROM não definido para envio via Gmail');
      }

      try {
        return {
          transport: {
            sendMail: async (opts: { from: string; to: string; subject: string; html: string }) => {
              const result = await this.emailAuthService.sendViaGmailApi({
                from: opts.from,
                to: opts.to,
                subject: opts.subject,
                html: opts.html,
              });
              return { messageId: result.messageId };
            },
          } as any,
          fromEmail,
          fromName,
        };
      } catch (error: any) {
        const detail = error?.message || String(error);
        throw new Error(
          `Integração Gmail conectada, mas falhou ao obter credenciais de envio. Reconecte o Gmail em Configurações > Integrações. Detalhe: ${detail}`,
        );
      }
    }

    // 2) Fallback SMTP (Hostgator/Gmail com credenciais)
    const host =
      process.env.EMAIL_SMTP_HOST ||
      (await this.settingsService.getSetting('email_smtp_host')) ||
      null;

    const portRaw =
      process.env.EMAIL_SMTP_PORT ||
      (await this.settingsService.getSetting('email_smtp_port')) ||
      null;

    const user =
      process.env.EMAIL_SMTP_USER ||
      (await this.settingsService.getSetting('email_smtp_user')) ||
      null;

    const pass =
      process.env.EMAIL_SMTP_PASS ||
      (await this.settingsService.getSetting('email_smtp_pass')) ||
      null;

    const fromEmail =
      process.env.EMAIL_FROM ||
      (await this.settingsService.getSetting('email_from_email')) ||
      null;

    const fromName =
      process.env.EMAIL_FROM_NAME ||
      (await this.settingsService.getSetting('email_from_name')) ||
      null;

    const port = portRaw ? Number(portRaw) : null;

    if (!host || !port || !user || !pass || !fromEmail) {
      throw new Error(
        'Configuração SMTP não encontrada. Defina EMAIL_SMTP_HOST/EMAIL_SMTP_PORT/EMAIL_SMTP_USER/EMAIL_SMTP_PASS e EMAIL_FROM (ou via integration_settings).',
      );
    }

    const secure = port === 465 || process.env.EMAIL_SMTP_SECURE === 'true';

    return {
      transport: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      }),
      fromEmail,
      fromName,
    };
  }

  private async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async loadContactsForCampaign(campaign: {
    filterTags: string | null;
    filterStatus: string | null;
    filterSource: string | null;
    filterCustomFields: string | null;
    excludeOptOut: boolean;
  }, limit?: number): Promise<EmailContactForCampaign[]> {
    let contacts = await this.prisma.contact.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phoneE164: true,
        customerStatus: true,
        source: true,
        tags: true,
        optedOut: true,
        customFields: true,
        company: true,
        city: true,
      },
      orderBy: { name: 'asc' },
    });

    contacts = contacts.filter(c => c.email && String(c.email).trim() !== '');

    const filterTagsArray: string[] = campaign.filterTags
      ? (this.safeParseJson(campaign.filterTags) || []).map(String)
      : [];

    if (filterTagsArray.length > 0) {
      const wanted = new Set(filterTagsArray);
      contacts = contacts.filter(c => {
        const tags = this.parseTags(c.tags);
        return tags.some(t => wanted.has(t));
      });
    }

    if (campaign.filterStatus) {
      contacts = contacts.filter(c => c.customerStatus === campaign.filterStatus);
    }

    if (campaign.filterSource) {
      contacts = contacts.filter(c => c.source === campaign.filterSource);
    }

    if (campaign.excludeOptOut !== false) {
      contacts = contacts.filter(c => !c.optedOut);
    }

    if (typeof limit === 'number') {
      contacts = contacts.slice(0, limit);
    }

    return contacts as any;
  }

  async start(id: string, forceStart = false) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');

    if (!forceStart) {
      if (campaign.status !== 'DRAFT' && campaign.status !== 'PAUSED' && campaign.status !== 'SCHEDULED') {
        throw new BadRequestException(`Não é possível iniciar campanha com status: ${campaign.status}`);
      }
    }

    const recipients = await this.loadContactsForCampaign(campaign as any, 5000);

    if (recipients.length === 0) {
      throw new BadRequestException('Nenhum contato encontrado com os filtros selecionados');
    }

    if (recipients.length === 5000) {
      this.logger.warn(`Limite de 5000 destinatários aplicado para campanha ${id}`);
    }

    // Evitar duplicar mensagens PENDING já existentes para o mesmo contato
    const existingMessages = await this.prisma.emailCampaignMessage.findMany({
      where: { emailCampaignId: id },
      select: { contactId: true },
    });
    const existingContactIds = new Set(existingMessages.map(m => m.contactId).filter(Boolean) as string[]);

    const newMessages = recipients
      .filter(c => !existingContactIds.has(c.id))
      .map(c => ({
        emailCampaignId: id,
        contactId: c.id,
        contactEmail: c.email,
        contactName: c.name || null,
        status: 'PENDING',
      }));

    if (newMessages.length > 0) {
      await this.prisma.emailCampaignMessage.createMany({
        data: newMessages,
      });
    }

    await this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'RUNNING',
        scheduledAt: null,
        startedAt: new Date(),
        totalContacts: recipients.length,
      },
    });

    // Processamento em background (responde rápido como no WhatsApp)
    this.processEmailCampaign(id).catch(err => {
      this.logger.error(`Erro ao processar campanha de e-mail ${id}: ${err?.message || err}`);
      this.runningCampaigns.delete(id);
      // Marca como pausada para permitir tentativa posterior
      this.prisma.emailCampaign
        .update({ where: { id }, data: { status: 'PAUSED' } })
        .catch(() => null);
    });

    return { success: true, totalContacts: recipients.length, pendingCreated: newMessages.length };
  }

  async processEmailCampaign(campaignId: string) {
    this.runningCampaigns.set(campaignId, true);

    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return;

    const { transport, fromEmail: fromEnvEmail, fromName: fromEnvName } = await this.getEmailTransport();

    const delayMs = campaign.sendRatePerMinute > 0 ? Math.floor(60000 / campaign.sendRatePerMinute) : 0;

    while (this.runningCampaigns.get(campaignId)) {
      // Se cancelou, para imediatamente
      const currentCampaign = await this.prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        select: { status: true },
      });
      if (currentCampaign?.status === 'CANCELLED') {
        this.runningCampaigns.delete(campaignId);
        return;
      }

      const message = await this.prisma.emailCampaignMessage.findFirst({
        where: { emailCampaignId: campaignId, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });

      if (!message) {
        await this.prisma.emailCampaign.update({
          where: { id: campaignId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
        this.runningCampaigns.delete(campaignId);
        return;
      }

      // Buscar contato para renderizar tokens (inclui customFields)
      if (!message.contactId) {
        await this.prisma.emailCampaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            error: 'contactId ausente no registro da mensagem',
          },
        });
        continue;
      }

      const contact = await this.prisma.contact.findUnique({
        where: { id: message.contactId },
        select: {
          id: true,
          name: true,
          email: true,
          phoneE164: true,
          customerStatus: true,
          source: true,
          tags: true,
          optedOut: true,
          customFields: true,
          company: true,
          city: true,
        },
      });

      if (!contact || !contact.email) {
        await this.prisma.emailCampaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            error: 'Contato não encontrado ou sem e-mail',
          },
        });
        continue;
      }

      const customFieldsObj = this.safeParseJson(contact.customFields) || {};

      const subject = this.renderTemplate(campaign.subject, contact as any, customFieldsObj);
      const htmlBase = this.renderTemplate(campaign.htmlTemplate, contact as any, customFieldsObj);
      const html = this.applyTrackingToHtml(htmlBase, message.id);

      const fromEmail = campaign.fromEmail || fromEnvEmail;
      const fromName = campaign.fromName || fromEnvName || undefined;

      try {
        const info = await transport.sendMail({
          from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
          to: contact.email,
          subject,
          html,
        });

        await this.prisma.emailCampaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'SENT',
            smtpMessageId: (info as any)?.messageId || null,
            sentAt: new Date(),
            deliveredAt: new Date(),
            error: null,
          },
        });

        await this.prisma.emailCampaign.update({
          where: { id: campaignId },
          data: {
            sentCount: { increment: 1 },
            deliveredCount: { increment: 1 },
          },
        });
      } catch (error: any) {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.error_description ||
          error?.message ||
          String(error);
        await this.prisma.emailCampaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            error: msg.slice(0, 2000),
          },
        });

        await this.prisma.emailCampaign.update({
          where: { id: campaignId },
          data: {
            failedCount: { increment: 1 },
          },
        });

        this.logger.error(`Falha ao enviar e-mail (${contact.email}): ${msg}`);
      }

      if (delayMs > 0) {
        await this.wait(delayMs);
      }
    }

    // Se saiu do loop por pause/cancel, removemos do mapa de execução
    this.runningCampaigns.delete(campaignId);
  }

  private getTransparentGifBuffer() {
    return Buffer.from('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
  }

  private async processAutomationIfNeeded(params: {
    messageId: string;
    eventType: 'OPEN' | 'CLICK';
  }) {
    const message = await this.prisma.emailCampaignMessage.findUnique({
      where: { id: params.messageId },
      include: { emailCampaign: true },
    });
    if (!message || !message.contactId) return;
    if (message.automationProcessedAt) return;

    const automation = this.getAutomationConfig(message.emailCampaign.filterCustomFields);
    if (!automation?.enabled || !automation.targetStageId) return;

    const trigger = automation.trigger || 'BOTH';
    if (trigger !== 'BOTH' && trigger !== params.eventType) return;

    const stage = await this.prisma.pipelineStage.findUnique({ where: { id: automation.targetStageId } });
    if (!stage) return;

    const deal = await this.prisma.deal.findFirst({
      where: { contactId: message.contactId },
      orderBy: { updatedAt: 'desc' },
    });

    if (deal && deal.stageId !== stage.id) {
      await this.prisma.deal.update({
        where: { id: deal.id },
        data: { stageId: stage.id },
      });
    }

    if (automation.followupSubject && automation.followupHtml && message.contactEmail) {
      try {
        const { transport, fromEmail: fromEnvEmail, fromName: fromEnvName } = await this.getEmailTransport();
        const fromEmail = message.emailCampaign.fromEmail || fromEnvEmail;
        const fromName = message.emailCampaign.fromName || fromEnvName || undefined;
        const subject = this.renderTemplate(automation.followupSubject, {
          id: message.contactId,
          name: message.contactName || '',
          email: message.contactEmail,
          customerStatus: null,
          source: null,
          tags: null,
          customFields: null,
          phoneE164: '',
          company: null,
          city: null,
        }, {});
        const html = this.applyTrackingToHtml(automation.followupHtml, message.id);

        await transport.sendMail({
          from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
          to: message.contactEmail,
          subject,
          html,
        });
      } catch (error: any) {
        this.logger.error(`Falha no follow-up automático da mensagem ${message.id}: ${error?.message || error}`);
      }
    }

    await this.prisma.emailCampaignMessage.update({
      where: { id: message.id },
      data: {
        automationProcessedAt: new Date(),
      },
    });
  }

  async trackOpen(params: {
    messageId: string;
    token?: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    if (!this.isValidTrackingToken(params.messageId, params.token)) {
      return this.getTransparentGifBuffer();
    }

    const message = await this.prisma.emailCampaignMessage.findUnique({
      where: { id: params.messageId },
      select: { id: true, emailCampaignId: true, readAt: true, status: true },
    });
    if (!message) return this.getTransparentGifBuffer();

    if (!message.readAt) {
      await this.prisma.emailCampaignMessage.update({
        where: { id: message.id },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });

      await this.prisma.emailCampaign.update({
        where: { id: message.emailCampaignId },
        data: { readCount: { increment: 1 } },
      });
    }

    this.processAutomationIfNeeded({ messageId: params.messageId, eventType: 'OPEN' }).catch(() => null);
    return this.getTransparentGifBuffer();
  }

  async trackClick(params: {
    messageId: string;
    token?: string;
    url?: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const safeFallbackUrl = process.env.WEBAPP_URL || 'https://example.com';
    if (!this.isValidTrackingToken(params.messageId, params.token)) return safeFallbackUrl;

    const target = String(params.url || '').trim();
    if (!/^https?:\/\//i.test(target)) return safeFallbackUrl;

    const message = await this.prisma.emailCampaignMessage.findUnique({
      where: { id: params.messageId },
      select: { id: true, emailCampaignId: true, readAt: true, clickCount: true },
    });
    if (!message) return target;

    await this.prisma.emailCampaignMessage.update({
      where: { id: message.id },
      data: {
        status: 'READ',
        readAt: message.readAt || new Date(),
        clickCount: { increment: 1 },
        firstClickedAt: message.clickCount === 0 ? new Date() : undefined,
        lastClickedAt: new Date(),
      },
    });

    if (!message.readAt) {
      await this.prisma.emailCampaign.update({
        where: { id: message.emailCampaignId },
        data: { readCount: { increment: 1 } },
      });
    }

    if (message.clickCount === 0) {
      await this.prisma.emailCampaign.update({
        where: { id: message.emailCampaignId },
        data: { clickedCount: { increment: 1 } },
      });
    }

    this.processAutomationIfNeeded({ messageId: params.messageId, eventType: 'CLICK' }).catch(() => null);
    return target;
  }

  async pause(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    if (campaign.status !== 'RUNNING') {
      throw new BadRequestException('Só é possível pausar campanha em execução');
    }
    this.runningCampaigns.set(id, false);
    await this.prisma.emailCampaign.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
    return { success: true, paused: true };
  }

  async schedule(id: string, scheduledAt: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    if (!scheduledAt) throw new BadRequestException('Informe a data/hora de agendamento');
    if (campaign.status === 'RUNNING') {
      throw new BadRequestException('Não é possível agendar campanha em execução');
    }

    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
      },
    });
  }

  async unschedule(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    if (campaign.status !== 'SCHEDULED') {
      throw new BadRequestException('Só é possível remover agendamento de campanhas SCHEDULED');
    }

    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'DRAFT',
        scheduledAt: null,
      },
    });
  }

  async cancel(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');

    if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') {
      return { success: true };
    }

    this.runningCampaigns.set(id, false);
    await this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
    return { success: true, cancelled: true };
  }
}

