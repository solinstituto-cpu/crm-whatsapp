'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { 
  MessageSquare, 
  Users, 
  Kanban, 
  Zap, 
  Megaphone,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Reply,
  Send,
  Clock,
  Bot,
  Tag,
  UserCheck,
  HelpCircle,
  Keyboard,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function HelpPage() {
  const [openSections, setOpenSections] = useState<string[]>(['inbox'])

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  const sections: Section[] = [
    {
      id: 'inbox',
      title: 'Caixa de Entrada',
      icon: <MessageSquare className="h-5 w-5" />,
      content: (
        <div className="space-y-4 text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Gerenciando Conversas</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Ativas:</strong> Conversas em andamento</li>
              <li><strong>Arquivadas:</strong> Conversas finalizadas</li>
              <li>Clique em uma conversa para abrir</li>
              <li>Use a busca para encontrar por nome ou telefone</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Send className="h-4 w-4" /> Enviando Mensagens
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Enter:</strong> Envia a mensagem</li>
              <li><strong>Shift + Enter:</strong> Nova linha (não envia)</li>
              <li>Clique no 😊 para emojis</li>
              <li>Clique no ⚡ para respostas rápidas</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Paperclip className="h-4 w-4" /> Anexos
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">🖼️ Foto: JPG, PNG, WebP (5MB)</div>
              <div className="bg-gray-50 p-2 rounded">🎥 Vídeo: MP4, 3GP (16MB)</div>
              <div className="bg-gray-50 p-2 rounded">📄 Documento: PDF, DOC, XLS (100MB)</div>
              <div className="bg-gray-50 p-2 rounded">🎵 Áudio: AAC, MP3, OGG (16MB)</div>
              <div className="bg-gray-50 p-2 rounded">👤 Contato: Nome + Telefone</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Reply className="h-4 w-4" /> Responder Mensagem
            </h4>
            <p>Passe o mouse sobre uma mensagem e clique na seta ↩️ para citar/responder. A pessoa verá a mensagem original citada.</p>
          </div>
        </div>
      )
    },
    {
      id: 'contacts',
      title: 'Contatos',
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-4 text-gray-600">
          <p>Gerencie todos os seus contatos em um só lugar.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Adicione novos contatos com nome e telefone</li>
            <li>Use <strong>tags</strong> para categorizar (ex: "VIP", "Lead")</li>
            <li>Campos personalizados para informações extras</li>
            <li>Inicie conversa diretamente do contato</li>
          </ul>
        </div>
      )
    },
    {
      id: 'pipeline',
      title: 'Pipeline de Vendas',
      icon: <Kanban className="h-5 w-5" />,
      content: (
        <div className="space-y-4 text-gray-600">
          <p>Acompanhe suas oportunidades de venda em formato Kanban.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Arraste cards entre os estágios</li>
            <li>Veja o valor total por etapa</li>
            <li>Vincule oportunidades a contatos</li>
            <li>Acesse a conversa direto do deal</li>
          </ul>
          <div className="bg-gray-50 p-3 rounded">
            <strong>Estágios:</strong> Lead → Qualificação → Proposta → Negociação → Fechado
          </div>
        </div>
      )
    },
    {
      id: 'automations',
      title: 'Automações (Fluxos)',
      icon: <Zap className="h-5 w-5" />,
      content: (
        <div className="space-y-4 text-gray-600">
          <p>Automatize respostas e ações baseadas em gatilhos.</p>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Gatilhos Disponíveis</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Palavra-chave:</strong> Cliente envia palavra específica</li>
              <li><strong>Primeira mensagem:</strong> Novo contato</li>
              <li><strong>Fora do horário:</strong> Mensagem fora do expediente</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Ações Possíveis</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Enviar mensagem de texto</li>
              <li>Enviar template aprovado</li>
              <li>Enviar imagem</li>
              <li>Mensagem com botões (até 3)</li>
              <li>Aguardar resposta</li>
              <li>Adicionar tag ao contato</li>
              <li>Atribuir a atendente</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'campaigns',
      title: 'Campanhas',
      icon: <Megaphone className="h-5 w-5" />,
      content: (
        <div className="space-y-4 text-gray-600">
          <p>Envie mensagens em massa usando templates aprovados.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Selecione o template a enviar</li>
            <li>Escolha o público (todos, por tag, lista)</li>
            <li>Agende ou envie imediatamente</li>
            <li>Acompanhe métricas de entrega e leitura</li>
          </ul>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm">
            <strong>Atenção:</strong> Use com moderação para evitar bloqueios do WhatsApp.
          </div>
        </div>
      )
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: <FileText className="h-5 w-5" />,
      content: (
        <div className="space-y-4 text-gray-600">
          <p>Templates são mensagens pré-aprovadas pelo WhatsApp/Meta.</p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-sm">
            <strong>Obrigatório usar templates:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>Iniciar conversa (após 24h sem resposta do cliente)</li>
              <li>Campanhas em massa</li>
              <li>Mensagens promocionais</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Variáveis</h4>
            <p>Use {"{{1}}"}, {"{{2}}"}, etc. no template. Na hora de enviar, preencha os valores.</p>
            <div className="bg-gray-50 p-2 rounded mt-2 text-sm font-mono">
              "Olá {"{{1}}"}, seu pedido {"{{2}}"} foi enviado!"<br/>
              → "Olá João, seu pedido #123 foi enviado!"
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quick-replies',
      title: 'Respostas Rápidas',
      icon: <Zap className="h-5 w-5" />,
      content: (
        <div className="space-y-4 text-gray-600">
          <p>Textos prontos para agilizar o atendimento.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Crie respostas por categoria (Saudação, Preços, Suporte...)</li>
            <li>Na conversa, clique em ⚡ para usar</li>
            <li>O texto é inserido no campo - edite se quiser antes de enviar</li>
          </ul>
          <p className="text-sm text-gray-500">Diferente de templates, respostas rápidas só funcionam dentro da janela de 24h.</p>
        </div>
      )
    },
    {
      id: 'shortcuts',
      title: 'Atalhos de Teclado',
      icon: <Keyboard className="h-5 w-5" />,
      content: (
        <div className="space-y-2 text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded flex justify-between">
              <span>Enviar mensagem</span>
              <kbd className="bg-gray-200 px-2 py-0.5 rounded text-sm">Enter</kbd>
            </div>
            <div className="bg-gray-50 p-2 rounded flex justify-between">
              <span>Nova linha</span>
              <kbd className="bg-gray-200 px-2 py-0.5 rounded text-sm">Shift + Enter</kbd>
            </div>
            <div className="bg-gray-50 p-2 rounded flex justify-between">
              <span>Fechar popup</span>
              <kbd className="bg-gray-200 px-2 py-0.5 rounded text-sm">Esc</kbd>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Dicas Importantes',
      icon: <AlertTriangle className="h-5 w-5" />,
      content: (
        <div className="space-y-4 text-gray-600">
          <div className="bg-green-50 border-l-4 border-green-400 p-3">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Janela de 24 Horas
            </h4>
            <p className="text-sm mt-1">Após o cliente enviar mensagem, você tem 24h para responder livremente. Depois, só com templates.</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
            <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Evite Spam
            </h4>
            <p className="text-sm mt-1">Muitos bloqueios ou denúncias podem suspender sua conta do WhatsApp Business.</p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Boas Práticas
            </h4>
            <ul className="text-sm mt-1 list-disc list-inside">
              <li>Responda rápido (clientes esperam minutos)</li>
              <li>Use o nome do cliente</li>
              <li>Respostas rápidas agilizam sem perder qualidade</li>
              <li>Transfira quando necessário</li>
            </ul>
          </div>
        </div>
      )
    }
  ]

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-green-600" />
            Central de Ajuda
          </h1>
          <p className="text-gray-600 mt-1">Guia completo para usar o sistema</p>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow border overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-green-600">{section.icon}</div>
                  <span className="font-medium text-gray-800">{section.title}</span>
                </div>
                {openSections.includes(section.id) ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {openSections.includes(section.id) && (
                <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Precisa de mais ajuda? Entre em contato com o suporte.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
