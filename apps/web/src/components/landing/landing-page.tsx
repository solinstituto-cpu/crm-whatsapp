'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import InteractiveMockup from './interactive-mockup'
import ROICalculator from './roi-calculator'
import ExitIntentPopup from './exit-intent-popup'
import WhatsAppFloatButton from './whatsapp-float-button'
import {
  MessageCircle,
  Users,
  Zap,
  BarChart3,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  Menu,
  X,
  Bot,
  Send,
  Target,
  ChevronRight,
  Sparkles,
  Kanban,
  BookOpen,
  FileText,
  Clock,
  BarChart2,
  MessageSquare,
  Workflow,
  Database,
  Play,
  Phone,
  Settings,
} from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [activeFaqSegment, setActiveFaqSegment] = useState<string | null>(null)
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [showExitIntent, setShowExitIntent] = useState(true)

  useEffect(() => setMounted(true), [])

  const testimonials = [
    { name: 'Maria Silva', role: 'Diretora Comercial', company: 'Imobiliária Prime', text: 'Aumentamos em 40% nossa taxa de conversão depois que automatizamos o primeiro contato. O sistema é incrível!', stars: 5 },
    { name: 'Carlos Santos', role: 'CEO', company: 'Academia FitMax', text: 'Antes perdíamos alunos por demora no atendimento. Agora respondemos em segundos, 24 horas por dia.', stars: 5 },
    { name: 'Ana Oliveira', role: 'Coordenadora', company: 'Escola de Idiomas', text: 'O funil visual mudou nossa forma de trabalhar. Todos sabem em que etapa cada aluno está.', stars: 5 },
  ]

  const successCases = [
    { metric: '+40%', label: 'Conversão em vendas', segment: 'Imobiliária' },
    { metric: '60%', label: 'Redução no tempo de resposta', segment: 'Academia' },
    { metric: '3x', label: 'Mais matrículas via WhatsApp', segment: 'Escola' },
  ]

  const comparisonRows = [
    { feature: 'Histórico de conversas', common: false, drm: true },
    { feature: 'Múltiplos atendentes', common: false, drm: true },
    { feature: 'Automação 24/7', common: false, drm: true },
    { feature: 'Campanhas em massa', common: false, drm: true },
    { feature: 'Pipeline de vendas', common: false, drm: true },
    { feature: 'Sem risco de banimento', common: false, drm: true },
  ]

  const faqBySegment = [
    { segment: 'Escolas', q: 'Como fazer matrículas pelo WhatsApp?', a: 'Use fluxos de automação para qualificar leads, envie formulários e direcione para o setor de matrículas. O histórico fica salvo para cada contato.' },
    { segment: 'Clínicas', q: 'Posso enviar lembretes de consulta?', a: 'Sim. Crie campanhas segmentadas ou use automações com gatilho de data. Templates aprovados pela Meta garantem entrega.' },
    { segment: 'Imobiliárias', q: 'Como organizar leads por imóvel?', a: 'Use tags e campos personalizados. Atribua atendentes por região ou tipo de imóvel. O pipeline mostra cada lead na etapa certa.' },
  ]

  const whatsappNumber = '5511997335755'
  const contactButtons = [
    { label: 'Quero começar agora', msg: 'Olá! Gostaria de começar a usar o DRM CRM. Pode me ajudar?', style: 'primary' as const },
    { label: 'Solicitar demonstração', msg: 'Olá! Gostaria de agendar uma demonstração do DRM CRM.', style: 'secondary' as const },
    { label: 'Falar com vendas', msg: 'Olá! Tenho interesse em conhecer os planos do DRM CRM. Podemos conversar?', style: 'secondary' as const },
    { label: 'Tirar dúvidas', msg: 'Olá! Tenho algumas dúvidas sobre o DRM CRM. Pode me ajudar?', style: 'outline' as const },
    { label: 'Número adicional no plano', msg: 'Olá! Gostaria de saber o valor para adicionar números extras ao meu plano.', style: 'outline' as const },
  ]

  const plans = [
    {
      name: 'Starter',
      monthly: 147,
      annual: 1470,
      monthlyLabel: 'R$ 147',
      annualLabel: 'R$ 1.470',
      annualPerMonth: 'R$ 122',
      description: 'Para começar a vender',
      popular: false,
      features: [
        '1 número WhatsApp',
        '5 usuários',
        '1.000 conversas iniciadas/mês (base Meta)',
        'Inbox unificado',
        'CRM de contatos',
        'Respostas rápidas',
        'Templates da Meta',
        'Suporte por email',
      ],
    },
    {
      name: 'Pro',
      monthly: 297,
      annual: 2970,
      monthlyLabel: 'R$ 297',
      annualLabel: 'R$ 2.970',
      annualPerMonth: 'R$ 247',
      description: 'Para empresas em crescimento',
      popular: true,
      features: [
        '1 número WhatsApp',
        '15 usuários',
        '1.000 conversas iniciadas/mês (base Meta)',
        'Tudo do Starter +',
        'Automação e fluxos',
        'Campanhas em massa',
        'Pipeline de vendas',
        'Integração IA (OpenAI)',
        'Relatórios básicos',
        'Suporte prioritário',
      ],
    },
    {
      name: 'Business',
      monthly: 497,
      annual: 4970,
      monthlyLabel: 'R$ 497',
      annualLabel: 'R$ 4.970',
      annualPerMonth: 'R$ 414',
      description: 'Para operações maiores',
      popular: false,
      features: [
        '3 números WhatsApp',
        '30 usuários',
        '1.000 conversas iniciadas/mês (base Meta)',
        'Tudo do Pro +',
        'Base de conhecimento',
        'Relatórios avançados',
        'Exportação CSV/Excel',
        'Integração Google Sheets',
        'Suporte prioritário',
      ],
    },
    {
      name: 'Enterprise',
      monthly: null,
      annual: null,
      monthlyLabel: 'Sob consulta',
      annualLabel: 'Sob consulta',
      annualPerMonth: null,
      description: 'Para grandes operações',
      popular: false,
      features: [
        'Números ilimitados',
        'Usuários ilimitados',
        '1.000 conversas iniciadas/mês (base Meta)',
        'Tudo do Business +',
        'API de integração',
        'Gerente de sucesso',
        'SLA garantido',
        'Treinamento incluso',
      ],
    },
  ]

  const features = [
    {
      icon: MessageCircle,
      title: 'Inbox Unificado',
      description: 'Todas as conversas em um só lugar. Multi-números, atribuição de atendentes, respostas rápidas, templates aprovados e status de entrega em tempo real.',
      highlight: 'Multi-números',
      color: 'from-emerald-500 to-green-600',
    },
    {
      icon: Workflow,
      title: 'Automação com IA',
      description: 'Fluxos visuais com gatilhos: palavra-chave, nova mensagem, novo contato, fora do horário, sem resposta 24h, aniversário. Nós de IA (OpenAI), chatbot, coleta de dados, Google Sheets.',
      highlight: 'Editor visual',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Users,
      title: 'CRM de Contatos',
      description: 'Campos personalizados, tags, importação CSV, deduplicação. Dados comerciais: origem, interesse, status. Atendente responsável e histórico completo.',
      highlight: 'Importação em massa',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Kanban,
      title: 'Pipeline de Vendas',
      description: 'Kanban com drag & drop. Estágios customizáveis, deals com valor e probabilidade. Métricas de conversão e previsão de fechamento.',
      highlight: 'Funil visual',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: Send,
      title: 'Campanhas em Massa',
      description: 'Segmentação por tags, status e campos. Agendamento, velocidade controlada, horário comercial. Templates com variáveis e mídia.',
      highlight: 'Segmentação avançada',
      color: 'from-rose-500 to-pink-600',
    },
    {
      icon: BarChart3,
      title: 'Relatórios e Exportação',
      description: 'Dashboard com métricas em tempo real. Gráficos de conversas, top contatos, atividade. Exportação CSV/Excel de contatos, conversas e deals.',
      highlight: 'Exportação completa',
      color: 'from-indigo-500 to-blue-600',
    },
    {
      icon: FileText,
      title: 'Templates da Meta',
      description: 'Gestão de templates aprovados pela API oficial. Categorias Marketing, Utility, Authentication. Criação, aprovação e uso em campanhas.',
      highlight: 'API oficial',
      color: 'from-teal-500 to-emerald-600',
    },
    {
      icon: BookOpen,
      title: 'Base de Conhecimento',
      description: 'Artigos com keywords e categorias. Alimenta o contexto da IA nos fluxos para respostas mais precisas e personalizadas.',
      highlight: 'IA contextualizada',
      color: 'from-sky-500 to-blue-600',
    },
    {
      icon: Database,
      title: 'Respostas Rápidas',
      description: 'Categorias e atalhos (ex: /saudacao). Variáveis substituíveis. Acelere o atendimento com respostas prontas.',
      highlight: 'Atalhos inteligentes',
      color: 'from-fuchsia-500 to-pink-600',
    },
  ]

  const benefits = [
    { text: 'API Oficial WhatsApp (Meta) — sem risco de banimento', icon: Shield },
    { text: 'Múltiplos atendentes com controle de permissões', icon: Users },
    { text: 'Integração OpenAI para respostas inteligentes', icon: Bot },
    { text: 'Janela 24h e opt-out automático (compliance)', icon: Clock },
    { text: 'Google Sheets para coleta de dados em fluxos', icon: BarChart2 },
    { text: 'Tema claro/escuro e personalização visual', icon: Sparkles },
  ]

  const useCases = [
    { area: 'Escolas e Cursos', desc: 'Matrículas, rematrículas, cobranças e suporte 24/7' },
    { area: 'Imobiliárias', desc: 'Qualificação de leads, agendamento de visitas e follow-up' },
    { area: 'Clínicas e Consultórios', desc: 'Lembretes de consulta, confirmações e pós-atendimento' },
    { area: 'E-commerce', desc: 'Abandono de carrinho, pós-venda e promoções segmentadas' },
    { area: 'Academias', desc: 'Renovação de planos, treinos e engajamento' },
  ]

  const howItWorks = [
    { step: 1, title: 'Conecte seu WhatsApp', desc: 'Integração em minutos com a API oficial da Meta. Sem gambiarras.' },
    { step: 2, title: 'Configure sua operação', desc: 'Importe contatos, crie fluxos de automação e defina seu pipeline.' },
    { step: 3, title: 'Venda mais', desc: 'Atenda em tempo real, automatize o que for possível e acompanhe os resultados.' },
  ]

  const faqs = [
    { q: 'Preciso de um número novo de WhatsApp?', a: 'Não. Você usa seu número comercial existente, conectado à API oficial da Meta.' },
    { q: 'Há risco de banimento?', a: 'Com a API oficial, você segue as políticas do WhatsApp. Evitamos soluções não-oficiais que violam os termos.' },
    { q: 'Funciona fora do horário comercial?', a: 'Sim. Automações e fluxos com IA respondem 24/7. Configure mensagens de fora do horário.' },
    { q: 'Posso ter vários atendentes?', a: 'Sim. Suporte a múltiplos usuários com atribuição de conversas e controle de permissões.' },
    { q: 'Integra com outras ferramentas?', a: 'Sim. OpenAI para IA, Google Sheets para dados, e API para integrações customizadas.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                DRM CRM
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Recursos</a>
              <a href="#como-funciona" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Como funciona</a>
              <a href="#segmentos" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Segmentos</a>
              <a href="#conheca-sistema" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Conheça o sistema</a>
              <a href="#precos" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Preços</a>
              <a href="#implementacao" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Implementação</a>
              <a href="#contato" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Contato</a>
              <a href="#faq" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">FAQ</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/auth/login"
                className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-[1.02]"
              >
                Começar agora
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100">
            <div className="px-4 py-4 space-y-3">
              <a href="#recursos" className="block text-slate-600" onClick={() => setMobileMenuOpen(false)}>Recursos</a>
              <a href="#como-funciona" className="block text-slate-600" onClick={() => setMobileMenuOpen(false)}>Como funciona</a>
              <a href="#segmentos" className="block text-slate-600" onClick={() => setMobileMenuOpen(false)}>Segmentos</a>
              <a href="#conheca-sistema" className="block text-slate-600" onClick={() => setMobileMenuOpen(false)}>Conheça o sistema</a>
              <a href="#precos" className="block text-slate-600" onClick={() => setMobileMenuOpen(false)}>Preços</a>
              <a href="#implementacao" className="block text-slate-600" onClick={() => setMobileMenuOpen(false)}>Implementação</a>
              <a href="#contato" className="block text-slate-600" onClick={() => setMobileMenuOpen(false)}>Contato</a>
              <a href="#faq" className="block text-slate-600" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <hr className="border-slate-100" />
              <Link href="/auth/login" className="block text-slate-600">Entrar</Link>
              <Link href="/auth/login" className="block bg-indigo-600 text-white text-center py-3 rounded-xl font-semibold">Começar agora</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-24 lg:pt-36 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-400/20 blur-3xl" />

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/95 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/20">
              <Sparkles className="h-4 w-4" />
              API Oficial do WhatsApp Business
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Venda mais.{' '}
              <span className="text-cyan-200">Responda menos.</span>
            </h1>

            <p className="text-xl sm:text-2xl text-blue-100/90 max-w-3xl mx-auto mb-10 leading-relaxed">
              CRM completo com automação inteligente, atendimento multiagente e campanhas em massa. 
              Tudo integrado à API oficial da Meta. Sem risco de banimento.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/auth/login"
                className="w-full sm:w-auto bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
              >
                Acessar o sistema
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#video-demo"
                className="w-full sm:w-auto bg-white/10 backdrop-blur border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-5 w-5" />
                Ver demonstração
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-cyan-300" />
                <span>Setup em minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-cyan-300" />
                <span>Sem risco de banimento</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-cyan-300" />
                <span>IA integrada (OpenAI)</span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-white/80">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">+500</p>
                <p className="text-xs">empresas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">1M+</p>
                <p className="text-xs">mensagens/mês</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">30min</p>
                <p className="text-xs">para começar</p>
              </div>
            </div>
          </div>

          {/* Hero mockup - interativo */}
          <div className="mt-16 relative">
            <InteractiveMockup compact />
            <p className="text-center text-white/70 text-sm mt-4">Clique no menu para explorar</p>
          </div>
        </div>
      </section>

      {/* Video demo placeholder */}
      <section id="video-demo" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Veja o sistema em ação</h2>
            <p className="text-slate-400">Demonstração em vídeo (em breve)</p>
          </div>
          <div className="aspect-video bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Gostaria de agendar uma demonstração ao vivo do DRM CRM.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 text-slate-400 hover:text-white transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-indigo-600/20 flex items-center justify-center border-2 border-indigo-500">
                <Play className="h-10 w-10 text-indigo-400 ml-1" />
              </div>
              <span className="font-medium">Solicitar demonstração ao vivo</span>
            </a>
          </div>
        </div>
      </section>

      {/* Logos / Social proof */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500 mb-8 font-medium">
            Ideal para qualquer segmento
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60">
            {['Escolas', 'Imobiliárias', 'Clínicas', 'E-commerce', 'Academias', 'Serviços'].map((s, i) => (
              <span key={i} className="text-lg font-semibold text-slate-400">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Atendimento inteligente - Um número ou vários */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-cyan-200/90 font-semibold text-sm uppercase tracking-widest mb-4">
              Atendimento que se adapta a você
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6">
              Um número ou vários — você escolhe
            </h2>
            <p className="text-lg text-blue-100/90 max-w-2xl mx-auto">
              Revolucione sua forma de atender. Crie departamentos, segmente por setor e direcione cada cliente para o atendente certo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Um número */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Prefere um só número?
              </h3>
              <p className="text-blue-100/90 leading-relaxed mb-4">
                Unifique vendas, suporte e cobrança em um único WhatsApp. Crie departamentos e setores internos — cada cliente é direcionado automaticamente para quem sabe resolver. Simples, profissional e sem confusão.
              </p>
              <p className="text-cyan-200 text-sm font-medium">
                Ideal para quem quer simplicidade
              </p>
            </div>

            {/* Vários números */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-6">
                <span className="text-2xl">📲</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Tem vários números?
              </h3>
              <p className="text-blue-100/90 leading-relaxed mb-4">
                Centralize tudo em um painel. Vendas, filiais, canais — todos os números em um só lugar. Organize por departamento, segmente atendimentos e nunca perca uma conversa. Controle total, visão única.
              </p>
              <p className="text-cyan-200 text-sm font-medium">
                Ideal para operações em escala
              </p>
            </div>
          </div>

          <p className="text-center text-white/80 text-sm mt-10 max-w-xl mx-auto">
            Com o DRM CRM, você estrutura seu atendimento do seu jeito — e cada cliente chega na pessoa certa.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Uma plataforma completa para transformar conversas em clientes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <f.icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{f.highlight}</span>
                <h3 className="text-xl font-bold text-slate-900 mt-2 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por que API oficial */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-amber-50 border-y border-amber-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Por que a API oficial do WhatsApp?
          </h2>
          <p className="text-slate-600 mb-6">
            Soluções não-oficiais violam os termos do WhatsApp e podem resultar em <strong className="text-amber-700">banimento permanente</strong> do seu número. 
            Com o DRM CRM e a API oficial da Meta, você opera dentro das regras — sem risco, com suporte e escalabilidade.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-slate-700 border border-amber-200">Sem risco de banimento</span>
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-slate-700 border border-amber-200">Políticas da Meta</span>
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-slate-700 border border-amber-200">Suporte oficial</span>
          </div>
        </div>
      </section>

      {/* Comparativo */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">DRM CRM vs. WhatsApp comum</h2>
            <p className="text-slate-600">Veja o que você ganha com uma plataforma profissional</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-4 font-semibold text-slate-700">Recurso</th>
                  <th className="p-4 font-semibold text-slate-500">WhatsApp comum</th>
                  <th className="p-4 font-semibold text-indigo-600">DRM CRM</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-slate-800">{row.feature}</td>
                    <td className="p-4 text-center">{row.common ? <CheckCircle className="h-5 w-5 text-slate-300 mx-auto" /> : <span className="text-slate-300">—</span>}</td>
                    <td className="p-4 text-center"><CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Checklist antes/depois */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Antes e depois do DRM CRM</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">Antes</h3>
              <ul className="space-y-2 text-red-700">
                <li className="flex gap-2"><span>✕</span> Mensagens perdidas no celular</li>
                <li className="flex gap-2"><span>✕</span> Ninguém sabe quem atendeu</li>
                <li className="flex gap-2"><span>✕</span> Resposta só no horário comercial</li>
                <li className="flex gap-2"><span>✕</span> Campanhas uma a uma</li>
                <li className="flex gap-2"><span>✕</span> Risco de banimento (soluções piratas)</li>
              </ul>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">Depois</h3>
              <ul className="space-y-2 text-emerald-700">
                <li className="flex gap-2"><CheckCircle className="h-5 w-5 flex-shrink-0" /> Tudo centralizado e com histórico</li>
                <li className="flex gap-2"><CheckCircle className="h-5 w-5 flex-shrink-0" /> Atribuição e equipe organizada</li>
                <li className="flex gap-2"><CheckCircle className="h-5 w-5 flex-shrink-0" /> Automação 24/7</li>
                <li className="flex gap-2"><CheckCircle className="h-5 w-5 flex-shrink-0" /> Campanhas em massa segmentadas</li>
                <li className="flex gap-2"><CheckCircle className="h-5 w-5 flex-shrink-0" /> API oficial, zero risco</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integrações */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Integrações</h2>
          <p className="text-slate-600 mb-8">Conecte com as ferramentas que você já usa</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['WhatsApp (Meta)', 'OpenAI', 'Google Sheets'].map((name, i) => (
              <div key={i} className="px-6 py-3 bg-slate-100 rounded-xl font-medium text-slate-700">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline implementação */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-indigo-50 border-y border-indigo-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Em 30 minutos você está atendendo</h2>
          <p className="text-slate-600 mb-8">Setup rápido. Sem complicação.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Conectar WhatsApp (5 min)</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Importar contatos (10 min)</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Configurar fluxo (15 min)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Selo garantia + badges */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-bold text-slate-900">14 dias grátis</p>
                <p className="text-xs text-slate-500">Cancele quando quiser</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-bold text-slate-900">Pagamento seguro</p>
                <p className="text-xs text-slate-500">Dados criptografados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-bold text-slate-900">LGPD</p>
                <p className="text-xs text-slate-500">Seus dados protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">O que nossos clientes dizem</h2>
            <p className="text-slate-600">Histórias reais de quem transformou o atendimento</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, s) => (
                    <Star key={s} className="h-5 w-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">&quot;{t.text}&quot;</p>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role} · {t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos de sucesso */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-cyan-600">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Resultados reais</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {successCases.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-6 text-center border border-white/20">
                <p className="text-3xl font-bold text-white mb-1">{s.metric}</p>
                <p className="text-white/90 text-sm">{s.label}</p>
                <p className="text-cyan-200 text-xs mt-2">{s.segment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <ROICalculator />
        </div>
      </section>

      {/* FAQ por segmento */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Perguntas por segmento</h2>
          <div className="space-y-4">
            {faqBySegment.map((f, i) => (
              <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  onClick={() => setActiveFaqSegment(activeFaqSegment === f.segment ? null : f.segment)}
                >
                  <span className="font-semibold text-slate-900">{f.segment}: {f.q}</span>
                  <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${activeFaqSegment === f.segment ? 'rotate-90' : ''}`} />
                </button>
                {activeFaqSegment === f.segment && (
                  <div className="px-6 pb-4 text-slate-600 text-sm">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Webinar / Demo CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Quer ver o sistema em ação?</h2>
          <p className="text-slate-400 mb-8">Agende uma demonstração ao vivo. Sem compromisso.</p>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Gostaria de agendar uma demonstração ao vivo do DRM CRM.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold"
          >
            <Play className="h-5 w-5" />
            Agendar demonstração
          </a>
        </div>
      </section>

      {/* Recursos / Blog placeholder */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Recursos</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {['Como conectar o WhatsApp', 'Primeiros passos no CRM', 'Criar sua primeira automação'].map((title, i) => (
              <Link key={i} href="/help" className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
                <p className="font-medium text-slate-900">{title}</p>
                <p className="text-sm text-slate-500 mt-1">Guia passo a passo →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Mockup */}
      <section id="conheca-sistema" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Conheça o sistema por dentro
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Explore as telas do DRM CRM. Clique no menu para navegar.
            </p>
          </div>
          <InteractiveMockup />
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Em três passos você está vendendo pelo WhatsApp
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-indigo-500/25">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
                {item.step < 3 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+1rem)] w-[calc(50%-2rem)] h-0.5 bg-gradient-to-r from-indigo-200 to-cyan-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="segmentos" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Para qualquer segmento
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Escolas, imobiliárias, clínicas, e-commerce e muito mais
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                    <Target className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{uc.area}</h3>
                    <p className="text-slate-600 text-sm">{uc.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Escolha mensal ou anual. No plano anual, ganhe 2 meses grátis.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-white rounded-full p-1.5 shadow-sm border border-slate-200">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !billingAnnual ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingAnnual ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Anual
              </button>
              <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                -17%
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl p-6 border-2 transition-all flex flex-col ${
                  plan.popular
                    ? 'border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02]'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Mais popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {plan.monthly !== null ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-slate-500 text-sm">R$</span>
                        <span className="text-3xl font-bold text-slate-900">
                          {billingAnnual ? plan.annualPerMonth?.replace('R$ ', '') : plan.monthly}
                        </span>
                        <span className="text-slate-500 text-sm">/mês</span>
                      </div>
                      {billingAnnual && (
                        <p className="text-slate-500 text-xs mt-1">
                          {plan.annualLabel}/ano (2 meses grátis)
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-slate-900">{plan.monthlyLabel}</span>
                  )}
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.monthly !== null ? (
                  <Link
                    href="/auth/login"
                    className={`mt-6 w-full py-3 rounded-xl font-semibold text-center transition-all flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-indigo-500/25'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Começar agora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Tenho interesse no plano Enterprise do DRM CRM. Podemos conversar?')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full py-3 rounded-xl font-semibold text-center transition-all flex items-center justify-center gap-2 bg-slate-100 text-slate-900 hover:bg-slate-200"
                  >
                    <Phone className="h-4 w-4" />
                    Falar com vendas
                  </a>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Todos os planos incluem 14 dias de teste grátis. Cancele quando quiser.
          </p>

          <p className="text-center text-slate-600 text-sm mt-4">
            Precisa de mais números?{' '}
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Gostaria de saber o valor para adicionar números extras ao meu plano.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Consulte valores para número adicional
            </a>
          </p>

          {/* Pacotes de Implementação - Configuração feita por nós */}
          <div id="implementacao" className="mt-20">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-semibold text-sm uppercase tracking-wider mb-2">
                Não sabe por onde começar?
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Implementação feita por nós
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Escolha o nível de configuração que faz sentido para sua empresa. Nossa equipe cuida de tudo — do zero até o primeiro atendimento.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  name: 'Básico',
                  tagline: 'Para começar rápido',
                  color: 'from-slate-500 to-slate-600',
                  border: 'border-slate-200',
                  features: [
                    'Integração WhatsApp (API oficial)',
                    '1 automação (fora do horário)',
                    'Respostas rápidas básicas',
                    'Templates iniciais configurados',
                  ],
                  msg: 'Olá! Tenho interesse no pacote Básico de implementação do DRM CRM. Pode me enviar os valores?',
                },
                {
                  name: 'Intermediário',
                  tagline: 'Atendimento estruturado',
                  color: 'from-indigo-500 to-indigo-600',
                  border: 'border-indigo-200',
                  popular: true,
                  features: [
                    'Tudo do Básico +',
                    '2–3 automações (palavra-chave, novo contato)',
                    'Fluxo de chatbot básico',
                    'Importação de contatos',
                    'Configuração de pipeline',
                  ],
                  msg: 'Olá! Tenho interesse no pacote Intermediário de implementação do DRM CRM. Pode me enviar os valores?',
                },
                {
                  name: 'Completo',
                  tagline: 'Tudo pronto para vender',
                  color: 'from-emerald-500 to-emerald-600',
                  border: 'border-emerald-200',
                  features: [
                    'Tudo do Intermediário +',
                    'Múltiplas automações',
                    'Integração IA (OpenAI)',
                    'Base de conhecimento',
                    'Campanhas iniciais',
                    'Suporte pós-implantação (30 dias)',
                  ],
                  msg: 'Olá! Tenho interesse no pacote Completo de implementação do DRM CRM. Pode me enviar os valores?',
                },
                {
                  name: 'Enterprise',
                  tagline: 'Sob medida',
                  color: 'from-amber-500 to-orange-600',
                  border: 'border-amber-200',
                  features: [
                    'Tudo personalizado',
                    'Integrações (Google Sheets, ERP)',
                    'Treinamento completo da equipe',
                    'Fluxos do seu segmento',
                    'Gerente de sucesso dedicado',
                  ],
                  msg: 'Olá! Tenho interesse no pacote Enterprise de implementação do DRM CRM. Preciso de uma solução sob medida. Podemos conversar?',
                },
              ].map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative bg-white rounded-2xl p-6 border-2 ${pkg.border} hover:shadow-xl transition-all flex flex-col ${
                    pkg.popular ? 'ring-2 ring-indigo-500/50 shadow-lg' : ''
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Mais escolhido
                    </div>
                  )}
                  <div className={`w-12 h-12 bg-gradient-to-br ${pkg.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">{pkg.tagline}</p>
                  <ul className="space-y-2 flex-1 mb-6">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(pkg.msg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${
                      pkg.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:shadow-lg'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    Solicitar valores
                  </a>
                </div>
              ))}
            </div>

            <p className="text-center text-slate-500 text-sm mt-8">
              Todos os pacotes são cobrança única. Você assina o plano mensal e nós fazemos a implementação.
            </p>

            <div className="mt-8 text-center">
              <p className="text-slate-600 text-sm mb-3">
                Não sabe qual pacote escolher?
              </p>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Tenho interesse na implementação do DRM CRM mas não sei qual pacote escolher. Podem me orientar?')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
              >
                <Phone className="h-4 w-4" />
                Fale com a gente — te orientamos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Fale conosco */}
      <section id="contato" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Fale com a gente
            </h2>
            <p className="text-xl text-slate-600">
              Escolha como prefere começar. Estamos no WhatsApp para te atender.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contactButtons.map((btn) => (
              <a
                key={btn.label}
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(btn.msg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] ${
                  btn.style === 'primary'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : btn.style === 'secondary'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <Phone className="h-5 w-5" />
                {btn.label}
              </a>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Ou chame no WhatsApp: <strong className="text-slate-700">(11) 99296-4792</strong>
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Por que escolher?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              API oficial, segurança e resultados
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center gap-4 hover:bg-white/15 transition-colors border border-white/10"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <b.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-white font-medium">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-5 border border-white/10">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-indigo-500">
                    <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  ))}
                </div>
                <p className="text-blue-100 text-sm font-medium">Sistema completo e confiável</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-100 overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${activeFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-4 text-slate-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Conecte seu WhatsApp e transforme seu atendimento em vendas
          </p>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-[1.02]"
          >
            Acessar o sistema
            <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="text-sm text-slate-500 mt-6">
            Já tem conta? <Link href="/auth/login" className="text-indigo-600 font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">DRM CRM</span>
              </div>
              <p className="text-slate-400 text-sm">
                Sistema completo de gestão e vendas pelo WhatsApp. DRM CRM - API oficial da Meta.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Segmentos</a></li>
                <li><a href="#implementacao" className="hover:text-white transition-colors">Implementação</a></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Entrar</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Recursos</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Ajuda</Link></li>
                <li>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Preciso de ajuda com o DRM CRM.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <Phone className="h-4 w-4" />
                    Fale conosco
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de uso</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} DRM CRM - Sistema de Gestão de WhatsApp.
            </p>
            <div className="flex gap-4 text-slate-500 text-xs">
              <span>Pagamento seguro</span>
              <span>·</span>
              <span>LGPD</span>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp flutuante */}
      <WhatsAppFloatButton whatsappNumber={whatsappNumber} message="Olá! Gostaria de saber mais sobre o DRM CRM." />

      {/* Exit intent */}
      {showExitIntent && (
        <ExitIntentPopup whatsappNumber={whatsappNumber} onClose={() => setShowExitIntent(false)} />
      )}
    </div>
  )
}
