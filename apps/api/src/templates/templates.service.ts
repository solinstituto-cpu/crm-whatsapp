import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

export interface MetaTemplate {
  id: string;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED' | 'PAUSED';
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: TemplateComponent[];
  quality_score?: {
    score: string;
    date: number;
  };
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
    header_handle?: string[];
  };
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface CreateTemplateDto {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  components: TemplateComponent[];
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  private readonly apiVersion: string;
  private readonly wabaId: string;
  private readonly accessToken: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.wabaId = this.configService.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID');
    this.apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION') || 'v22.0';
  }
  
  /**
   * Busca credenciais de uma conta específica, da conta padrão no banco, ou usa as do .env
   */
  private async getCredentials(accountId?: string): Promise<{ accessToken: string; wabaId: string }> {
    try {
      if (accountId) {
        const account = await this.prisma.whatsAppAccount.findUnique({
          where: { id: accountId },
        });
        if (account) {
          return {
            accessToken: account.accessToken,
            wabaId: account.businessId,
          };
        }
      }
      
      // Tentar buscar a conta padrão do banco de dados
      const defaultAccount = await this.prisma.whatsAppAccount.findFirst({
        where: { isDefault: true, isActive: true },
      });
      if (defaultAccount) {
        return {
          accessToken: defaultAccount.accessToken,
          wabaId: defaultAccount.businessId,
        };
      }
    } catch (error) {
      this.logger.warn(`Erro ao buscar conta WhatsApp, usando credenciais do .env: ${error.message}`);
    }
    
    // Fallback para variáveis de ambiente
    return {
      accessToken: this.accessToken,
      wabaId: this.wabaId,
    };
  }

  /**
   * Lista todos os templates da conta do WhatsApp Business
   */
  async getTemplates(status?: string, accountId?: string): Promise<MetaTemplate[]> {
    const { accessToken, wabaId } = await this.getCredentials(accountId);
    
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${wabaId}/message_templates`;
      
      const params: any = {
        fields: 'id,name,status,category,language,components,quality_score',
        limit: 100,
      };

      if (status) {
        params.status = status;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params,
      });

      this.logger.log(`Fetched ${response.data.data?.length || 0} templates from Meta${accountId ? ` (account: ${accountId})` : ''}`);
      return response.data.data || [];
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`Failed to fetch templates: ${error.message} - ${JSON.stringify(data)}`);
      throw new Error(`Failed to fetch templates: ${data?.error?.message || error.message}`);
    }
  }

  /**
   * Busca um template específico pelo ID
   */
  async getTemplateById(templateId: string): Promise<MetaTemplate> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${templateId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        params: {
          fields: 'id,name,status,category,language,components,quality_score',
        },
      });

      return response.data;
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`Failed to fetch template ${templateId}: ${error.message}`);
      throw new Error(`Failed to fetch template: ${data?.error?.message || error.message}`);
    }
  }

  /**
   * Cria um novo template (será enviado para aprovação do Meta)
   */
  async createTemplate(createTemplateDto: CreateTemplateDto): Promise<any> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.wabaId}/message_templates`;
      
      const payload = {
        name: createTemplateDto.name,
        category: createTemplateDto.category,
        language: createTemplateDto.language,
        components: createTemplateDto.components,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Created template: ${createTemplateDto.name} - Status: PENDING`);
      return response.data;
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`Failed to create template: ${error.message} - ${JSON.stringify(data)}`);
      throw new Error(`Failed to create template: ${data?.error?.message || error.message}`);
    }
  }

  /**
   * Atualiza um template existente (apenas alguns campos podem ser editados)
   */
  async updateTemplate(templateId: string, components: TemplateComponent[]): Promise<any> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${templateId}`;
      
      const response = await axios.post(url, { components }, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Updated template ${templateId}`);
      return response.data;
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`Failed to update template: ${error.message}`);
      throw new Error(`Failed to update template: ${data?.error?.message || error.message}`);
    }
  }

  /**
   * Deleta um template pelo nome (deleta todas as versões de idioma)
   */
  async deleteTemplate(templateName: string): Promise<any> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.wabaId}/message_templates`;
      
      const response = await axios.delete(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        params: {
          name: templateName,
        },
      });

      this.logger.log(`Deleted template: ${templateName}`);
      return response.data;
    } catch (error) {
      const data = (error as any)?.response?.data;
      this.logger.error(`Failed to delete template: ${error.message}`);
      throw new Error(`Failed to delete template: ${data?.error?.message || error.message}`);
    }
  }

  /**
   * Extrai o texto do body de um template
   */
  getTemplateBodyText(template: MetaTemplate): string {
    const bodyComponent = template.components?.find(c => c.type === 'BODY');
    return bodyComponent?.text || '';
  }

  /**
   * Extrai o texto do header de um template (se for texto)
   */
  getTemplateHeaderText(template: MetaTemplate): string | null {
    const headerComponent = template.components?.find(c => c.type === 'HEADER');
    if (headerComponent?.format === 'TEXT') {
      return headerComponent.text || null;
    }
    return null;
  }

  /**
   * Retorna o formato do header (TEXT, IMAGE, VIDEO, DOCUMENT ou null)
   */
  getTemplateHeaderFormat(template: MetaTemplate): string | null {
    const headerComponent = template.components?.find(c => c.type === 'HEADER');
    return headerComponent?.format || null;
  }

  /**
   * Verifica se o template requer mídia
   */
  templateRequiresMedia(template: MetaTemplate): boolean {
    const headerComponent = template.components?.find(c => c.type === 'HEADER');
    return ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComponent?.format);
  }

  /**
   * Extrai o texto do footer de um template
   */
  getTemplateFooterText(template: MetaTemplate): string | null {
    const footerComponent = template.components?.find(c => c.type === 'FOOTER');
    return footerComponent?.text || null;
  }
}
