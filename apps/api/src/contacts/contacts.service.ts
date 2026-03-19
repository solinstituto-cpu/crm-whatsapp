import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from '../common/schemas';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);
  
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    this.logger.log(`Creating contact: ${createContactDto.name}`);
    const data: any = {
      name: createContactDto.name,
      phoneE164: createContactDto.phoneE164,
      email: createContactDto.email || null,
      company: createContactDto.company || null,
      role: createContactDto.role || null,
      notes: createContactDto.notes || null,
      // Dados pessoais
      birthday: createContactDto.birthday ? new Date(createContactDto.birthday) : null,
      cpf: createContactDto.cpf || null,
      address: createContactDto.address || null,
      city: createContactDto.city || null,
      state: createContactDto.state || null,
      // Dados comerciais
      source: createContactDto.source || null,
      interest: createContactDto.interest || null,
      customerStatus: createContactDto.customerStatus || null,
      enrollmentDate: createContactDto.enrollmentDate ? new Date(createContactDto.enrollmentDate) : null,
      referredBy: createContactDto.referredBy || null,
      tags: createContactDto.tags ? JSON.stringify(createContactDto.tags) : '[]',
      // Responsável
      assignedToId: createContactDto.assignedToId || null,
    };
    
    const contact = await this.prisma.contact.create({ data });
    
    // Vincular conversas órfãs com o mesmo número
    await this.prisma.conversation.updateMany({
      where: {
        phoneE164: createContactDto.phoneE164,
        contactId: null,
      },
      data: {
        contactId: contact.id,
      },
    });
    
    this.logger.log(`Linked orphaned conversations to contact ${contact.id}`);
    
    return contact;
  }

  async findAll(
    page = 1, 
    limit = 10, 
    search?: string,
    filters?: {
      customerStatus?: string;
      source?: string;
      tag?: string;
      city?: string;
      state?: string;
      interest?: string;
      assignedToId?: string;
    }
  ) {
    try {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;
      
      this.logger.log(`Finding contacts: page=${pageNum}, limit=${limitNum}, search=${search || 'none'}, filters=${JSON.stringify(filters)}`);
      
      // Construir where com busca e filtros
      const conditions: any[] = [];
      
      // Busca por texto
      if (search) {
        conditions.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phoneE164: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
            { tags: { contains: search, mode: 'insensitive' } },
          ],
        });
      }
      
      // Filtros específicos
      if (filters?.customerStatus) {
        conditions.push({ customerStatus: filters.customerStatus });
      }
      if (filters?.source) {
        conditions.push({ source: filters.source });
      }
      if (filters?.tag) {
        conditions.push({ tags: { contains: filters.tag, mode: 'insensitive' } });
      }
      if (filters?.city) {
        conditions.push({ city: { contains: filters.city, mode: 'insensitive' } });
      }
      if (filters?.state) {
        conditions.push({ state: filters.state });
      }
      if (filters?.interest) {
        conditions.push({ interest: { contains: filters.interest, mode: 'insensitive' } });
      }
      if (filters?.assignedToId) {
        conditions.push({ assignedToId: filters.assignedToId });
      }
      
      const where = conditions.length > 0 ? { AND: conditions } : {};

      // Contar total geral (sem filtros) para estatísticas
      const totalGeral = await this.prisma.contact.count();
      const ativos = await this.prisma.contact.count({ where: { optedOut: false } });
      const novos7d = await this.prisma.contact.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      const [contacts, total] = await Promise.all([
        this.prisma.contact.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { conversations: true, deals: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.contact.count({ where }),
      ]);

      this.logger.log(`Found ${contacts.length} contacts (total filtered: ${total}, total geral: ${totalGeral})`);

      // Parse tags from JSON strings
      const contactsWithParsedTags = contacts.map(contact => ({
        ...contact,
        tags: this.safeParseTags(contact.tags),
      }));

      return {
        contacts: contactsWithParsedTags,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        stats: {
          totalGeral,
          ativos,
          novos7d,
        },
      };
    } catch (error) {
      this.logger.error('Error finding contacts:', error);
      throw error;
    }
  }
  
  private safeParseTags(tags: string | null): string[] {
    try {
      if (!tags) return [];
      return JSON.parse(tags);
    } catch {
      return [];
    }
  }

  /** Retorna lista única de tags (endpoint leve, sem carregar contatos completos) */
  async findAllTags(): Promise<string[]> {
    const rows = await this.prisma.contact.findMany({
      select: { tags: true },
      // tags é String obrigatória no schema (não-null). Evitar filtro inválido (not: null).
    });
    const tagSet = new Set<string>();
    for (const row of rows) {
      if (row.tags) {
        const arr = this.safeParseTags(row.tags);
        arr.forEach((t: string) => t && tagSet.add(t.trim()));
      }
    }
    return Array.from(tagSet).filter(Boolean).sort();
  }

  // Buscar contato pelo telefone
  async findByPhone(phoneE164: string) {
    return this.prisma.contact.findUnique({
      where: { phoneE164 },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
        deals: {
          include: {
            stage: true,
            owner: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (contact) {
      return {
        ...contact,
        tags: JSON.parse(contact.tags || '[]'),
      };
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto) {
    // Preparar dados, convertendo datas
    const data: any = {};
    
    // Copiar campos simples
    const simpleFields = ['name', 'phoneE164', 'email', 'company', 'role', 'notes', 
                          'cpf', 'address', 'city', 'state', 'source', 'interest', 
                          'customerStatus', 'referredBy', 'optedOut', 'assignedToId'];
    
    const normalizeOptionalString = (v: any) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        return trimmed === '' ? null : trimmed;
      }
      return v;
    };

    for (const field of simpleFields) {
      if (updateContactDto[field] !== undefined) {
        // Não usar "|| null" (isso quebrava valores como false/0 e pode forçar null indevido)
        // Strings vazias viram null; demais tipos preservados.
        data[field] = normalizeOptionalString(updateContactDto[field]);
      }
    }
    
    // Converter campos de data
    if (updateContactDto.birthday !== undefined) {
      data.birthday = updateContactDto.birthday ? new Date(updateContactDto.birthday) : null;
    }
    if (updateContactDto.enrollmentDate !== undefined) {
      data.enrollmentDate = updateContactDto.enrollmentDate ? new Date(updateContactDto.enrollmentDate) : null;
    }
    
    // Converter tags para JSON
    if (updateContactDto.tags !== undefined) {
      data.tags = JSON.stringify(updateContactDto.tags || []);
    }

    // Converter customFields para JSON (pode vir como objeto ou string)
    if (updateContactDto.customFields !== undefined) {
      if (typeof updateContactDto.customFields === 'string') {
        data.customFields = updateContactDto.customFields || null;
      } else if (updateContactDto.customFields === null) {
        data.customFields = null;
      } else if (typeof updateContactDto.customFields === 'object') {
        data.customFields =
          Object.keys(updateContactDto.customFields).length > 0
            ? JSON.stringify(updateContactDto.customFields)
            : null;
      }
    }
    
    this.logger.log(`Updating contact ${id} with data:`, JSON.stringify(data));
    
    let updated: any;
    try {
      updated = await this.prisma.contact.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      // Erros comuns: constraint de unique (ex: phoneE164) / tipo inválido / null em campo obrigatório
      const code = error?.code;
      if (code === 'P2002') {
        const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(',') : error?.meta?.target;
        throw new Error(`Já existe um contato com este valor em: ${target || 'campo único'}`);
      }
      throw error;
    }

    return {
      ...updated,
      tags: JSON.parse(updated.tags || '[]'),
    };
  }

  async remove(id: string) {
    return this.prisma.contact.delete({
      where: { id },
    });
  }

  async addTag(id: string, tag: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const currentTags = JSON.parse(contact.tags || '[]');
    const updatedTags = [...new Set([...currentTags, tag])];

    const updated = await this.prisma.contact.update({
      where: { id },
      data: { tags: JSON.stringify(updatedTags) },
    });

    return {
      ...updated,
      tags: JSON.parse(updated.tags || '[]'),
    };
  }

  async removeTag(id: string, tag: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const currentTags = JSON.parse(contact.tags || '[]');
    const updatedTags = currentTags.filter((t: string) => t !== tag);

    const updated = await this.prisma.contact.update({
      where: { id },
      data: { tags: JSON.stringify(updatedTags) },
    });

    return {
      ...updated,
      tags: JSON.parse(updated.tags || '[]'),
    };
  }
}