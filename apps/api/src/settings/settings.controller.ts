import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  // =========== SYSTEM SETTINGS (Company Info) ===========
  
  @Get('system')
  async getSystemSettings() {
    this.logger.log('GET /settings/system');
    return this.settingsService.getSystemSettings();
  }

  @Put('system')
  async updateSystemSettings(
    @Body() body: {
      companyName?: string;
      companyLogo?: string;
      companyPhone?: string;
      companyEmail?: string;
      companyAddress?: string;
      primaryColor?: string;
      secondaryColor?: string;
    }
  ) {
    this.logger.log('PUT /settings/system');
    return this.settingsService.updateSystemSettings(body);
  }

  // Upload de logo (aceita arquivo e converte para base64)
  @Post('upload-logo')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async uploadLogo(@UploadedFile() file: any) {
    this.logger.log('POST /settings/upload-logo');
    if (!file) {
      throw new Error('No file uploaded');
    }
    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File too large. Max 2MB');
    }
    // Validar tipo
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }
    // Converter para base64 data URL
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    return { url: dataUrl };
  }

  // =========== FIELD OPTIONS ===========

  @Get('field-options')
  async getAllFieldOptions() {
    this.logger.log('GET /settings/field-options');
    return this.settingsService.getAllFieldOptions();
  }

  @Get('field-options/:fieldType')
  async getFieldOptions(@Param('fieldType') fieldType: string) {
    this.logger.log(`GET /settings/field-options/${fieldType}`);
    return this.settingsService.getFieldOptions(fieldType);
  }

  @Post('field-options')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createOption(
    @Body()
    body: {
      fieldType: string;
      value: string;
      label: string;
      color?: string;
    },
  ) {
    this.logger.log(`POST /settings/field-options - ${body.label}`);
    return this.settingsService.createOption(body);
  }

  @Patch('field-options/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateOption(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      color?: string;
      order?: number;
      active?: boolean;
    },
  ) {
    this.logger.log(`PATCH /settings/field-options/${id}`);
    return this.settingsService.updateOption(id, body);
  }

  @Delete('field-options/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteOption(@Param('id') id: string) {
    this.logger.log(`DELETE /settings/field-options/${id}`);
    return this.settingsService.deleteOption(id);
  }

  @Post('field-options/:fieldType/reorder')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async reorderOptions(
    @Param('fieldType') fieldType: string,
    @Body() body: { optionIds: string[] },
  ) {
    this.logger.log(`POST /settings/field-options/${fieldType}/reorder`);
    return this.settingsService.reorderOptions(fieldType, body.optionIds);
  }

  // =========== INTEGRATION SETTINGS (API Keys, etc) ===========

  @Get('integrations')
  async getAllIntegrationSettings() {
    this.logger.log('GET /settings/integrations');
    return this.settingsService.getAllIntegrationSettings();
  }

  @Get('integrations/:category')
  async getIntegrationsByCategory(@Param('category') category: string) {
    this.logger.log(`GET /settings/integrations/${category}`);
    return this.settingsService.getSettingsByCategory(category);
  }

  // =========== OPENAI CONFIG ===========

  @Get('openai')
  async getOpenAIConfig() {
    this.logger.log('GET /settings/openai');
    return this.settingsService.getOpenAIConfig();
  }

  @Put('openai')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async setOpenAIConfig(
    @Body() body: {
      apiKey?: string;
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ) {
    this.logger.log('PUT /settings/openai');
    return this.settingsService.setOpenAIConfig(body);
  }

  @Post('openai/test')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async testOpenAIConnection() {
    this.logger.log('POST /settings/openai/test');
    try {
      const config = await this.settingsService.getOpenAIConfig();
      if (!config.apiKey) {
        return { success: false, error: 'API Key não configurada' };
      }
      
      // Test with a simple completion
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Diga apenas "OK" para testar.' }],
          max_tokens: 10,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error?.message || 'Erro na API' };
      }
      
      return { success: true, message: 'Conexão OK!' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // =========== GOOGLE SHEETS CONFIG ===========

  @Get('google-sheets')
  async getGoogleSheetsConfig() {
    this.logger.log('GET /settings/google-sheets');
    return this.settingsService.getGoogleSheetsConfig();
  }

  @Put('google-sheets')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async setGoogleSheetsConfig(
    @Body() body: {
      serviceEmail?: string;
      privateKey?: string;
    }
  ) {
    this.logger.log('PUT /settings/google-sheets');
    return this.settingsService.setGoogleSheetsConfig(body);
  }
}
