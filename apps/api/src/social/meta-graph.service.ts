import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Chamadas de baixo nível para a Graph API da Meta, usadas para enviar
 * mensagens no Messenger (Facebook) e no Instagram Direct.
 *
 * Ambos os canais são enviados através da MESMA Send API
 * (`/{page-id}/messages` com o Page Access Token) — é assim que a Meta
 * unificou o envio para Messenger e Instagram quando a conta do Instagram
 * está conectada a uma Página do Facebook.
 *
 * ⚠️ A versão da Graph API muda com o tempo; confira a versão atual em
 * https://developers.facebook.com/docs/graph-api/changelog antes de ir
 * para produção. Pode ser ajustada via META_GRAPH_API_VERSION sem redeploy
 * de código.
 */
@Injectable()
export class MetaGraphService {
  private readonly logger = new Logger(MetaGraphService.name);

  constructor(private configService: ConfigService) {}

  private get apiVersion(): string {
    return this.configService.get<string>('META_GRAPH_API_VERSION') || 'v21.0';
  }

  private get baseUrl(): string {
    return `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Envia uma mensagem de texto simples para um usuário do Messenger ou
   * Instagram Direct.
   *
   * @param pageId ID da Página do Facebook (dono da conta social)
   * @param pageAccessToken Page Access Token de longa duração
   * @param recipientExternalId PSID (Messenger) ou IGSID (Instagram) do destinatário
   */
  async sendText(pageId: string, pageAccessToken: string, recipientExternalId: string, text: string) {
    const url = `${this.baseUrl}/${pageId}/messages`;
    const body = {
      recipient: { id: recipientExternalId },
      message: { text },
      messaging_type: 'RESPONSE',
    };

    const res = await fetch(`${url}?access_token=${encodeURIComponent(pageAccessToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.error) {
      this.logger.error(`❌ Erro ao enviar mensagem via Graph API: ${JSON.stringify(json.error || json)}`);
      const error: any = new Error(json.error?.message || 'Falha ao enviar mensagem');
      error.metaError = json.error;
      error.statusCode = res.status;
      throw error;
    }

    return json; // { recipient_id, message_id }
  }

  /**
   * Busca o nome de exibição de um usuário a partir do PSID/IGSID.
   * A Meta restringe bastante esse tipo de chamada (privacidade) — se falhar,
   * o chamador deve usar um nome genérico como fallback.
   */
  async getUserProfile(pageAccessToken: string, externalId: string): Promise<{ name?: string } | null> {
    try {
      const url = `${this.baseUrl}/${externalId}?fields=name,first_name,last_name&access_token=${encodeURIComponent(pageAccessToken)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || json.error) return null;
      const name = json.name || [json.first_name, json.last_name].filter(Boolean).join(' ');
      return name ? { name } : null;
    } catch (e) {
      this.logger.debug(`Não foi possível obter perfil de ${externalId}: ${(e as Error).message}`);
      return null;
    }
  }
}
