import { Injectable, Logger } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { PrismaService } from '../prisma/prisma.service';

export interface FlowExecutionResult {
  handled: boolean;
  messages?: Array<{
    type: 'text' | 'template' | 'image' | 'interactive';
    content?: string;
    templateName?: string;
    templateParams?: string[];
    mediaUrl?: string;
    mediaId?: string;
    // Para mensagens interativas com botões
    interactiveType?: 'button' | 'list';
    headerText?: string;
    bodyText?: string;
    footerText?: string;
    buttons?: Array<{
      type: string;
      reply: {
        id: string;
        title: string;
      };
    }>;
    listButtonText?: string;
    listSections?: Array<{
      title?: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
    buttonConfig?: Array<{
      id: string;
      title: string;
      nextNodeId?: string;
    }>;
  }>;
  sessionId?: string;
}

@Injectable()
export class FlowEngineService {
  private readonly logger = new Logger(FlowEngineService.name);

  constructor(
    private flowsService: FlowsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Processa uma mensagem recebida e executa o fluxo apropriado
   */
  async processIncomingMessage(phoneE164: string, messageBody: string): Promise<FlowExecutionResult> {
    try {
      // Buscar contato para substituição de variáveis
      const contact = await this.prisma.contact.findFirst({
        where: { phoneE164 },
      });

      const flowMatch = await this.flowsService.findFlowForMessage(phoneE164, messageBody);
      
      if (!flowMatch) {
        return { handled: false };
      }

      if (flowMatch.type === 'CONTINUE') {
        // Continuar fluxo existente
        return this.continueFlow(flowMatch.session, messageBody, contact);
      } else if (flowMatch.type === 'START') {
        // Iniciar novo fluxo
        return this.startFlow(flowMatch.flow, phoneE164, contact);
      }

      return { handled: false };
    } catch (error) {
      this.logger.error(`Error processing flow: ${error.message}`);
      return { handled: false };
    }
  }

  /**
   * Inicia um novo fluxo para um contato
   */
  private async startFlow(flow: any, phoneE164: string, contact?: any): Promise<FlowExecutionResult> {
    const result = await this.flowsService.startFlowSession(flow.id, phoneE164);
    if (!result) {
      return { handled: false };
    }

    const { session, firstNode } = result;
    return this.executeNode(session, firstNode, undefined, contact);
  }

  /**
   * Continua um fluxo existente quando usuário responde
   */
  private async continueFlow(session: any, userMessage: string, contact?: any): Promise<FlowExecutionResult> {
    const currentNode = session.flow.nodes.find((n: any) => n.id === session.currentNodeId);
    
    if (!currentNode) {
      // Fluxo corrompido, finalizar
      await this.flowsService.advanceSession(session.id, null);
      return { handled: false };
    }

    this.logger.log(`📥 Continue flow: node=${currentNode.name} (${currentNode.type}), message="${userMessage}"`);

    // Para INTERACTIVE_BUTTONS ou INTERACTIVE_LIST, verificar qual opção foi clicada
    if (currentNode.type === 'INTERACTIVE_BUTTONS' || currentNode.type === 'INTERACTIVE_LIST') {
      const config = JSON.parse(currentNode.config);
      
      // Buscar a opção clicada pelo ID ou título
      let nextNodeId: string | null = null;
      
      // INTERACTIVE_LIST sempre tem listSections
      // INTERACTIVE_BUTTONS pode ter interactiveType='list' ou buttons
      if (currentNode.type === 'INTERACTIVE_LIST' || (config.interactiveType === 'list' && config.listSections)) {
        // Buscar em todas as seções da lista
        const sections = config.listSections || [];
        this.logger.log(`🔍 Searching in ${sections.length} list sections for: "${userMessage}"`);
        
        for (const section of sections) {
          for (const row of section.rows || []) {
            this.logger.log(`   Checking row: id="${row.id}", title="${row.title}"`);
            if (row.id === userMessage || row.title.toLowerCase() === userMessage.toLowerCase()) {
              nextNodeId = row.nextNodeId;
              this.logger.log(`🔘 List item clicked: "${row.title}" → nextNodeId=${nextNodeId}`);
              break;
            }
          }
          if (nextNodeId) break;
        }
      } else if (config.buttons) {
        // Buscar nos botões simples
        for (const btn of config.buttons) {
          if (btn.id === userMessage || btn.title.toLowerCase() === userMessage.toLowerCase()) {
            nextNodeId = btn.nextNodeId;
            this.logger.log(`🔘 Button clicked: "${btn.title}" → nextNodeId=${nextNodeId}`);
            break;
          }
        }
      }
      
      if (nextNodeId) {
        const nextNode = session.flow.nodes.find((n: any) => n.id === nextNodeId);
        if (nextNode) {
          await this.flowsService.advanceSession(session.id, nextNodeId);
          return this.executeNode(session, nextNode, undefined, contact);
        }
      }
      
      // Item não encontrado - reenviar a lista/botões e aguardar novamente
      this.logger.log(`⚠️ No matching item found for "${userMessage}", resending interactive message`);
      
      // Gerar mensagem interativa novamente
      const messages: FlowExecutionResult['messages'] = [];
      
      if (currentNode.type === 'INTERACTIVE_LIST' || config.listSections) {
        messages.push({
          type: 'interactive',
          interactiveType: 'list',
          headerText: config.headerText,
          bodyText: config.bodyText || 'Por favor, selecione uma opção da lista:',
          footerText: config.footerText,
          listButtonText: config.listButtonText || 'Ver opções',
          listSections: config.listSections,
        });
      } else if (config.buttons) {
        messages.push({
          type: 'interactive',
          interactiveType: 'button',
          headerText: config.headerText,
          bodyText: config.bodyText || 'Por favor, clique em um dos botões:',
          footerText: config.footerText,
          buttons: config.buttons,
        });
      }
      
      // Mantém a sessão no mesmo nó
      return { handled: true, messages, sessionId: session.id };
    }

    // Para WAIT_RESPONSE e COLLECT_DATA, salvar resposta e avançar
    if (currentNode.type === 'WAIT_RESPONSE' || currentNode.type === 'COLLECT_DATA') {
      const config = JSON.parse(currentNode.config);
      
      // Salvar a resposta na sessão E no contato
      if (config.saveAs && userMessage) {
        const currentData = session.collectedData ? JSON.parse(session.collectedData) : {};
        currentData[config.saveAs] = userMessage;
        await this.prisma.flowSession.update({
          where: { id: session.id },
          data: { collectedData: JSON.stringify(currentData) },
        });
        this.logger.log(`💾 Saved response to session: ${config.saveAs} = "${userMessage}"`);
        
        // IMPORTANTE: Salvar também no contato (customFields)
        if (contact) {
          try {
            const contactCustomFields = contact.customFields ? JSON.parse(contact.customFields) : {};
            contactCustomFields[config.saveAs] = userMessage;
            await this.prisma.contact.update({
              where: { id: contact.id },
              data: { customFields: JSON.stringify(contactCustomFields) },
            });
            this.logger.log(`💾 Saved response to contact.customFields: ${config.saveAs} = "${userMessage}"`);
          } catch (err) {
            this.logger.error(`❌ Failed to save to contact: ${err.message}`);
          }
        } else {
          // Tentar buscar contato pelo phoneE164 da sessão
          try {
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
              this.logger.log(`💾 Saved response to contact.customFields (by phone): ${config.saveAs} = "${userMessage}"`);
            }
          } catch (err) {
            this.logger.error(`❌ Failed to save to contact by phone: ${err.message}`);
          }
        }
        
        // Recarregar sessão com dados atualizados
        session = await this.prisma.flowSession.findUnique({
          where: { id: session.id },
          include: { flow: { include: { nodes: { orderBy: { position: 'asc' } } } } },
        });
      }
      
      // Avançar para o próximo nó
      const nextNodeId = currentNode.nextNodeId;
      if (nextNodeId) {
        const nextNode = session.flow.nodes.find((n: any) => n.id === nextNodeId);
        if (nextNode) {
          this.logger.log(`➡️ Advancing to next node: ${nextNode.name} (${nextNode.type})`);
          await this.flowsService.advanceSession(session.id, nextNodeId);
          return this.executeNode(session, nextNode, undefined, contact);
        }
      }
      
      // Sem próximo nó, finalizar
      this.logger.log(`✅ Flow completed (no next node)`);
      await this.flowsService.advanceSession(session.id, null);
      return { handled: true, sessionId: session.id };
    }

    // Para outros tipos de nó, processar normalmente
    const nodeResult = await this.flowsService.processNode(session, currentNode, userMessage, contact);
    
    if (!nodeResult) {
      return { handled: false };
    }

    return this.handleNodeResult(session, nodeResult, currentNode, contact);
  }

  /**
   * Executa um nó do fluxo (com proteção contra loop infinito)
   */
  private async executeNode(session: any, node: any, userMessage?: string, contact?: any): Promise<FlowExecutionResult> {
    const messages: FlowExecutionResult['messages'] = [];
    const processedNodes = new Set<string>();
    const MAX_ITERATIONS = 20; // Limite de segurança
    let iterations = 0;
    let currentNode = node;

    while (currentNode && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Verificar se já processamos este nó nesta execução
      if (processedNodes.has(currentNode.id)) {
        this.logger.warn(`⚠️ Loop detected at node ${currentNode.name}, stopping execution`);
        break;
      }
      processedNodes.add(currentNode.id);
      
      this.logger.log(`🔄 [${iterations}] Executing node: ${currentNode.name} (${currentNode.type})`);
      
      const nodeResult = await this.flowsService.processNode(session, currentNode, userMessage, contact);
      
      if (!nodeResult) {
        this.logger.log(`⏹️ Node returned no result, stopping`);
        break;
      }

      // Processar resultado do nó
      switch (nodeResult.action) {
        case 'SEND':
          if (nodeResult.messageType === 'interactive') {
            // Mensagem interativa com botões
            messages.push({
              type: 'interactive',
              interactiveType: nodeResult.interactiveType,
              headerText: nodeResult.headerText,
              bodyText: nodeResult.bodyText,
              footerText: nodeResult.footerText,
              buttons: nodeResult.buttons,
              buttonConfig: nodeResult.buttonConfig,
              listButtonText: nodeResult.listButtonText,
              listSections: nodeResult.listSections,
            });
            this.logger.log(`📤 Interactive message queued: type=${nodeResult.interactiveType}, buttons=${nodeResult.buttons?.length || 0}`);
            
            // Se waitForButtonClick, parar e aguardar clique
            if (nodeResult.waitForButtonClick) {
              this.logger.log(`⏳ Waiting for button click on node: ${currentNode.name}`);
              await this.flowsService.advanceSession(session.id, currentNode.id);
              return { handled: true, messages, sessionId: session.id };
            }
          } else {
            messages.push({
              type: nodeResult.messageType,
              content: nodeResult.content,
              templateName: nodeResult.templateName,
              templateParams: nodeResult.templateParams,
              mediaUrl: nodeResult.mediaUrl,
              mediaId: nodeResult.mediaId,
            });
            this.logger.log(`📤 Message queued: type=${nodeResult.messageType}, content="${nodeResult.content?.substring(0, 30) || 'none'}"`);
          }
          
          // Se waitForResponse, parar e aguardar resposta
          if (nodeResult.waitForResponse) {
            this.logger.log(`⏳ Waiting for response on node: ${currentNode.name}`);
            await this.flowsService.advanceSession(session.id, currentNode.id);
            return { handled: true, messages, sessionId: session.id };
          }
          break;

        case 'WAIT':
          this.logger.log(`⏳ WAIT action on node: ${currentNode.name}`);
          return { handled: true, messages, sessionId: session.id };

        case 'TAG':
          this.logger.log(`🏷️ Adding tag: ${nodeResult.tagName}`);
          await this.addTagToContact(session.contactId, nodeResult.tagName);
          break;

        case 'NOTIFY':
          this.logger.log(`📢 NOTIFY: ${nodeResult.message}`);
          break;

        case 'DELAY':
          this.logger.log(`⏱️ DELAY node - continuing immediately`);
          break;

        case 'GOTO':
          // GOTO é tratado abaixo
          break;

        default:
          this.logger.warn(`⚠️ Unknown action: ${nodeResult.action}`);
      }

      // Avançar para próximo nó
      const nextNodeId = nodeResult.nextNodeId;
      if (!nextNodeId) {
        this.logger.log(`✅ Flow completed (no next node)`);
        await this.flowsService.advanceSession(session.id, null);
        break;
      }

      // Buscar próximo nó
      const nextNode = await this.prisma.flowNode.findUnique({
        where: { id: nextNodeId },
      });

      if (!nextNode) {
        this.logger.warn(`⚠️ Next node not found: ${nextNodeId}`);
        await this.flowsService.advanceSession(session.id, null);
        break;
      }

      // Se próximo é WAIT_RESPONSE, apenas avançar e parar (não tem mensagem a enviar)
      if (nextNode.type === 'WAIT_RESPONSE') {
        await this.flowsService.advanceSession(session.id, nextNode.id);
        this.logger.log(`⏳ Next node is WAIT_RESPONSE, waiting for user response`);
        break;
      }

      // Se próximo é COLLECT_DATA, precisamos EXECUTAR para enviar a pergunta
      if (nextNode.type === 'COLLECT_DATA') {
        await this.flowsService.advanceSession(session.id, nextNode.id);
        this.logger.log(`📝 Next node is COLLECT_DATA, executing to send question...`);
        
        // Executar o COLLECT_DATA para obter a pergunta
        const collectResult = await this.flowsService.processNode(session, nextNode, undefined, contact);
        if (collectResult && collectResult.action === 'SEND' && collectResult.content) {
          messages.push({
            type: collectResult.messageType || 'text',
            content: collectResult.content,
          });
          this.logger.log(`📤 COLLECT_DATA question queued: "${collectResult.content}"`);
        }
        break;
      }

      // Avançar sessão e continuar loop
      await this.flowsService.advanceSession(session.id, nextNode.id);
      currentNode = nextNode;
      userMessage = undefined; // Limpar mensagem do usuário para próximos nós
    }

    if (iterations >= MAX_ITERATIONS) {
      this.logger.error(`❌ Max iterations (${MAX_ITERATIONS}) reached, stopping flow to prevent infinite loop`);
      await this.flowsService.advanceSession(session.id, null);
    }

    return {
      handled: true,
      messages: messages.length > 0 ? messages : undefined,
      sessionId: session.id,
    };
  }

  /**
   * Processa o resultado de um nó
   */
  private async handleNodeResult(session: any, nodeResult: any, currentNode: any, contact?: any): Promise<FlowExecutionResult> {
    const messages: FlowExecutionResult['messages'] = [];
    
    // Se o resultado tem uma ação SEND, incluir a mensagem
    if (nodeResult.action === 'SEND') {
      if (nodeResult.messageType === 'interactive') {
        messages.push({
          type: 'interactive',
          interactiveType: nodeResult.interactiveType,
          headerText: nodeResult.headerText,
          bodyText: nodeResult.bodyText,
          footerText: nodeResult.footerText,
          buttons: nodeResult.buttons,
          buttonConfig: nodeResult.buttonConfig,
          listButtonText: nodeResult.listButtonText,
          listSections: nodeResult.listSections,
        });
        
        // Se waitForButtonClick, parar e aguardar clique
        if (nodeResult.waitForButtonClick) {
          this.logger.log(`⏳ handleNodeResult: Waiting for button click on node: ${currentNode.name}`);
          await this.flowsService.advanceSession(session.id, currentNode.id);
          return { handled: true, messages, sessionId: session.id };
        }
      } else {
        messages.push({
          type: nodeResult.messageType,
          content: nodeResult.content,
          templateName: nodeResult.templateName,
          templateParams: nodeResult.templateParams,
          mediaUrl: nodeResult.mediaUrl,
          mediaId: nodeResult.mediaId,
        });
        
        // Se waitForResponse, parar e aguardar
        if (nodeResult.waitForResponse) {
          this.logger.log(`⏳ handleNodeResult: Waiting for response on node: ${currentNode.name}`);
          await this.flowsService.advanceSession(session.id, currentNode.id);
          return { handled: true, messages, sessionId: session.id };
        }
      }
    }
    
    // Se tem próximo nó, continuar execução
    if (nodeResult.nextNodeId) {
      const nextNode = await this.prisma.flowNode.findUnique({
        where: { id: nodeResult.nextNodeId },
      });
      if (nextNode) {
        const nextResult = await this.executeNode(session, nextNode, undefined, contact);
        // Combinar mensagens
        return { 
          handled: true, 
          messages: [...messages, ...(nextResult.messages || [])], 
          sessionId: session.id 
        };
      }
    }
    
    return { handled: true, messages, sessionId: session.id };
  }

  /**
   * Adiciona tag ao contato
   */
  private async addTagToContact(phoneE164: string, tagName: string) {
    try {
      this.logger.log(`🏷️ addTagToContact: phone=${phoneE164}, tag=${tagName}`);
      
      if (!tagName) {
        this.logger.warn(`🏷️ No tag name provided`);
        return;
      }
      
      const contact = await this.prisma.contact.findFirst({
        where: { phoneE164 },
      });

      if (contact) {
        const currentTags = contact.tags || '[]';
        const tags = JSON.parse(currentTags);
        if (!tags.includes(tagName)) {
          tags.push(tagName);
          await this.prisma.contact.update({
            where: { id: contact.id },
            data: { tags: JSON.stringify(tags) },
          });
          this.logger.log(`✅ Tag "${tagName}" added to contact ${contact.name || phoneE164}`);
        } else {
          this.logger.log(`ℹ️ Tag "${tagName}" already exists on contact`);
        }
      } else {
        this.logger.warn(`⚠️ Contact not found for phone: ${phoneE164}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error adding tag: ${error.message}`);
    }
  }

  /**
   * Expira sessões antigas
   */
  async expireOldSessions() {
    const expired = await this.prisma.flowSession.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} flow sessions`);
    }
  }
}
