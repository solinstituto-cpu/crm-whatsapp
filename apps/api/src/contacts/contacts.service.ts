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
      whatsappAccountId: createContactDto.whatsappAccountId || null,
    };
    
    const contact = await this.prisma.contact.create({ data });
    
    // Vincular conversas órfãs com o mesmo número e conta
    await this.prisma.conversation.updateMany({
      where: {
        phoneE164: createContactDto.phoneE164,
        contactId: null,
        whatsappAccountId: createContactDto.whatsappAccountId || null,
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
      whatsappAccountId?: string;
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
      if (filters?.whatsappAccountId) {
        conditions.push({ whatsappAccountId: filters.whatsappAccountId });
      }
      
      const where = conditions.length > 0 ? { AND: conditions } : {};

      // Contar total geral (sem filtros) para estatísticas da conta específica
      const statsWhere: any = {};
      if (filters?.whatsappAccountId) {
        statsWhere.whatsappAccountId = filters.whatsappAccountId;
      }
      const totalGeral = await this.prisma.contact.count({ where: statsWhere });
      const ativos = await this.prisma.contact.count({ where: { optedOut: false, ...statsWhere } });
      const novos7d = await this.prisma.contact.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          ...statsWhere
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

  // Buscar contato pelo telefone e conta do WhatsApp
  async findByPhone(phoneE164: string, whatsappAccountId?: string) {
    return this.prisma.contact.findUnique({
      where: { 
        phoneE164_whatsappAccountId: {
          phoneE164,
          whatsappAccountId: whatsappAccountId || null,
        }
      },
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

  // ==========================================
  // ANÁLISE: CONTATOS SEM FORMAÇÃO NA SAÚDE
  // ==========================================

  async analyzeNoHealthDegree(filters?: { interest?: string; accountId?: string }) {
    this.logger.log('🔍 Iniciando análise de contatos sem formação na área da saúde...');

    // Padrões que indicam que o contato NÃO tem formação na saúde
    const NO_HEALTH_DEGREE_PATTERNS = [
      // Negações diretas sobre formação
      'não tenho formação',
      'nao tenho formacao',
      'não tenho graduação',
      'nao tenho graduacao',
      'não sou formado',
      'nao sou formado',
      'não sou formada',
      'nao sou formada',
      'não sou da área da saúde',
      'nao sou da area da saude',
      'não sou da saúde',
      'nao sou da saude',
      'não tenho curso na área',
      'nao tenho curso na area',
      'não tenho diploma',
      'nao tenho diploma',
      'sem formação na saúde',
      'sem formacao na saude',
      'sem formação na área',
      'sem formacao na area',
      'sem graduação',
      'sem graduacao',
      // Profissões fora da saúde
      'sou leigo',
      'sou leiga',
      'não sou profissional da saúde',
      'nao sou profissional da saude',
      'não sou profissional de saúde',
      'nao sou profissional de saude',
      // Educação incompleta
      'não fiz faculdade',
      'nao fiz faculdade',
      'não tenho faculdade',
      'nao tenho faculdade',
      'não tenho superior',
      'nao tenho superior',
      'não tenho ensino superior',
      'nao tenho ensino superior',
      'ensino médio',
      'ensino medio',
      'só tenho ensino médio',
      'so tenho ensino medio',
      'tenho só o ensino médio',
      // Negações sobre ser de saúde
      'minha área não é saúde',
      'minha area nao e saude',
      'não atuo na saúde',
      'nao atuo na saude',
      'não trabalho na saúde',
      'nao trabalho na saude',
      'não sou enfermeiro',
      'nao sou enfermeiro',
      'não sou enfermeira',
      'nao sou enfermeira',
      'não sou médico',
      'nao sou medico',
      'não sou médica',
      'nao sou medica',
      'não sou fisioterapeuta',
      'nao sou fisioterapeuta',
      'não sou farmacêutico',
      'nao sou farmaceutico',
      'não sou farmacêutica',
      'nao sou farmaceutica',
      // Perguntas sobre necessidade
      'precisa ter formação',
      'precisa ter formacao',
      'precisa ser formado',
      'precisa ser da saúde',
      'precisa ser da saude',
      'precisa de graduação',
      'precisa de graduacao',
      'preciso ter formação',
      'preciso ter formacao',
      'preciso ser formado',
      'preciso ser da área',
      'preciso ser da area',
      'exige formação',
      'exige formacao',
      'exige graduação',
      'exige graduacao',
      'necessário ter formação',
      'necessario ter formacao',
      'qualquer pessoa pode',
      'qualquer um pode fazer',
      'não precisa ser da saúde',
      'não precisa de formação',
      // Variações comuns em WhatsApp
      'n tenho formação',
      'n sou formado',
      'n sou da saude',
      'ñ tenho formação',
      'ñ sou formado',
    ];

    // Buscar contatos de acupuntura
    const interest = filters?.interest || 'acupuntura';
    const where: any = {};

    // Filtrar por interesse ou tags que contenham "acupuntura"
    where.OR = [
      { interest: { contains: interest, mode: 'insensitive' } },
      { tags: { contains: interest, mode: 'insensitive' } },
      { notes: { contains: interest, mode: 'insensitive' } },
    ];

    if (filters?.accountId) {
      where.whatsappAccountId = filters.accountId;
    }

    const contacts = await this.prisma.contact.findMany({
      where,
      select: {
        id: true,
        name: true,
        phoneE164: true,
        email: true,
        interest: true,
        customerStatus: true,
        tags: true,
        createdAt: true,
        conversations: {
          select: {
            id: true,
            messages: {
              where: {
                direction: 'IN', // Só mensagens do CONTATO (não do sistema)
              },
              select: {
                id: true,
                body: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    this.logger.log(`📋 Total de contatos de ${interest} encontrados: ${contacts.length}`);

    const results: any[] = [];
    let totalAnalyzed = 0;
    let totalWithNoHealthDegree = 0;

    for (const contact of contacts) {
      totalAnalyzed++;
      const matchedMessages: any[] = [];
      const matchedPatterns = new Set<string>();

      // Analisar cada conversa do contato
      for (const conversation of contact.conversations) {
        for (const message of conversation.messages) {
          if (!message.body) continue;

          const bodyLower = message.body.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const bodyOriginal = message.body.toLowerCase();

          for (const pattern of NO_HEALTH_DEGREE_PATTERNS) {
            const patternNorm = pattern.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            if (bodyLower.includes(patternNorm) || bodyOriginal.includes(pattern)) {
              matchedMessages.push({
                messageId: message.id,
                text: message.body.substring(0, 500),
                date: message.createdAt,
                pattern: pattern,
              });
              matchedPatterns.add(pattern);
              break; // Não duplicar a mesma mensagem
            }
          }
        }
      }

      if (matchedMessages.length > 0) {
        totalWithNoHealthDegree++;
        let tags: string[] = [];
        try { tags = JSON.parse(contact.tags || '[]'); } catch {}

        results.push({
          contactId: contact.id,
          name: contact.name,
          phone: contact.phoneE164,
          email: contact.email,
          interest: contact.interest,
          status: contact.customerStatus,
          tags,
          createdAt: contact.createdAt,
          totalMatchedMessages: matchedMessages.length,
          patterns: [...matchedPatterns],
          messages: matchedMessages.slice(0, 5), // Max 5 mensagens por contato
        });
      }
    }

    // Ordenar por quantidade de padrões encontrados (mais certeza primeiro)
    results.sort((a, b) => b.patterns.length - a.patterns.length || b.totalMatchedMessages - a.totalMatchedMessages);

    this.logger.log(`✅ Análise concluída: ${totalWithNoHealthDegree} contatos sem formação em saúde de ${totalAnalyzed} analisados`);

    return {
      summary: {
        totalContactsAnalyzed: totalAnalyzed,
        totalWithNoHealthDegree,
        percentage: totalAnalyzed > 0 ? ((totalWithNoHealthDegree / totalAnalyzed) * 100).toFixed(1) + '%' : '0%',
        interest,
      },
      contacts: results,
    };
  }
}