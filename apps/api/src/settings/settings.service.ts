import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  // Get all options for a field type
  async getFieldOptions(fieldType: string) {
    return this.prisma.customFieldOption.findMany({
      where: { fieldType, active: true },
      orderBy: { order: 'asc' },
    });
  }

  // Get all field types with their options
  async getAllFieldOptions() {
    const options = await this.prisma.customFieldOption.findMany({
      where: { active: true },
      orderBy: [{ fieldType: 'asc' }, { order: 'asc' }],
    });

    // Return as array directly
    return options;
  }

  // Create new option
  async createOption(data: {
    fieldType: string;
    value: string;
    label: string;
    color?: string;
  }) {
    // Get max order for this fieldType
    const maxOrder = await this.prisma.customFieldOption.findFirst({
      where: { fieldType: data.fieldType },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.customFieldOption.create({
      data: {
        fieldType: data.fieldType,
        value: data.value,
        label: data.label,
        color: data.color,
        order: (maxOrder?.order || 0) + 1,
      },
    });
  }

  // Update option
  async updateOption(
    id: string,
    data: {
      label?: string;
      color?: string;
      order?: number;
      active?: boolean;
    },
  ) {
    const option = await this.prisma.customFieldOption.findUnique({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException('Opção não encontrada');
    }

    return this.prisma.customFieldOption.update({
      where: { id },
      data,
    });
  }

  // Delete option (soft delete)
  async deleteOption(id: string) {
    const option = await this.prisma.customFieldOption.findUnique({
      where: { id },
    });

    if (!option) {
      throw new NotFoundException('Opção não encontrada');
    }

    return this.prisma.customFieldOption.update({
      where: { id },
      data: { active: false },
    });
  }

  // Reorder options
  async reorderOptions(fieldType: string, optionIds: string[]) {
    const updates = optionIds.map((id, index) =>
      this.prisma.customFieldOption.update({
        where: { id },
        data: { order: index + 1 },
      }),
    );

    await this.prisma.$transaction(updates);
    return { message: 'Ordem atualizada com sucesso' };
  }

  // =========== SYSTEM SETTINGS ===========

  // Get or create system settings (singleton)
  async getSystemSettings() {
    let settings = await this.prisma.systemSettings.findFirst();
    
    // If no settings exist, create default
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          companyName: 'Minha Empresa',
          primaryColor: '#16a34a',
          secondaryColor: '#22c55e',
        },
      });
    }
    
    return settings;
  }

  // Update system settings
  async updateSystemSettings(data: {
    companyName?: string;
    companyLogo?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyAddress?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }) {
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (!settings) {
      // Create with provided data
      return this.prisma.systemSettings.create({
        data: {
          companyName: data.companyName || 'Minha Empresa',
          companyLogo: data.companyLogo,
          companyPhone: data.companyPhone,
          companyEmail: data.companyEmail,
          companyAddress: data.companyAddress,
          primaryColor: data.primaryColor || '#16a34a',
          secondaryColor: data.secondaryColor || '#22c55e',
        },
      });
    }
    
    // Update existing
    return this.prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  // =========== INTEGRATION SETTINGS (API Keys, etc) ===========

  // Simple encryption for sensitive data (in production, use a proper encryption library)
  private encryptValue(value: string): string {
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-me';
    // Simple XOR encryption (for demo - use AES in production)
    let encrypted = '';
    for (let i = 0; i < value.length; i++) {
      encrypted += String.fromCharCode(value.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(encrypted).toString('base64');
  }

  private decryptValue(encryptedValue: string): string {
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-me';
    const decoded = Buffer.from(encryptedValue, 'base64').toString();
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  }

  // Get a single setting by key
  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.integrationSetting.findUnique({
      where: { key },
    });
    
    if (!setting) return null;
    
    return setting.encrypted ? this.decryptValue(setting.value) : setting.value;
  }

  // Get multiple settings by category
  async getSettingsByCategory(category: string) {
    const settings = await this.prisma.integrationSetting.findMany({
      where: { category },
    });
    
    return settings.map(s => ({
      key: s.key,
      value: s.encrypted ? '********' : s.value, // Don't expose encrypted values
      category: s.category,
      hasValue: !!s.value,
    }));
  }

  // Get all integration settings (for admin panel)
  async getAllIntegrationSettings() {
    const settings = await this.prisma.integrationSetting.findMany({
      orderBy: { category: 'asc' },
    });
    
    // Group by category and mask sensitive values
    const grouped: Record<string, any[]> = {};
    for (const s of settings) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push({
        key: s.key,
        value: s.encrypted ? '' : s.value, // Don't send encrypted values
        hasValue: !!s.value,
        encrypted: s.encrypted,
      });
    }
    
    return grouped;
  }

  // Set a setting (create or update)
  async setSetting(key: string, value: string, category: string = 'general', encrypt: boolean = false) {
    const finalValue = encrypt ? this.encryptValue(value) : value;
    
    const existing = await this.prisma.integrationSetting.findUnique({
      where: { key },
    });
    
    if (existing) {
      return this.prisma.integrationSetting.update({
        where: { key },
        data: {
          value: finalValue,
          encrypted: encrypt,
          category,
        },
      });
    }
    
    return this.prisma.integrationSetting.create({
      data: {
        key,
        value: finalValue,
        encrypted: encrypt,
        category,
      },
    });
  }

  // Delete a setting
  async deleteSetting(key: string) {
    return this.prisma.integrationSetting.delete({
      where: { key },
    });
  }

  // =========== OPENAI SPECIFIC ===========
  
  async getOpenAIConfig() {
    const apiKey = await this.getSetting('openai_api_key');
    const model = await this.getSetting('openai_model');
    const maxTokens = await this.getSetting('openai_max_tokens');
    const temperature = await this.getSetting('openai_temperature');
    
    return {
      apiKey: apiKey || process.env.OPENAI_API_KEY || null,
      model: model || 'gpt-3.5-turbo',
      maxTokens: maxTokens ? parseInt(maxTokens) : 500,
      temperature: temperature ? parseFloat(temperature) : 0.7,
      configured: !!(apiKey || process.env.OPENAI_API_KEY),
    };
  }

  async setOpenAIConfig(config: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    if (config.apiKey) {
      await this.setSetting('openai_api_key', config.apiKey, 'ai', true);
    }
    if (config.model) {
      await this.setSetting('openai_model', config.model, 'ai', false);
    }
    if (config.maxTokens !== undefined) {
      await this.setSetting('openai_max_tokens', config.maxTokens.toString(), 'ai', false);
    }
    if (config.temperature !== undefined) {
      await this.setSetting('openai_temperature', config.temperature.toString(), 'ai', false);
    }
    
    return { success: true };
  }

  // =========== GOOGLE SHEETS SPECIFIC ===========

  async getGoogleSheetsConfig() {
    const serviceEmail = await this.getSetting('google_service_account_email');
    const privateKey = await this.getSetting('google_private_key');
    
    return {
      serviceEmail: serviceEmail || null,
      hasPrivateKey: !!privateKey,
      configured: !!(serviceEmail && privateKey),
    };
  }

  async setGoogleSheetsConfig(config: {
    serviceEmail?: string;
    privateKey?: string;
  }) {
    if (config.serviceEmail) {
      await this.setSetting('google_service_account_email', config.serviceEmail, 'integrations', false);
    }
    if (config.privateKey) {
      await this.setSetting('google_private_key', config.privateKey, 'integrations', true);
    }
    
    return { success: true };
  }

  // =========== OAUTH TOKENS ===========

  async getOAuthToken(provider: string) {
    return this.prisma.oAuthToken.findUnique({
      where: { provider },
    });
  }

  async saveOAuthToken(provider: string, data: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
    email?: string;
  }) {
    const existing = await this.prisma.oAuthToken.findUnique({
      where: { provider },
    });

    if (existing) {
      return this.prisma.oAuthToken.update({
        where: { provider },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.oAuthToken.create({
      data: {
        provider,
        ...data,
      },
    });
  }

  async deleteOAuthToken(provider: string) {
    return this.prisma.oAuthToken.delete({
      where: { provider },
    });
  }
}
