import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

export interface CreateFlowDto {
  name: string;
  description?: string;
  trigger: 'NEW_MESSAGE' | 'KEYWORD' | 'NEW_CONTACT' | 'SCHEDULE' | 'BUTTON_CLICK';
  triggerConfig: {
    keywords?: string[];
    schedule?: string;
    buttonPayload?: string;
    cooldownHours?: number; // Anti-spam: horas entre execuções
    businessHoursOnly?: boolean; // Só executar em horário comercial
    businessHoursStart?: number; // Hora início (ex: 8)
    businessHoursEnd?: number; // Hora fim (ex: 18)
  };
}

export interface CreateFlowNodeDto {
  flowId: string;
  type: 'SEND_MESSAGE' | 'WAIT_RESPONSE' | 'CONDITION' | 'DELAY' | 'ADD_TAG' | 'MOVE_PIPELINE' | 'AI_RESPONSE' | 'AI_CHATBOT' | 'NOTIFY' | 'COLLECT_DATA' | 'INTERACTIVE_BUTTONS' | 'INTERACTIVE_LIST' | 'GOOGLE_SHEETS' | 'ASSIGN_AGENT' | 'HTTP_REQUEST' | 'UPDATE_CONTACT';
  name: string;
  position: number;
  config: {
    // SEND_MESSAGE
    messageType?: 'text' | 'template' | 'image';
    messageContent?: string;
    templateName?: string;
    mediaUrl?: string;
    
    // INTERACTIVE_BUTTONS (máximo 3 botões)
    interactiveType?: 'button' | 'list';
    headerText?: string;
    headerImage?: string; // URL da imagem do header
    bodyText?: string; // Texto principal da mensagem
    footerText?: string; // Rodapé (opcional)
    buttons?: Array<{
      id: string; // ID único do botão (para callback)
      title: string; // Texto do botão (máx 20 chars)
      nextNodeId?: string; // Próximo nó quando este botão for clicado
    }>;
    // Para type='list' - Menu com seções
    listButtonText?: string; // Texto do botão que abre a lista
    listSections?: Array<{
      title?: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
        nextNodeId?: string;
      }>;
    }>;
    
    // WAIT_RESPONSE
    timeout?: number; // minutos
    saveAs?: string; // nome da variável para salvar resposta
    
    // CONDITION
    conditions?: Array<{
      type: 'contains' | 'equals' | 'regex' | 'button_id';
      value: string;
      nextNodeId: string;
    }>;
    defaultNextNodeId?: string;
    
    // DELAY
    delayMinutes?: number;
    
    // ADD_TAG
    tagName?: string;
    
    // MOVE_PIPELINE
    stageId?: string;
    
    // AI_RESPONSE & AI_CHATBOT (melhorados)
    aiPrompt?: string;
    aiModel?: string; // gpt-4, gpt-3.5-turbo, gpt-4-turbo
    aiMaxTokens?: number;
    aiTemperature?: number; // 0.0 a 1.0
    useHistory?: boolean; // Usar histórico da conversa
    historyLimit?: number; // Quantas mensagens do histórico
    useKnowledge?: boolean; // Usar base de conhecimento
    handoffAgentId?: string; // Atendente para transferência
    defaultAgentId?: string; // Atendente padrão (AI_CHATBOT)
    
    // NOTIFY
    notifyUserId?: string;
    notifyMessage?: string;
    
    // COLLECT_DATA
    fieldName?: string;
    fieldType?: 'text' | 'email' | 'phone' | 'number' | 'choice';
    choices?: string[];
    required?: boolean;
    
    // ASSIGN_AGENT
    agentId?: string; // ID do atendente a ser atribuído
    notifyAgent?: boolean; // Notificar o atendente?
    
    // HTTP_REQUEST (novo)
    httpUrl?: string;
    httpMethod?: 'GET' | 'POST' | 'PUT';
    httpHeaders?: Record<string, string>;
    httpBody?: string;
    saveResponseAs?: string;
    
    // UPDATE_CONTACT (novo)
    updateFields?: Array<{
      field: string;
      value: string;
    }>;
  };
  nextNodeId?: string;
}

@Injectable()
export class FlowsService {
  private readonly logger = new Logger(FlowsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {}

  // ==========================================
  // CRUD DE FLUXOS
  // ==========================================

  async createFlow(dto: CreateFlowDto) {
    return this.prisma.flow.create({
      data: {
        name: dto.name,
        description: dto.description,
        trigger: dto.trigger,
        triggerConfig: JSON.stringify(dto.triggerConfig),
      },
    });
  }

  async getAllFlows() {
    return this.prisma.flow.findMany({
      include: {
        nodes: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFlowById(id: string) {
    return this.prisma.flow.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async updateFlow(id: string, data: Partial<CreateFlowDto>) {
    return this.prisma.flow.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        triggerConfig: data.triggerConfig ? JSON.stringify(data.triggerConfig) : undefined,
      },
    });
  }

  async deleteFlow(id: string) {
    return this.prisma.flow.delete({
      where: { id },
    });
  }

  async toggleFlow(id: string) {
    const flow = await this.prisma.flow.findUnique({ where: { id } });
    return this.prisma.flow.update({
      where: { id },
      data: { isActive: !flow.isActive },
    });
  }

  // ==========================================
  // CRUD DE NÓS
  // ==========================================

  async addNode(dto: CreateFlowNodeDto) {
    return this.prisma.flowNode.create({
      data: {
        flowId: dto.flowId,
        type: dto.type,
        name: dto.name,
        position: dto.position,
        config: JSON.stringify(dto.config),
        nextNodeId: dto.nextNodeId,
      },
    });
  }

  async updateNode(id: string, dto: Partial<CreateFlowNodeDto>) {
    return this.prisma.flowNode.update({
      where: { id },
      data: {
        type: dto.type,
        name: dto.name,
        position: dto.position,
        config: dto.config ? JSON.stringify(dto.config) : undefined,
        nextNodeId: dto.nextNodeId,
      },
    });
  }

  async deleteNode(id: string) {
    return this.prisma.flowNode.delete({
      where: { id },
    });
  }

  async reorderNodes(flowId: string, nodeIds: string[]) {
    const updates = nodeIds.map((id, index) =>
      this.prisma.flowNode.update({
        where: { id },
        data: { position: index },
      })
    );
    return this.prisma.$transaction(updates);
  }

  // ==========================================
  // GERENCIAMENTO DE SESSÕES
  // ==========================================

  /**
   * Lista todas as sessões ativas
   */
  async getActiveSessions() {
    return this.prisma.flowSession.findMany({
      where: { status: 'ACTIVE' },
      include: {
        flow: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancela uma sessão específica
   */
  async cancelSession(sessionId: string) {
    return this.prisma.flowSession.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Cancela todas as sessões ativas de um contato
   */
  async cancelContactSessions(phoneE164: string) {
    const result = await this.prisma.flowSession.updateMany({
      where: {
        contactId: phoneE164,
        status: 'ACTIVE',
      },
      data: { status: 'CANCELLED' },
    });
    this.logger.log(`🚫 Cancelled ${result.count} active sessions for ${phoneE164}`);
    return { cancelled: result.count };
  }

  /**
   * Cancela todas as sessões ativas
   */
  async cancelAllSessions() {
    const result = await this.prisma.flowSession.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });
    this.logger.log(`🚫 Cancelled all ${result.count} active sessions`);
    return { cancelled: result.count };
  }

  // ==========================================
  // PROCESSAMENTO DE FLUXOS
  // ==========================================

  /**
   * Substitui variáveis na mensagem
   * Ex: {nome_cliente} -> valor salvo na sessão
   */
  async replaceVariables(text: string, session: any, contact: any): Promise<string> {
    if (!text) return text;
    
    let result = text;
    
    // Dados do contato
    if (contact) {
      result = result.replace(/\{nome\}/gi, contact.name || 'Cliente');
      result = result.replace(/\{nome_cliente\}/gi, contact.name || 'Cliente');
      result = result.replace(/\{telefone\}/gi, contact.phoneE164 || '');
      result = result.replace(/\{email\}/gi, contact.email || '');
      result = result.replace(/\{empresa\}/gi, contact.company || '');
    }
    
    // Data e hora
    const now = new Date();
    result = result.replace(/\{data\}/gi, now.toLocaleDateString('pt-BR'));
    result = result.replace(/\{hora\}/gi, now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    result = result.replace(/\{data_hora\}/gi, now.toLocaleString('pt-BR'));
    
    // Saudação por horário
    const hour = now.getHours();
    let saudacao = 'Olá';
    if (hour >= 5 && hour < 12) saudacao = 'Bom dia';
    else if (hour >= 12 && hour < 18) saudacao = 'Boa tarde';
    else saudacao = 'Boa noite';
    result = result.replace(/\{saudacao\}/gi, saudacao);
    
    // Dados coletados na sessão
    if (session?.collectedData) {
      const data = typeof session.collectedData === 'string' 
        ? JSON.parse(session.collectedData) 
        : session.collectedData;
      
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`\\{${key}\\}`, 'gi');
        result = result.replace(regex, String(value) || '');
      }
    }
    
    return result;
  }

  /**
   * Verifica se está dentro do horário comercial
   */
  isBusinessHours(startHour: number = 8, endHour: number = 18): boolean {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = domingo, 6 = sábado
    
    // Fora do expediente (segunda a sexta)
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    
    return hour >= startHour && hour < endHour;
  }

  /**
   * Verifica cooldown anti-spam
   */
  async checkCooldown(flowId: string, contactId: string, cooldownHours: number): Promise<boolean> {
    if (!cooldownHours || cooldownHours <= 0) return true; // Sem cooldown configurado
    
    const lastSession = await this.prisma.flowSession.findFirst({
      where: {
        flowId,
        contactId,
        status: { in: ['COMPLETED', 'EXPIRED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!lastSession) return true; // Primeira execução
    
    const hoursSince = (Date.now() - lastSession.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSince >= cooldownHours;
  }

  async findFlowForMessage(phoneE164: string, messageBody: string): Promise<any | null> {
    this.logger.log(`🔍 findFlowForMessage: phone=${phoneE164}, message="${messageBody}"`);
    
    // Verificar se já está em um fluxo ativo
    const activeSession = await this.prisma.flowSession.findFirst({
      where: {
        contactId: phoneE164,
        status: 'ACTIVE',
      },
      include: {
        flow: {
          include: {
            nodes: { orderBy: { position: 'asc' } },
          },
        },
      },
    });

    if (activeSession) {
      this.logger.log(`📌 Found active session: ${activeSession.id} for flow "${activeSession.flow.name}"`);
      return { type: 'CONTINUE', session: activeSession };
    }

    // Buscar fluxo por keyword - ordenar por nome para consistência
    const keywordFlows = await this.prisma.flow.findMany({
      where: {
        isActive: true,
        trigger: 'KEYWORD',
      },
      include: {
        nodes: { orderBy: { position: 'asc' } },
      },
      orderBy: [
        { name: 'asc' }, // Ordenar alfabeticamente para previsibilidade
      ],
    });

    this.logger.log(`🔑 Found ${keywordFlows.length} active KEYWORD flows`);
    
    // Variável para armazenar motivos de rejeição
    const rejectionReasons: { flowName: string; reason: string }[] = [];

    for (const flow of keywordFlows) {
      const config = JSON.parse(flow.triggerConfig || '{}');
      const keywords = config.keywords || [];
      const messageL = messageBody.toLowerCase().trim();
      const matchMode = config.keywordMatchMode || 'contains'; // 'contains' ou 'exact'
      
      this.logger.log(`  📋 Checking flow "${flow.name}" with keywords: [${keywords.join(', ')}] (mode: ${matchMode})`);
      
      // Verificar keyword baseado no modo
      let keywordMatch = false;
      
      if (matchMode === 'exact') {
        // Match exato: a mensagem inteira deve ser igual à keyword
        keywordMatch = keywords.some((kw: string) => messageL === kw.toLowerCase().trim());
      } else {
        // Match "contém": a mensagem contém a keyword como palavra completa
        // Usar word boundary para evitar matches parciais como "Sim" em "Simone"
        keywordMatch = keywords.some((kw: string) => {
          const kwLower = kw.toLowerCase().trim();
          // Se a keyword tem várias palavras, verificar se está contida como frase
          if (kwLower.includes(' ')) {
            return messageL.includes(kwLower);
          }
          // Se é uma palavra única, usar regex com word boundary
          const regex = new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return regex.test(messageL);
        });
      }
      
      if (!keywordMatch) {
        this.logger.log(`    ❌ No keyword match for "${messageBody}"`);
        continue;
      }
      
      this.logger.log(`    ✅ Keyword matched!`);
      
      // Verificar horário comercial (se configurado)
      if (config.businessHoursOnly) {
        const startHour = config.businessHoursStart || 8;
        const endHour = config.businessHoursEnd || 18;
        if (!this.isBusinessHours(startHour, endHour)) {
          this.logger.log(`    ⏰ Flow ${flow.name} skipped: outside business hours`);
          continue;
        }
      }
      
      // Verificar cooldown anti-spam
      const cooldownHours = config.cooldownHours || 0;
      const canRun = await this.checkCooldown(flow.id, phoneE164, cooldownHours);
      if (!canRun) {
        this.logger.log(`    ⏳ Flow ${flow.name} skipped: cooldown not expired for ${phoneE164}`);
        continue;
      }
      
      this.logger.log(`    🚀 Starting flow "${flow.name}"`);
      return { type: 'START', flow };
    }
    
    // Log resumo dos fluxos KEYWORD rejeitados
    if (keywordFlows.length > 0) {
      this.logger.log(`📊 Nenhum fluxo KEYWORD iniciado - verificando NEW_MESSAGE como fallback`);
    }

    // Buscar fluxo por NEW_MESSAGE (fallback) - ordenar por nome
    const newMessageFlows = await this.prisma.flow.findMany({
      where: {
        isActive: true,
        trigger: 'NEW_MESSAGE',
      },
      include: {
        nodes: { orderBy: { position: 'asc' } },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    this.logger.log(`📨 Found ${newMessageFlows.length} active NEW_MESSAGE flows`);

    for (const flow of newMessageFlows) {
      const config = JSON.parse(flow.triggerConfig || '{}');
      
      // Verificar horário comercial
      if (config.businessHoursOnly) {
        const startHour = config.businessHoursStart || 8;
        const endHour = config.businessHoursEnd || 18;
        if (!this.isBusinessHours(startHour, endHour)) {
          this.logger.log(`  ⏰ Flow "${flow.name}" skipped: outside business hours`);
          continue;
        }
      }
      
      // Verificar cooldown
      const cooldownHours = config.cooldownHours ?? 24; // Padrão 24h para NEW_MESSAGE
      const canRun = await this.checkCooldown(flow.id, phoneE164, cooldownHours);
      if (!canRun) {
        this.logger.log(`  ⏳ Flow "${flow.name}" skipped: cooldown not expired`);
        continue;
      }
      
      this.logger.log(`  🚀 Starting NEW_MESSAGE flow "${flow.name}"`);
      return { type: 'START', flow };
    }

    this.logger.log(`❌ No matching flow found for message`);
    return null;
  }

  async startFlowSession(flowId: string, contactId: string) {
    const flow = await this.getFlowById(flowId);
    if (!flow || flow.nodes.length === 0) return null;

    const firstNode = flow.nodes[0];

    const session = await this.prisma.flowSession.create({
      data: {
        flowId,
        contactId,
        currentNodeId: firstNode.id,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
      },
    });

    // Incrementar contador de execução
    await this.prisma.flow.update({
      where: { id: flowId },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    return { session, firstNode };
  }

  async processNode(session: any, node: any, userMessage?: string, contact?: any): Promise<any> {
    const config = JSON.parse(node.config);
    // LOG: tipo do nó e config
    this.logger?.log?.(`[processNode] nodeType=${node.type} nodeId=${node.id} config=${JSON.stringify(config)}`);

    switch (node.type) {
      case 'SEND_MESSAGE': {
        // Suporte a envio de template
        if (config.messageType === 'template' && config.templateName) {
          this.logger.log(`[SEND_MESSAGE] Sending template: ${config.templateName}, params=${JSON.stringify(config.templateParams)}, mediaUrl=${config.mediaUrl}, mediaId=${config.mediaId}`);
          return {
            action: 'SEND',
            messageType: 'template',
            templateName: config.templateName,
            templateParams: config.templateParams || [],
            content: config.templateParams ? JSON.stringify(config.templateParams) : undefined,
            mediaUrl: config.mediaUrl,
            mediaId: config.mediaId,
            nextNodeId: node.nextNodeId,
          };
        }
        // Suporte a envio de imagem
        if (config.messageType === 'image') {
          const caption = await this.replaceVariables(config.imageCaption || '', session, contact);
          return {
            action: 'SEND',
            messageType: 'image',
            content: caption,
            mediaUrl: config.mediaUrl,
            mediaId: config.mediaId,
            nextNodeId: node.nextNodeId,
          };
        }
        // Texto normal
        const messageContent = await this.replaceVariables(config.messageContent || '', session, contact);
        this.logger.log(`[SEND_MESSAGE] Sending text: "${messageContent?.substring(0, 50)}..."`);
        
        if (!messageContent || messageContent.trim() === '') {
          this.logger.warn(`[SEND_MESSAGE] Empty message content, skipping send`);
          return {
            action: 'GOTO',
            nextNodeId: node.nextNodeId,
          };
        }
        
        return {
          action: 'SEND',
          messageType: config.messageType || 'text',
          content: messageContent,
          templateName: config.templateName,
          nextNodeId: node.nextNodeId,
        };
      }
      case 'WAIT_RESPONSE': {
        await this.prisma.flowSession.update({
          where: { id: session.id },
          data: {
            currentNodeId: node.id,
            lastActivityAt: new Date(),
          },
        });
        return {
          action: 'WAIT',
          saveAs: config.saveAs,
          timeout: config.timeout,
        };
      }
      case 'CONDITION': {
        // Obter a mensagem para avaliar - pode ser userMessage atual ou a última resposta salva na sessão
        let messageToEvaluate = userMessage;
        
        // Se não tem mensagem atual, tentar usar última resposta coletada da sessão
        if (!messageToEvaluate && session?.collectedData) {
          try {
            const collectedData = JSON.parse(session.collectedData);
            // Pegar o último valor coletado (mais recente)
            const values = Object.values(collectedData);
            if (values.length > 0) {
              messageToEvaluate = String(values[values.length - 1]);
              this.logger?.log?.(`[CONDITION] Using last collected data as message: "${messageToEvaluate}"`);
            }
          } catch (e) {}
        }
        
        if (!messageToEvaluate) {
          this.logger?.log?.(`[CONDITION] No message to evaluate, going to default`);
          return {
            action: 'GOTO',
            nextNodeId: config.defaultNextNodeId || node.nextNodeId || null,
            matched: false,
          };
        }
        
        const msgL = messageToEvaluate.toLowerCase();
        // Verificar condições múltiplas (config.conditions)
        const conditions = config.conditions || [];
        for (const cond of conditions) {
          let matches = false;
          const valL = (cond.value || '').toLowerCase();
          switch (cond.type) {
            case 'contains':
              matches = msgL.includes(valL);
              break;
            case 'equals':
              matches = msgL === valL;
              break;
            case 'regex':
              try {
                matches = new RegExp(cond.value, 'i').test(messageToEvaluate);
              } catch (e) {
                this.logger?.error?.(`[CONDITION] Invalid regex: ${cond.value}`);
              }
              break;
            case 'button_id':
              matches = messageToEvaluate === cond.value;
              break;
          }
          if (matches) {
            this.logger?.log?.(`[CONDITION] Matched: ${cond.type}="${cond.value}" → nextNodeId=${cond.nextNodeId}`);
            return {
              action: 'GOTO',
              nextNodeId: cond.nextNodeId || null,
              matched: true,
            };
          }
        }
        // Se não bateu nenhuma condição, vai para defaultNextNodeId ou encerra
        this.logger?.log?.(`[CONDITION] No match for "${messageToEvaluate}". Going to defaultNextNodeId=${config.defaultNextNodeId || node.nextNodeId}`);
        return {
          action: 'GOTO',
          nextNodeId: config.defaultNextNodeId || node.nextNodeId || null,
          matched: false,
        };
      }
      case 'DELAY': {
        return {
          action: 'DELAY',
          delayMinutes: config.delayMinutes,
          nextNodeId: node.nextNodeId,
        };
      }
      case 'ADD_TAG': {
        return {
          action: 'TAG',
          tagName: config.tagName,
          nextNodeId: node.nextNodeId,
        };
      }
      case 'AI_RESPONSE': {
        const aiPrompt = await this.replaceVariables(config.aiPrompt, session, contact);
        const useHistory = config.useHistory !== false; // Default true
        const useKnowledge = config.useKnowledge !== false; // Default true
        
        const { response: aiResponse, needsHandoff } = await this.generateAIResponseAdvanced(
          aiPrompt,
          userMessage || '',
          session.contactId,
          {
            model: config.aiModel || 'gpt-3.5-turbo',
            maxTokens: config.aiMaxTokens || 500,
            temperature: config.aiTemperature || 0.7,
            useHistory,
            historyLimit: config.historyLimit || 10,
            useKnowledge,
          }
        );
        
        // Se precisa transferência, marcar sessão e notificar
        if (needsHandoff && config.handoffAgentId) {
          // Atribuir conversa ao atendente
          const conversation = await this.prisma.conversation.findFirst({
            where: {
              OR: [
                { contact: { phoneE164: session.contactId } },
                { phoneE164: session.contactId }
              ]
            }
          });
          
          if (conversation) {
            await this.prisma.conversation.update({
              where: { id: conversation.id },
              data: { assignedToId: config.handoffAgentId }
            });
            this.logger.log(`🔀 AI handoff: conversation assigned to ${config.handoffAgentId}`);
          }
          
          // Finalizar o fluxo
          await this.advanceSession(session.id, null);
          return {
            action: 'SEND',
            messageType: 'text',
            content: aiResponse,
            nextNodeId: null, // Finaliza o fluxo
          };
        }
        
        return {
          action: 'SEND',
          messageType: 'text',
          content: aiResponse,
          nextNodeId: node.nextNodeId,
        };
      }
      
      case 'AI_CHATBOT': {
        // Chatbot contínuo - mantém conversa até transferência ou timeout
        const aiPrompt = await this.replaceVariables(config.aiPrompt, session, contact);
        
        const { response: aiResponse, needsHandoff } = await this.generateAIResponseAdvanced(
          aiPrompt,
          userMessage || '',
          session.contactId,
          {
            model: config.aiModel || 'gpt-3.5-turbo',
            maxTokens: config.aiMaxTokens || 500,
            temperature: config.aiTemperature || 0.7,
            useHistory: true,
            historyLimit: config.historyLimit || 15,
            useKnowledge: config.useKnowledge !== false,
          }
        );
        
        // Se detectou pedido de transferência
        if (needsHandoff) {
          // Atribuir conversa ao atendente configurado ou ao padrão
          const agentId = config.handoffAgentId || config.defaultAgentId;
          if (agentId) {
            const conversation = await this.prisma.conversation.findFirst({
              where: {
                OR: [
                  { contact: { phoneE164: session.contactId } },
                  { phoneE164: session.contactId }
                ]
              }
            });
            
            if (conversation) {
              await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { assignedToId: agentId }
              });
              this.logger.log(`🔀 AI Chatbot handoff: conversation assigned to ${agentId}`);
            }
          }
          
          // Finalizar sessão do chatbot
          await this.advanceSession(session.id, null);
          return {
            action: 'SEND',
            messageType: 'text',
            content: aiResponse,
            nextNodeId: null,
          };
        }
        
        // Continuar no chatbot - não avança para próximo nó
        // Volta para o mesmo nó para continuar a conversa
        return {
          action: 'SEND',
          messageType: 'text',
          content: aiResponse,
          waitForResponse: true, // Aguarda próxima mensagem
          nextNodeId: node.id, // Fica no mesmo nó (loop)
        };
      }
      case 'COLLECT_DATA': {
        if (!userMessage) {
          // Enviar a pergunta e aguardar resposta
          const question = await this.replaceVariables(config.fieldName, session, contact);
          this.logger.log(`[COLLECT_DATA] Sending question: "${question}", saveAs: ${config.saveAs}`);
          return {
            action: 'SEND',
            messageType: 'text',
            content: question,
            waitForResponse: true,
            saveAs: config.saveAs,
            nextNodeId: node.nextNodeId,
          };
        }
        // Resposta recebida - salvar na sessão E no contato
        if (userMessage && config.saveAs) {
          this.logger.log(`[COLLECT_DATA] Saving response: ${config.saveAs} = "${userMessage}"`);
          
          // Salvar na sessão
          const currentData = session.collectedData ? JSON.parse(session.collectedData) : {};
          currentData[config.saveAs] = userMessage;
          await this.prisma.flowSession.update({
            where: { id: session.id },
            data: { collectedData: JSON.stringify(currentData) },
          });
          
          // Salvar também no contato (customFields)
          if (contact) {
            const contactCustomFields = contact.customFields ? JSON.parse(contact.customFields) : {};
            contactCustomFields[config.saveAs] = userMessage;
            await this.prisma.contact.update({
              where: { id: contact.id },
              data: { customFields: JSON.stringify(contactCustomFields) },
            });
            this.logger.log(`[COLLECT_DATA] Saved to contact customFields: ${config.saveAs} = "${userMessage}"`);
          } else {
            // Buscar contato pelo telefone da sessão
            const sessionContact = await this.prisma.contact.findFirst({
              where: { phoneE164: session.contactId },
            });
            if (sessionContact) {
              const contactCustomFields = sessionContact.customFields ? JSON.parse(sessionContact.customFields) : {};
              contactCustomFields[config.saveAs] = userMessage;
              await this.prisma.contact.update({
                where: { id: sessionContact.id },
                data: { customFields: JSON.stringify(contactCustomFields) },
              });
              this.logger.log(`[COLLECT_DATA] Saved to contact customFields (by phone): ${config.saveAs} = "${userMessage}"`);
            }
          }
        }
        return {
          action: 'GOTO',
          nextNodeId: node.nextNodeId,
        };
      }
      case 'INTERACTIVE_BUTTONS': {
        // Mensagem interativa com botões clicáveis
        const bodyText = await this.replaceVariables(config.bodyText || '', session, contact);
        const footerText = config.footerText ? await this.replaceVariables(config.footerText, session, contact) : undefined;
        const headerText = config.headerText ? await this.replaceVariables(config.headerText, session, contact) : undefined;
        
        if (config.interactiveType === 'list' && config.listSections) {
          // Lista com seções
          return {
            action: 'SEND',
            messageType: 'interactive',
            interactiveType: 'list',
            headerText,
            bodyText,
            footerText,
            listButtonText: config.listButtonText || 'Ver opções',
            listSections: config.listSections,
            nextNodeId: null, // Aguarda resposta do botão
            waitForButtonClick: true,
          };
        } else {
          // Botões simples (máximo 3)
          const buttons = (config.buttons || []).slice(0, 3).map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title.substring(0, 20), // Máximo 20 caracteres
            },
          }));
          
          return {
            action: 'SEND',
            messageType: 'interactive',
            interactiveType: 'button',
            headerText,
            bodyText,
            footerText,
            buttons,
            buttonConfig: config.buttons, // Config original para mapear nextNodeId
            nextNodeId: null, // Aguarda resposta do botão
            waitForButtonClick: true,
          };
        }
      }
      case 'NOTIFY': {
        const notifyMessage = await this.replaceVariables(config.notifyMessage, session, contact);
        return {
          action: 'NOTIFY',
          userId: config.notifyUserId,
          message: notifyMessage,
          nextNodeId: node.nextNodeId,
        };
      }
      case 'INTERACTIVE_LIST': {
        // Lista interativa com seções (mais de 3 opções)
        const bodyText = await this.replaceVariables(config.bodyText || '', session, contact);
        const footerText = config.footerText ? await this.replaceVariables(config.footerText, session, contact) : undefined;
        const headerText = config.headerText ? await this.replaceVariables(config.headerText, session, contact) : undefined;
        
        return {
          action: 'SEND',
          messageType: 'interactive',
          interactiveType: 'list',
          headerText,
          bodyText,
          footerText,
          listButtonText: config.listButtonText || 'Ver opções',
          listSections: config.listSections,
          nextNodeId: null,
          waitForButtonClick: true,
        };
      }
      case 'GOOGLE_SHEETS': {
        // Enviar dados para Google Sheets
        try {
          const result = await this.sendToGoogleSheets(config, session, contact);
          this.logger.log(`✅ Google Sheets: ${result.message}`);
        } catch (error) {
          this.logger.error(`❌ Google Sheets error: ${error.message}`);
        }
        return {
          action: 'GOTO',
          nextNodeId: node.nextNodeId,
        };
      }
      case 'ASSIGN_AGENT': {
        // Atribuir conversa a um atendente específico
        const agentId = config.agentId;
        
        if (!agentId) {
          this.logger.warn(`[ASSIGN_AGENT] Nenhum atendente configurado`);
          return {
            action: 'GOTO',
            nextNodeId: node.nextNodeId,
          };
        }
        
        // Buscar a conversa da sessão
        const conversation = await this.prisma.conversation.findFirst({
          where: { phoneE164: session.phoneE164 },
          orderBy: { createdAt: 'desc' },
        });
        
        if (conversation) {
          // Atribuir o atendente à conversa
          await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              assignedToId: agentId,
              assignedAt: new Date(),
            },
          });
          
          // Buscar dados do atendente para log
          const agent = await this.prisma.user.findUnique({
            where: { id: agentId },
            select: { name: true, email: true },
          });
          
          this.logger.log(`✅ [ASSIGN_AGENT] Conversa ${conversation.id} atribuída a ${agent?.name || agentId}`);
          
          // Se configurado para notificar o atendente
          if (config.notifyAgent && config.notifyMessage) {
            const notifyMessage = await this.replaceVariables(config.notifyMessage, session, contact);
            this.logger.log(`📧 [ASSIGN_AGENT] Notificação para ${agent?.name}: ${notifyMessage}`);
            // Aqui você pode integrar com sistema de notificações (email, push, etc)
          }
        } else {
          this.logger.warn(`[ASSIGN_AGENT] Conversa não encontrada para ${session.phoneE164}`);
        }
        
        return {
          action: 'GOTO',
          nextNodeId: node.nextNodeId,
        };
      }
      
      case 'HTTP_REQUEST': {
        // Fazer requisição HTTP para API externa
        const url = await this.replaceVariables(config.httpUrl || '', session, contact);
        const method = config.httpMethod || 'POST';
        let body = null;
        
        if (method !== 'GET' && config.httpBody) {
          const bodyStr = await this.replaceVariables(config.httpBody, session, contact);
          try {
            body = JSON.parse(bodyStr);
          } catch {
            body = bodyStr;
          }
        }
        
        try {
          this.logger.log(`🌐 [HTTP_REQUEST] ${method} ${url}`);
          
          const response = await axios({
            method: method.toLowerCase(),
            url,
            data: body,
            headers: {
              'Content-Type': 'application/json',
              ...(config.httpHeaders || {})
            },
            timeout: 10000, // 10 segundos
          });
          
          this.logger.log(`✅ [HTTP_REQUEST] Response status: ${response.status}`);
          
          // Salvar resposta se configurado
          if (config.saveResponseAs && contact) {
            const customFields = contact.customFields ? JSON.parse(contact.customFields) : {};
            customFields[config.saveResponseAs] = JSON.stringify(response.data);
            await this.prisma.contact.update({
              where: { id: contact.id },
              data: { customFields: JSON.stringify(customFields) },
            });
            this.logger.log(`💾 [HTTP_REQUEST] Response saved as ${config.saveResponseAs}`);
          }
        } catch (error) {
          this.logger.error(`❌ [HTTP_REQUEST] Error: ${error.message}`);
        }
        
        return {
          action: 'GOTO',
          nextNodeId: node.nextNodeId,
        };
      }
      
      case 'UPDATE_CONTACT': {
        // Atualizar campos do contato
        const updateFields = config.updateFields || [];
        
        if (!contact && session.contactId) {
          // Buscar contato se não foi passado
          contact = await this.prisma.contact.findFirst({
            where: { phoneE164: session.contactId },
          });
        }
        
        if (!contact) {
          this.logger.warn(`[UPDATE_CONTACT] Contato não encontrado`);
          return {
            action: 'GOTO',
            nextNodeId: node.nextNodeId,
          };
        }
        
        const updateData: any = {};
        
        for (const field of updateFields) {
          if (field.field && field.value) {
            const value = await this.replaceVariables(field.value, session, contact);
            
            // Campos diretos do contato
            if (['name', 'email', 'company', 'city', 'state', 'source', 'interest', 'customerStatus', 'notes'].includes(field.field)) {
              updateData[field.field] = value;
            }
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          await this.prisma.contact.update({
            where: { id: contact.id },
            data: updateData,
          });
          this.logger.log(`✅ [UPDATE_CONTACT] Updated fields: ${Object.keys(updateData).join(', ')}`);
        }
        
        return {
          action: 'GOTO',
          nextNodeId: node.nextNodeId,
        };
      }
      
      default: {
        this.logger?.log?.(`[processNode] Default action. nodeId=${node.id} nextNodeId=${node.nextNodeId}`);
        return {
          action: 'GOTO',
          nextNodeId: node.nextNodeId || null,
        };
      }
    }
  }

  async advanceSession(sessionId: string, nextNodeId: string | null) {
    if (!nextNodeId) {
      // Fluxo concluído
      return this.prisma.flowSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          currentNodeId: null,
        },
      });
    }

    return this.prisma.flowSession.update({
      where: { id: sessionId },
      data: {
        currentNodeId: nextNodeId,
        lastActivityAt: new Date(),
      },
    });
  }

  // ==========================================
  // INTEGRAÇÃO COM IA (ChatGPT) - VERSÃO AVANÇADA
  // ==========================================

  /**
   * Busca histórico de mensagens da conversa para contexto
   */
  async getConversationHistory(phoneE164: string, limit: number = 10, supportsVision: boolean = false): Promise<Array<{role: 'user' | 'assistant', content: any}>> {
    try {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          OR: [
            { contact: { phoneE164 } },
            { phoneE164 }
          ]
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: limit,
          }
        }
      });

      if (!conversation?.messages) return [];

      // Converter mensagens para formato OpenAI (ordem cronológica)
      return conversation.messages
        .reverse()
        .map(msg => {
          const role = msg.direction === 'OUT' ? 'assistant' as const : 'user' as const;
          let content: any = msg.body || '';

          if (msg.type === 'template' && msg.json) {
            try {
              const parsed = JSON.parse(msg.json);
              const bodyComponent = parsed.components?.find((c: any) => c.type === 'body');
              if (bodyComponent && bodyComponent.parameters) {
                let hydratedContent = typeof content === 'string' ? content : '';
                bodyComponent.parameters.forEach((p: any, idx: number) => {
                  if (p.type === 'text') {
                    if (hydratedContent.includes(`{{${idx + 1}}}`)) {
                      hydratedContent = hydratedContent.replace(`{{${idx + 1}}}`, p.text);
                    } else {
                      hydratedContent += `\n[Oferta/Campanha: ${p.text}]`;
                    }
                  }
                });
                content = hydratedContent;
              }
            } catch (e) {}
          }
          if (supportsVision) {
            try {
              if (msg.json) {
                const parsed = JSON.parse(msg.json);
                const mediaUrl = parsed.mediaUrl;
                if (mediaUrl && (parsed.type === 'image' || msg.type === 'image' || mediaUrl.includes('media'))) {
                  const baseUrl = process.env.API_URL || 'https://crm-api-laxv.onrender.com';
                  const absoluteMediaUrl = mediaUrl.startsWith('http') ? mediaUrl : `${baseUrl}${mediaUrl}`;
                  
                  content = [
                    { type: "text", text: msg.body || "Imagem recebida do usuário" },
                    { type: "image_url", image_url: { url: absoluteMediaUrl } }
                  ];
                }
              }
            } catch (e) {}
          }

          return { role, content };
        })
        .filter(msg => {
          if (Array.isArray(msg.content)) return true;
          return msg.content.length > 0;
        });
    } catch (error) {
      this.logger.error(`Error fetching conversation history: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca conhecimento relevante da base
   */
  async getRelevantKnowledge(query: string, maxItems: number = 3): Promise<string> {
    try {
      const allKnowledge = await this.prisma.knowledgeBase.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' }
      });

      if (allKnowledge.length === 0) return '';

      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/);

      // Calcular score de relevância para cada item
      const scored = allKnowledge.map(item => {
        let score = 0;
        const contentLower = item.content.toLowerCase();
        const titleLower = item.title.toLowerCase();
        const keywords = (item.keywords || '').toLowerCase().split(',').map(k => k.trim());

        // Pontuação por keywords
        for (const kw of keywords) {
          if (kw && queryLower.includes(kw)) score += 10;
        }

        // Pontuação por título
        for (const word of queryWords) {
          if (word.length > 2 && titleLower.includes(word)) score += 5;
        }

        // Pontuação por conteúdo
        for (const word of queryWords) {
          if (word.length > 2 && contentLower.includes(word)) score += 2;
        }

        // Adicionar prioridade base
        score += item.priority;

        return { item, score };
      });

      // Filtrar e ordenar por relevância
      const relevant = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxItems);

      if (relevant.length === 0) return '';

      // Formatar conhecimento para o prompt
      return relevant
        .map(r => `[${r.item.title}]\n${r.item.content}`)
        .join('\n\n');
    } catch (error) {
      this.logger.error(`Error fetching knowledge: ${error.message}`);
      return '';
    }
  }

  /**
   * Detecta se o usuário quer falar com humano
   */
  detectHumanHandoff(message: string): boolean {
    const handoffKeywords = [
      'falar com humano', 'atendente', 'pessoa real', 'falar com alguém',
      'quero falar', 'transferir', 'atendimento humano', 'pessoa de verdade',
      'não é robô', 'ser humano', 'atendimento pessoal', 'falar com uma pessoa'
    ];
    const msgLower = message.toLowerCase();
    return handoffKeywords.some(kw => msgLower.includes(kw));
  }

  /**
   * Gera resposta da IA com contexto completo (histórico + conhecimento)
   */
  async generateAIResponseAdvanced(
    systemPrompt: string,
    userMessage: string,
    phoneE164: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      useHistory?: boolean;
      historyLimit?: number;
      useKnowledge?: boolean;
    } = {}
  ): Promise<{ response: string; needsHandoff: boolean }> {
    // Detectar pedido de transferência
    if (this.detectHumanHandoff(userMessage)) {
      return {
        response: 'Entendi! Vou transferir você para um de nossos atendentes. Aguarde um momento que em breve alguém irá te atender. 😊',
        needsHandoff: true
      };
    }

    // Buscar configuração do OpenAI do banco de dados
    const openAIConfig = await this.settingsService.getOpenAIConfig();
    
    const finalModel = options.model || openAIConfig.model || 'gpt-3.5-turbo';
    const finalMaxTokens = options.maxTokens || openAIConfig.maxTokens || 500;
    const finalTemperature = options.temperature ?? openAIConfig.temperature ?? 0.7;
    const useHistory = options.useHistory !== false;
    const historyLimit = options.historyLimit || 10;
    const useKnowledge = options.useKnowledge !== false;
    
    // Verificar se o modelo suporta visão
    const supportsVision = ['gpt-4o', 'gpt-4-vision', 'gpt-4-turbo'].some(m => finalModel.toLowerCase().includes(m));

    if (!openAIConfig.apiKey) {
      this.logger.warn('OpenAI API key not configured');
      return {
        response: 'Desculpe, o assistente de IA não está configurado no momento. Configure a API Key em Configurações > Integrações.',
        needsHandoff: false
      };
    }

    try {
      // Construir mensagens com contexto
      const messages: Array<{role: 'system' | 'user' | 'assistant', content: any}> = [];

      // 1. System prompt base
      let enhancedSystemPrompt = systemPrompt;

      // 2. Adicionar conhecimento relevante
      if (useKnowledge) {
        const knowledge = await this.getRelevantKnowledge(userMessage);
        if (knowledge) {
          enhancedSystemPrompt += `\n\n=== INFORMAÇÕES DA BASE DE CONHECIMENTO ===\nUse estas informações para responder quando relevante:\n${knowledge}\n===========================================`;
        }
      }

      // Adicionar instrução para transferência
      enhancedSystemPrompt += `\n\nIMPORTANTE: Se o cliente pedir para falar com um humano, atendente, ou pessoa real, responda: "Entendi! Vou transferir você para um de nossos atendentes. Aguarde um momento!"`;

      messages.push({ role: 'system', content: enhancedSystemPrompt });

      // 3. Adicionar histórico de conversa
      let historyContainsCurrentMessage = false;
      if (useHistory) {
        const history = await this.getConversationHistory(phoneE164, historyLimit, supportsVision);
        messages.push(...history);
        if (history.length > 0) {
          historyContainsCurrentMessage = true;
        }
      }

      // 4. Adicionar mensagem atual do usuário (se não estiver no histórico)
      // Como o webhook salva a mensagem ANTES de chamar a engine, a currentMessage já deve estar no histórico.
      if (!historyContainsCurrentMessage && userMessage) {
        messages.push({ role: 'user', content: userMessage });
      } else if (historyContainsCurrentMessage && messages.length > 0) {
        // Garantir que a última mensagem seja 'user' e represente a ação atual (fallback)
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role !== 'user') {
          messages.push({ role: 'user', content: userMessage });
        }
      }

      this.logger.log(`🤖 Generating AI response with ${messages.length} messages, model=${finalModel}, vision=${supportsVision}`);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: finalModel,
          messages,
          max_tokens: finalMaxTokens,
          temperature: finalTemperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${openAIConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';
      
      // Verificar se a própria IA sugeriu transferência
      const needsHandoff = aiResponse.toLowerCase().includes('transferir') && 
                          aiResponse.toLowerCase().includes('atendente');

      return { response: aiResponse, needsHandoff };
    } catch (error) {
      this.logger.error(`AI response error: ${error.message}`);
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        needsHandoff: false
      };
    }
  }

  /**
   * Método antigo mantido para compatibilidade
   */
  async generateAIResponse(
    systemPrompt: string,
    userMessage: string,
    model: string = 'gpt-3.5-turbo',
    maxTokens: number = 500
  ): Promise<string> {
    // Buscar configuração do OpenAI do banco de dados
    const openAIConfig = await this.settingsService.getOpenAIConfig();
    const apiKey = openAIConfig.apiKey;
    
    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured');
      return 'Desculpe, o assistente de IA não está configurado no momento. Configure a API Key em Configurações > Integrações.';
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model || openAIConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: maxTokens || openAIConfig.maxTokens,
          temperature: openAIConfig.temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';
    } catch (error) {
      this.logger.error(`AI response error: ${error.message}`);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
    }
  }

  // ==========================================
  // ESTATÍSTICAS
  // ==========================================

  async getFlowStats(flowId?: string) {
    const where = flowId ? { flowId } : {};
    
    const [total, active, completed, expired] = await Promise.all([
      this.prisma.flowSession.count({ where }),
      this.prisma.flowSession.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.flowSession.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.flowSession.count({ where: { ...where, status: 'EXPIRED' } }),
    ]);

    return { total, active, completed, expired };
  }

  // ==========================================
  // INTEGRAÇÃO GOOGLE SHEETS
  // ==========================================

  private async sendToGoogleSheets(config: any, session: any, contact: any): Promise<{ success: boolean; message: string }> {
    // Buscar configuração do Google do banco ou usar variáveis de ambiente como fallback
    const googleConfig = await this.settingsService.getGoogleSheetsConfig();
    
    // Tentar usar configuração do banco, senão usar variáveis de ambiente
    const googleServiceEmail = googleConfig.serviceEmail || this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const googlePrivateKey = await this.settingsService.getSetting('google_private_key') || this.configService.get<string>('GOOGLE_PRIVATE_KEY');

    if (!googleServiceEmail || !googlePrivateKey) {
      return { success: false, message: 'Google Sheets não configurado. Configure em Configurações > Integrações.' };
    }

    const spreadsheetId = config.spreadsheetId;
    const sheetName = config.sheetName || 'Sheet1';
    const fields = config.fields || [];

    if (!spreadsheetId) {
      return { success: false, message: 'ID da planilha não configurado' };
    }

    try {
      // Gerar JWT token para autenticação com Google
      const jwt = await this.generateGoogleJWT(googleServiceEmail, googlePrivateKey);
      
      // Mapear campos para valores
      const collectedData = session?.collectedData ? JSON.parse(session.collectedData) : {};
      const customFields = contact?.customFields ? JSON.parse(contact.customFields) : {};
      
      const rowData: string[] = [];
      for (const field of fields) {
        let value = '';
        switch (field.field) {
          case 'nome': value = contact?.name || ''; break;
          case 'telefone': value = contact?.phoneE164 || session?.contactId || ''; break;
          case 'email': value = contact?.email || ''; break;
          case 'empresa': value = contact?.company || ''; break;
          case 'cidade': value = contact?.city || ''; break;
          case 'estado': value = contact?.state || ''; break;
          case 'origem': value = contact?.source || ''; break;
          case 'interesse': value = contact?.interest || ''; break;
          case 'tags': value = contact?.tags || '[]'; break;
          case 'data_contato': value = new Date().toLocaleString('pt-BR'); break;
          default: 
            // Tentar buscar em customFields ou collectedData
            value = customFields[field.field] || collectedData[field.field] || '';
        }
        rowData.push(value);
      }

      // Enviar para Google Sheets API
      const range = `${sheetName}!A:Z`;
      const response = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
        {
          values: [rowData],
        },
        {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`📊 Google Sheets: Dados enviados com sucesso`);
      return { success: true, message: 'Dados enviados para planilha' };
    } catch (error) {
      this.logger.error(`❌ Google Sheets API error: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  private async generateGoogleJWT(serviceEmail: string, privateKey: string): Promise<string> {
    // Gerar JWT para Google API
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: serviceEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })).toString('base64url');

    const crypto = require('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payload}`);
    
    // Formatar a chave privada (substituir \\n por newlines reais)
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    const signature = sign.sign(formattedKey, 'base64url');

    const jwt = `${header}.${payload}.${signature}`;

    // Trocar JWT por access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    });

    return tokenResponse.data.access_token;
  }
}
