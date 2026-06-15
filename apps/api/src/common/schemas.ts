import { z } from 'zod';

// User schemas
export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'AGENT']).default('AGENT'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Contact schemas
export const CreateContactSchema = z.object({
  name: z.string().min(1),
  phoneE164: z.string().regex(/^\+[1-9]\d{1,14}$/),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // Dados pessoais
  birthday: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  // Dados comerciais
  source: z.string().optional().nullable(),
  interest: z.string().optional().nullable(),
  customerStatus: z.string().optional().nullable(),
  enrollmentDate: z.string().optional().nullable(),
  referredBy: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  assignedToId: z.string().optional(),
  optedOut: z.boolean().optional(),
  whatsappAccountId: z.string().optional().nullable(),
  // Campos personalizados (coletados via automação)
  customFields: z.union([z.string(), z.record(z.string())]).optional().nullable(),
});

export const UpdateContactSchema = CreateContactSchema.partial();

// Message schemas
export const SendMessageSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{1,14}$/),
  type: z.enum(['text', 'image', 'document', 'audio', 'video', 'interactive', 'contacts']),
  text: z.string().optional(),
  media: z.object({
    id: z.string().optional(),
    link: z.string().url().optional(),
    caption: z.string().optional(),
    filename: z.string().optional(),
  }).optional(),
  // Contatos para compartilhar
  contacts: z.array(z.object({
    name: z.object({
      formatted_name: z.string(),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
    }),
    phones: z.array(z.object({
      phone: z.string(),
      type: z.string().optional(),
    })).optional(),
  })).optional(),
  // Mensagens interativas com botões (máximo 3 botões)
  interactive: z.object({
    type: z.enum(['button', 'list']), // button = até 3 botões, list = menu com seções
    header: z.object({
      type: z.enum(['text', 'image', 'video', 'document']).optional(),
      text: z.string().optional(),
      image: z.object({ id: z.string().optional(), link: z.string().optional() }).optional(),
    }).optional(),
    body: z.object({
      text: z.string(), // Texto principal (obrigatório)
    }),
    footer: z.object({
      text: z.string().optional(), // Texto no rodapé
    }).optional(),
    action: z.object({
      // Para type='button' - até 3 botões
      buttons: z.array(z.object({
        type: z.literal('reply'),
        reply: z.object({
          id: z.string().max(256), // ID único do botão (usado no callback)
          title: z.string().max(20), // Texto do botão (máx 20 chars)
        }),
      })).max(3).optional(),
      // Para type='list' - menu com seções
      button: z.string().max(20).optional(), // Texto do botão que abre a lista
      sections: z.array(z.object({
        title: z.string().max(24).optional(),
        rows: z.array(z.object({
          id: z.string().max(200),
          title: z.string().max(24),
          description: z.string().max(72).optional(),
        })).max(10),
      })).max(10).optional(),
    }),
  }).optional(),
  // Para responder a uma mensagem específica (quote)
  context: z.object({
    message_id: z.string(),
  }).optional(),
});

export const SendTemplateSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{1,14}$/),
  templateName: z.string().min(1),
  language: z.string().default('pt_BR'),
  bodyText: z.string().optional(),
  components: z.array(z.object({
    type: z.string(),
    parameters: z.array(z.object({
      type: z.string(),
      text: z.string(),
    })).optional(),
  })).optional(),
});

// Template schemas
export const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.string(),
  language: z.string().default('pt_BR'),
  waTemplateName: z.string().optional(),
  components: z.record(z.any()),
});

// Deal schemas
// Deal schemas
export const CreateDealSchema = z.object({
  title: z.string().min(1),
  contactId: z.string(),
  stageId: z.string(),
  amount: z.number().min(0).default(0),
  description: z.string().optional().nullable(),
  probability: z.number().min(0).max(100).default(50),
  expectedCloseDate: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
});

export const UpdateDealSchema = CreateDealSchema.partial().extend({
  lostReason: z.string().optional().nullable(),
});

// Pipeline Stage schemas
export const CreateStageSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export const UpdateStageSchema = CreateStageSchema.partial().extend({
  order: z.number().optional(),
});

// Rule schemas
export const CreateRuleSchema = z.object({
  name: z.string().min(1),
  when: z.record(z.any()),
  then: z.record(z.any()),
  enabled: z.boolean().default(true),
});

// Quick Reply schemas
export const CreateQuickReplySchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).default([]),
});

// WhatsApp Webhook schemas - Schema flexível para aceitar qualquer payload do Meta
export const WhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.any(), // Flexível para aceitar qualquer estrutura do Meta
      field: z.string(),
    })),
  })),
}).passthrough();

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type CreateContactDto = z.infer<typeof CreateContactSchema>;
export type UpdateContactDto = z.infer<typeof UpdateContactSchema>;
export type SendMessageDto = z.infer<typeof SendMessageSchema>;
export type SendTemplateDto = z.infer<typeof SendTemplateSchema>;
export type CreateTemplateDto = z.infer<typeof CreateTemplateSchema>;
export type CreateDealDto = z.infer<typeof CreateDealSchema>;
export type UpdateDealDto = z.infer<typeof UpdateDealSchema>;
export type CreateRuleDto = z.infer<typeof CreateRuleSchema>;
export type CreateQuickReplyDto = z.infer<typeof CreateQuickReplySchema>;
export type WhatsAppWebhookDto = z.infer<typeof WhatsAppWebhookSchema>;