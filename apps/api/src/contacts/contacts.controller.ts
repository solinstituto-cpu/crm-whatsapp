import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateContactDto, UpdateContactDto, CreateContactSchema, UpdateContactSchema } from '../common/schemas';
import { ZodValidationPipe } from '../common/validation.pipe';

@Controller('contacts')
// @UseGuards(JwtAuthGuard) // Temporariamente removido
export class ContactsController {
  private readonly logger = new Logger(ContactsController.name);
  
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    // Validação básica manual
    if (!createContactDto.name || !createContactDto.phoneE164) {
      throw new BadRequestException('Nome e telefone são obrigatórios');
    }
    return this.contactsService.create(createContactDto);
  }

  @Get('tags')
  findAllTags() {
    return this.contactsService.findAllTags();
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('customerStatus') customerStatus?: string,
    @Query('source') source?: string,
    @Query('tag') tag?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('interest') interest?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('whatsappAccountId') whatsappAccountId?: string,
  ) {
    const filters = { customerStatus, source, tag, city, state, interest, assignedToId, whatsappAccountId };
    return this.contactsService.findAll(page, limit, search, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateContactDto: UpdateContactDto
  ) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }

  @Post(':id/tags')
  addTag(@Param('id') id: string, @Body('tag') tag: string) {
    return this.contactsService.addTag(id, tag);
  }

  @Delete(':id/tags/:tag')
  removeTag(@Param('id') id: string, @Param('tag') tag: string) {
    return this.contactsService.removeTag(id, tag);
  }

  // ==========================================
  // IMPORTAÇÃO DE CONTATOS VIA CSV
  // ==========================================
  @Post('import')
  async importContacts(@Body() body: { whatsappAccountId?: string; contacts: Array<{ name: string; phone: string; tags?: string }> }) {
    this.logger.log(`Importando ${body.contacts?.length || 0} contatos para conta: ${body.whatsappAccountId || 'global/nenhuma'}`);
    
    if (!body.contacts || !Array.isArray(body.contacts)) {
      throw new BadRequestException('Lista de contatos inválida');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const contact of body.contacts) {
      try {
        // Validar campos obrigatórios
        if (!contact.name || !contact.phone) {
          results.failed++;
          results.errors.push(`Contato inválido: nome e telefone são obrigatórios`);
          continue;
        }

        // Formatar telefone para E.164
        let phoneE164 = contact.phone.replace(/\D/g, ''); // Remove tudo que não é número
        
        // Adicionar +55 se não tiver código de país
        if (!phoneE164.startsWith('55') && phoneE164.length <= 11) {
          phoneE164 = '55' + phoneE164;
        }
        
        // Adicionar + no início
        if (!phoneE164.startsWith('+')) {
          phoneE164 = '+' + phoneE164;
        }

        // Processar tags (separadas por vírgula ou ponto-e-vírgula)
        const tags: string[] = [];
        if (contact.tags) {
          const tagList = contact.tags.split(/[,;]/).map(t => t.trim()).filter(t => t);
          tags.push(...tagList);
        }

        // Verificar se contato já existe para a conta de WhatsApp específica
        const existing = await this.contactsService.findByPhone(phoneE164, body.whatsappAccountId);
        
        if (existing) {
          // Atualizar tags do contato existente se houver novas tags
          if (tags.length > 0) {
            const existingTags = existing.tags ? JSON.parse(existing.tags) : [];
            const newTags = [...new Set([...existingTags, ...tags])];
            await this.contactsService.update(existing.id, { tags: newTags });
          }
          results.success++;
          this.logger.log(`Contato atualizado: ${phoneE164} na conta ${body.whatsappAccountId || 'global'}`);
        } else {
          // Criar novo contato
          await this.contactsService.create({
            name: contact.name,
            phoneE164,
            tags,
            whatsappAccountId: body.whatsappAccountId || null,
          });
          results.success++;
          this.logger.log(`Contato criado: ${phoneE164} na conta ${body.whatsappAccountId || 'global'}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Erro ao importar ${contact.name}: ${error.message}`);
        this.logger.error(`Erro ao importar contato: ${error.message}`);
      }
    }

    this.logger.log(`Importação concluída: ${results.success} sucesso, ${results.failed} falhas`);
    return results;
  }
}