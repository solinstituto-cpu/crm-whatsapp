import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { TemplateService } from '../whatsapp/template.service';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
    private readonly templateService: TemplateService,
  ) {}

  async create(data: {
    name: string;
    when: any;
    then: any;
    enabled?: boolean;
  }) {
    return this.prisma.rule.create({
      data,
    });
  }

  async findAll(page = 1, limit = 50, enabled?: boolean) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    const [rules, total] = await Promise.all([
      this.prisma.rule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rule.count({ where }),
    ]);

    return {
      rules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.rule.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: {
    name?: string;
    when?: any;
    then?: any;
    enabled?: boolean;
  }) {
    return this.prisma.rule.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.rule.delete({
      where: { id },
    });
  }

  async getEnabledRules() {
    return this.prisma.rule.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
  }

  async runRule(ruleId: string, context: any) {
    const rule = await this.findById(ruleId);
    
    if (!rule || !rule.enabled) {
      throw new Error('Rule not found or disabled');
    }

    const shouldExecute = this.evaluateCondition(rule.when, context);
    
    if (shouldExecute) {
      await this.executeAction(rule.then, context);
      this.logger.log(`Rule ${rule.name} executed successfully`);
      return { executed: true, rule: rule.name };
    }

    return { executed: false, rule: rule.name };
  }

  async runAllRules(context: any) {
    const rules = await this.getEnabledRules();
    const results = [];

    for (const rule of rules) {
      try {
        const result = await this.runRule(rule.id, context);
        results.push(result);
      } catch (error) {
        this.logger.error(`Error running rule ${rule.name}:`, error);
        results.push({
          executed: false,
          rule: rule.name,
          error: error.message,
        });
      }
    }

    return results;
  }

  private evaluateCondition(condition: any, context: any): boolean {
    // Simple condition evaluation
    // This would be more sophisticated in a real implementation
    
    if (condition.type === 'tag_added') {
      return context.tags && context.tags.includes(condition.value);
    }
    
    if (condition.type === 'message_received') {
      return context.messageType === condition.value;
    }
    
    if (condition.type === 'contact_created') {
      return context.eventType === 'contact_created';
    }
    
    if (condition.type === 'conversation_opened') {
      return context.eventType === 'conversation_opened';
    }

    return false;
  }

  private async executeAction(action: any, context: any) {
    if (action.type === 'send_template') {
      const template = await this.templateService.getTemplateByName(action.templateName);
      
      if (!template) {
        throw new Error(`Template ${action.templateName} not found`);
      }

      await this.whatsappService.sendTemplate({
        to: context.contactPhone,
        template: {
          name: template.waTemplateName || template.name,
          language: { code: template.language },
          components: this.buildTemplateComponents(template.components, action.parameters),
        },
      });
    }
    
    if (action.type === 'add_tag') {
      // Add tag to contact
      const contact = await this.prisma.contact.findUnique({
        where: { phoneE164: context.contactPhone },
      });
      
      if (contact) {
        await this.prisma.contact.update({
          where: { id: contact.id },
          data: {
            tags: [...contact.tags, action.tag],
          },
        });
      }
    }
    
    if (action.type === 'assign_to') {
      // Assign conversation to user
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          contact: { phoneE164: context.contactPhone },
          status: { in: ['OPEN', 'PENDING'] },
        },
      });
      
      if (conversation) {
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { assignedToId: action.userId },
        });
      }
    }
  }

  private buildTemplateComponents(components: any, parameters: any): any[] {
    // Build template components with parameters
    return components.map(component => {
      if (component.type === 'body' && parameters.body) {
        return {
          ...component,
          parameters: parameters.body.map((param: string) => ({
            type: 'text',
            text: param,
          })),
        };
      }
      
      if (component.type === 'header' && parameters.header) {
        return {
          ...component,
          parameters: parameters.header.map((param: string) => ({
            type: 'text',
            text: param,
          })),
        };
      }
      
      return component;
    });
  }
}

