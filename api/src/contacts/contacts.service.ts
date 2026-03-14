import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    phoneE164: string;
    tags?: string[];
    assignedToId?: string;
  }) {
    return this.prisma.contact.create({
      data: {
        name: data.name,
        phoneE164: data.phoneE164,
        tags: data.tags || [],
        assignedToId: data.assignedToId,
      },
    });
  }

  async findAll(page = 1, limit = 50, search?: string, tags?: string[]) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneE164: { contains: search } },
      ];
    }
    
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { conversations: true },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      contacts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.contact.findUnique({
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
          },
        },
      },
    });
  }

  async findByPhone(phoneE164: string) {
    return this.prisma.contact.findUnique({
      where: { phoneE164 },
    });
  }

  async update(id: string, data: {
    name?: string;
    phoneE164?: string;
    tags?: string[];
    assignedToId?: string;
    optOut?: boolean;
  }) {
    const updateData: any = { ...data };
    
    if (data.optOut === true) {
      updateData.optOutAt = new Date();
    }

    return this.prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.contact.delete({
      where: { id },
    });
  }

  async addTags(id: string, tags: string[]) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: { tags: true },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const newTags = [...new Set([...contact.tags, ...tags])];

    return this.prisma.contact.update({
      where: { id },
      data: { tags: newTags },
    });
  }

  async removeTags(id: string, tags: string[]) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      select: { tags: true },
    });

    if (!contact) {
      throw new Error('Contact not found');
    }

    const newTags = contact.tags.filter(tag => !tags.includes(tag));

    return this.prisma.contact.update({
      where: { id },
      data: { tags: newTags },
    });
  }

  async importFromCSV(csvData: Array<{
    name: string;
    phoneE164: string;
    tags?: string;
  }>) {
    const results = [];
    
    for (const row of csvData) {
      try {
        // Check if contact already exists
        const existingContact = await this.findByPhone(row.phoneE164);
        
        if (existingContact) {
          results.push({
            phoneE164: row.phoneE164,
            status: 'exists',
            contact: existingContact,
          });
          continue;
        }

        // Create new contact
        const tags = row.tags ? row.tags.split(',').map(tag => tag.trim()) : [];
        const contact = await this.create({
          name: row.name,
          phoneE164: row.phoneE164,
          tags,
        });

        results.push({
          phoneE164: row.phoneE164,
          status: 'created',
          contact,
        });
      } catch (error) {
        results.push({
          phoneE164: row.phoneE164,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }
}

