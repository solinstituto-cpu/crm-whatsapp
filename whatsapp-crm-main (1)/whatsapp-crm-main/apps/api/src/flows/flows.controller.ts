import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FlowsService, CreateFlowDto, CreateFlowNodeDto } from './flows.service';

@Controller('flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  // ==========================================
  // FLUXOS
  // ==========================================

  @Get()
  async getAllFlows() {
    return this.flowsService.getAllFlows();
  }

  @Get('stats')
  async getStats(@Query('flowId') flowId?: string) {
    return this.flowsService.getFlowStats(flowId);
  }

  @Get(':id')
  async getFlow(@Param('id') id: string) {
    return this.flowsService.getFlowById(id);
  }

  @Post()
  async createFlow(@Body() dto: CreateFlowDto) {
    return this.flowsService.createFlow(dto);
  }

  @Put(':id')
  async updateFlow(@Param('id') id: string, @Body() dto: Partial<CreateFlowDto>) {
    return this.flowsService.updateFlow(id, dto);
  }

  @Delete(':id')
  async deleteFlow(@Param('id') id: string) {
    return this.flowsService.deleteFlow(id);
  }

  @Post(':id/toggle')
  async toggleFlow(@Param('id') id: string) {
    return this.flowsService.toggleFlow(id);
  }

  // ==========================================
  // NÓS
  // ==========================================

  @Post(':flowId/nodes')
  async addNode(@Param('flowId') flowId: string, @Body() dto: Omit<CreateFlowNodeDto, 'flowId'>) {
    return this.flowsService.addNode({ ...dto, flowId });
  }

  @Put('nodes/:nodeId')
  async updateNode(@Param('nodeId') nodeId: string, @Body() dto: Partial<CreateFlowNodeDto>) {
    return this.flowsService.updateNode(nodeId, dto);
  }

  @Delete('nodes/:nodeId')
  async deleteNode(@Param('nodeId') nodeId: string) {
    return this.flowsService.deleteNode(nodeId);
  }

  @Post(':flowId/nodes/reorder')
  async reorderNodes(@Param('flowId') flowId: string, @Body() body: { nodeIds: string[] }) {
    return this.flowsService.reorderNodes(flowId, body.nodeIds);
  }

  // ==========================================
  // SESSÕES
  // ==========================================

  @Get('sessions/active')
  async getActiveSessions() {
    return this.flowsService.getActiveSessions();
  }

  @Post('sessions/:sessionId/cancel')
  async cancelSession(@Param('sessionId') sessionId: string) {
    return this.flowsService.cancelSession(sessionId);
  }

  @Post('sessions/cancel-contact')
  async cancelContactSessions(@Body() body: { phoneE164: string }) {
    return this.flowsService.cancelContactSessions(body.phoneE164);
  }

  @Post('sessions/cancel-all')
  async cancelAllSessions() {
    return this.flowsService.cancelAllSessions();
  }

  // ==========================================
  // TESTES
  // ==========================================

  @Post('test/ai')
  async testAI(@Body() body: { prompt: string; message: string }) {
    const response = await this.flowsService.generateAIResponse(body.prompt, body.message);
    return { response };
  }
}
