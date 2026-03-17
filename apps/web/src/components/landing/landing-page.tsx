'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  useEffect(() => setMounted(true), [])

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
                CRM WhatsApp
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Recursos</a>
              <a href="#como-funciona" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Como funciona</a>
              <a href="#segmentos" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Segmentos</a>
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
                href="#recursos"
                className="w-full sm:w-auto bg-white/10 backdrop-blur border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-5 w-5" />
                Ver recursos
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
          </div>

          {/* Hero mockup */}
          <div className="mt-20 relative">
            <div className="bg-slate-900/80 backdrop-blur rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400 text-sm ml-4">CRM WhatsApp — Inbox</span>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-12 gap-4 h-[280px] sm:h-[360px]">
                  <div className="col-span-3 bg-slate-800/60 rounded-xl p-3 space-y-2">
                    <div className="h-8 bg-slate-700 rounded-lg animate-pulse" />
                    <div className="h-14 bg-emerald-500/20 border-l-4 border-emerald-400 rounded-r" />
                    <div className="h-12 bg-slate-700/50 rounded" />
                    <div className="h-12 bg-slate-700/50 rounded" />
                    <div className="h-12 bg-slate-700/50 rounded" />
                  </div>
                  <div className="col-span-6 bg-slate-800/60 rounded-xl p-4 flex flex-col">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-600">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full" />
                      <div>
                        <div className="h-4 w-28 bg-slate-600 rounded" />
                        <div className="h-3 w-20 bg-slate-700 rounded mt-1" />
                      </div>
                    </div>
                    <div className="flex-1 py-4 space-y-3">
                      <div className="flex justify-start">
                        <div className="bg-slate-700 rounded-xl px-4 py-2 max-w-[85%]">
                          <div className="h-3 w-36 bg-slate-600 rounded" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-emerald-600 rounded-xl px-4 py-2 max-w-[85%]">
                          <div className="h-3 w-44 bg-emerald-500 rounded" />
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-slate-700 rounded-xl px-4 py-2 max-w-[85%]">
                          <div className="h-3 w-52 bg-slate-600 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="h-11 bg-slate-700 rounded-xl" />
                  </div>
                  <div className="col-span-3 bg-slate-800/60 rounded-xl p-3 space-y-3">
                    <div className="w-14 h-14 mx-auto bg-emerald-500 rounded-full" />
                    <div className="h-4 bg-slate-700 rounded mx-auto w-28" />
                    <div className="h-3 bg-slate-600 rounded mx-auto w-36" />
                    <div className="pt-3 border-t border-slate-600 space-y-2">
                      <div className="h-6 bg-slate-700 rounded" />
                      <div className="h-6 bg-slate-700 rounded" />
                      <div className="h-6 bg-slate-700 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

      {/* How it works */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
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
                <span className="text-xl font-bold">CRM WhatsApp</span>
              </div>
              <p className="text-slate-400 text-sm">
                Sistema completo de gestão e vendas pelo WhatsApp. API oficial da Meta.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Segmentos</a></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Entrar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Ajuda</Link></li>
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
              © {new Date().getFullYear()} CRM WhatsApp. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
