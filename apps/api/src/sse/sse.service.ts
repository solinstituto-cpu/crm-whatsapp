import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface SseEvent {
  type: 'new_message' | 'status_update' | 'conversation_update';
  conversationId: string;
  accountId?: string;
  data: any;
}

@Injectable()
export class SseService {
  private readonly events$ = new Subject<SseEvent>();

  /**
   * Emitir um evento para todos os clientes SSE conectados
   */
  emit(event: SseEvent): void {
    this.events$.next(event);
  }

  /**
   * Retorna um Observable filtrado por accountId (opcional).
   * O controller SSE usa isso para enviar eventos ao frontend.
   */
  getStream(accountId?: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((event) => {
        // Se accountId foi especificado, filtrar por ele
        if (accountId && event.accountId) {
          return event.accountId === accountId;
        }
        // Se não, enviar todos os eventos
        return true;
      }),
      map((event) => {
        return {
          data: JSON.stringify({
            type: event.type,
            conversationId: event.conversationId,
            accountId: event.accountId,
            ...event.data,
          }),
          type: event.type,
        } as MessageEvent;
      }),
    );
  }
}
