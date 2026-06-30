import { Controller, Sse, Query, Logger } from '@nestjs/common';
import { Observable, interval, map, merge } from 'rxjs';
import { SseService } from './sse.service';

@Controller('api/sse')
export class SseController {
  private readonly logger = new Logger(SseController.name);

  constructor(private readonly sseService: SseService) {}

  /**
   * Endpoint SSE para receber eventos em tempo real.
   * O frontend conecta via EventSource('/api/sse/events?accountId=xxx')
   * 
   * Envia um heartbeat a cada 30s para manter a conexão viva.
   */
  @Sse('events')
  events(@Query('accountId') accountId?: string): Observable<MessageEvent> {
    this.logger.log(`🔌 SSE client connected (accountId: ${accountId || 'all'})`);

    // Heartbeat a cada 30 segundos para manter a conexão viva
    const heartbeat$ = interval(30000).pipe(
      map(() => ({
        data: JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }),
        type: 'heartbeat',
      } as MessageEvent)),
    );

    // Stream de eventos reais
    const events$ = this.sseService.getStream(accountId);

    // Merge: eventos reais + heartbeat
    return merge(events$, heartbeat$);
  }
}
