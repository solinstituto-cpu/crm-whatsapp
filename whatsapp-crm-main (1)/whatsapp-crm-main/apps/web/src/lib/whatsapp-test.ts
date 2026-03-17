// Utilitário para testar WhatsApp Cloud API
// Arquivo: apps/web/src/lib/whatsapp-test.ts

interface WhatsAppConfig {
  accessToken: string
  phoneNumberId: string
  recipientPhone: string
}

export class WhatsAppTester {
  private config: WhatsAppConfig
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(config: WhatsAppConfig) {
    this.config = config
  }

  // Testar envio de mensagem simples
  async sendTestMessage(message: string = 'Olá! Teste do CRM Sol Instituto 🌞'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.config.recipientPhone,
          type: 'text',
          text: {
            body: message
          }
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Mensagem enviada com sucesso:', data)
        return { success: true, data }
      } else {
        console.error('❌ Erro ao enviar mensagem:', data)
        return { success: false, error: data }
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      return { success: false, error }
    }
  }

  // Testar template message
  async sendTemplateMessage(templateName: string = 'hello_world'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.config.recipientPhone,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'pt_BR'
            }
          }
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Template enviado com sucesso:', data)
        return { success: true, data }
      } else {
        console.error('❌ Erro ao enviar template:', data)
        return { success: false, error: data }
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      return { success: false, error }
    }
  }

  // Verificar informações da conta
  async getAccountInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Informações da conta:', data)
        return { success: true, data }
      } else {
        console.error('❌ Erro ao buscar informações:', data)
        return { success: false, error: data }
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      return { success: false, error }
    }
  }

  // Verificar status do webhook
  static verifyWebhook(verifyToken: string, hubChallenge: string, hubVerifyToken: string): string | null {
    if (hubVerifyToken === verifyToken) {
      console.log('✅ Webhook verificado com sucesso!')
      return hubChallenge
    } else {
      console.error('❌ Token de verificação inválido')
      return null
    }
  }
}

// Função para teste rápido no console
export async function quickTest() {
  const config = {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    recipientPhone: '+5511999999999' // Substitua pelo seu número
  }

  if (!config.accessToken || !config.phoneNumberId) {
    console.error('❌ Configure as variáveis WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID no .env.local')
    return
  }

  const tester = new WhatsAppTester(config)
  
  console.log('🧪 Iniciando testes WhatsApp Cloud API...')
  
  // Teste 1: Informações da conta
  console.log('\n1️⃣ Testando informações da conta...')
  await tester.getAccountInfo()
  
  // Teste 2: Enviar mensagem de texto
  console.log('\n2️⃣ Testando envio de mensagem...')
  await tester.sendTestMessage()
  
  // Teste 3: Enviar template
  console.log('\n3️⃣ Testando template...')
  await tester.sendTemplateMessage()
  
  console.log('\n🎉 Testes concluídos!')
}