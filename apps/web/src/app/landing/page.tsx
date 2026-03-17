'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  MessageSquare, 
  Users, 
  Zap, 
  BarChart3, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Play,
  Menu,
  X,
  Bot,
  Send,
  Target,
  Smartphone,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const features = [
    {
      icon: MessageSquare,
      title: 'Inbox Unificado',
      description: 'Todas as conversas do WhatsApp em um só lugar. Atribua atendentes, use tags e nunca perca uma mensagem.',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Bot,
      title: 'Automação Inteligente',
      description: 'Crie fluxos de atendimento com IA, botões interativos, coleta de dados e muito mais. 24/7 no piloto automático.',
      color: 'from-purple-500 to-violet-600'
    },
    {
      icon: Users,
      title: 'CRM Completo',
      description: 'Gerencie contatos com campos personalizados, tags, histórico de conversas e segmentação avançada.',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Target,
      title: 'Pipeline de Vendas',
      description: 'Funil visual estilo Kanban. Arraste e solte deals entre etapas e acompanhe seu faturamento.',
      color: 'from-orange-500 to-amber-600'
    },
    {
      icon: Send,
      title: 'Campanhas em Massa',
      description: 'Envie mensagens para milhares de contatos com templates aprovados. Agende, segmente e analise resultados.',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Detalhados',
      description: 'Dashboard com métricas em tempo real. Acompanhe performance de atendentes, conversões e muito mais.',
      color: 'from-indigo-500 to-blue-600'
    }
  ]

  const benefits = [
    { text: 'API Oficial do WhatsApp (Meta)', icon: Shield },
    { text: 'Sem risco de banimento', icon: CheckCircle },
    { text: 'Mensagens ilimitadas', icon: Zap },
    { text: 'Múltiplos atendentes', icon: Users },
    { text: 'Integração com IA (ChatGPT)', icon: Bot },
    { text: 'Suporte em português', icon: MessageSquare },
  ]

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Diretora Comercial',
      company: 'Imobiliária Prime',
      image: '👩‍💼',
      text: 'Aumentamos em 40% nossa taxa de conversão depois que automatizamos o primeiro contato com leads. O sistema é incrível!'
    },
    {
      name: 'Carlos Santos',
      role: 'CEO',
      company: 'Academia FitMax',
      image: '👨‍💼',
      text: 'Antes perdíamos muitos alunos por demora no atendimento. Agora respondemos em segundos, 24 horas por dia.'
    },
    {
      name: 'Ana Oliveira',
      role: 'Coordenadora de Vendas',
      company: 'Escola de Idiomas',
      image: '👩‍🏫',
      text: 'O funil de vendas visual mudou nossa forma de trabalhar. Agora todos sabem exatamente em que etapa cada aluno está.'
    }
  ]

  const plans = [
    {
      name: 'Starter',
      price: '149',
      period: '/mês',
      description: 'Ideal para pequenas empresas',
      features: [
        '1 número de WhatsApp',
        'Até 5 usuários',
        '10.000 mensagens/mês',
        'Inbox unificado',
        'CRM de contatos',
        'Respostas rápidas',
        'Suporte por email'
      ],
      cta: 'Começar Agora',
      popular: false
    },
    {
      name: 'Business',
      price: '349',
      period: '/mês',
      description: 'Para empresas em crescimento',
      features: [
        '1 número de WhatsApp',
        'Até 15 usuários',
        '50.000 mensagens/mês',
        'Tudo do Starter +',
        'Automação completa',
        'Campanhas em massa',
        'Pipeline de vendas',
        'Integração com IA',
        'Suporte prioritário'
      ],
      cta: 'Escolher Business',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '799',
      period: '/mês',
      description: 'Para grandes operações',
      features: [
        'Múltiplos números',
        'Usuários ilimitados',
        'Mensagens ilimitadas',
        'Tudo do Business +',
        'API de integração',
        'Relatórios avançados',
        'Gerente de sucesso',
        'SLA garantido',
        'Treinamento incluso'
      ],
      cta: 'Falar com Vendas',
      popular: false
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ZapCRM</span>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#recursos" className="text-gray-600 hover:text-gray-900 transition-colors">Recursos</a>
              <a href="#beneficios" className="text-gray-600 hover:text-gray-900 transition-colors">Benefícios</a>
              <a href="#precos" className="text-gray-600 hover:text-gray-900 transition-colors">Preços</a>
              <a href="#depoimentos" className="text-gray-600 hover:text-gray-900 transition-colors">Depoimentos</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Entrar
              </Link>
              <a 
                href="#demo" 
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all"
              >
                Começar Grátis
              </a>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#recursos" className="block text-gray-600 hover:text-gray-900">Recursos</a>
              <a href="#beneficios" className="block text-gray-600 hover:text-gray-900">Benefícios</a>
              <a href="#precos" className="block text-gray-600 hover:text-gray-900">Preços</a>
              <a href="#depoimentos" className="block text-gray-600 hover:text-gray-900">Depoimentos</a>
              <hr />
              <Link href="/auth/login" className="block text-gray-600">Entrar</Link>
              <a href="#demo" className="block bg-green-500 text-white text-center py-2 rounded-lg">Começar Grátis</a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>API Oficial do WhatsApp Business</span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Transforme seu WhatsApp em uma
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent"> máquina de vendas</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              CRM completo com automação inteligente, atendimento multiagente e campanhas em massa. 
              Tudo integrado à API oficial do Meta. Sem risco de banimento.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a 
                href="#demo"
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-green-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <span>Teste Grátis por 14 Dias</span>
                <ArrowRight className="h-5 w-5" />
              </a>
              <a 
                href="#video"
                className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-gray-300 transition-all flex items-center justify-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>Ver Demonstração</span>
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Setup em 5 minutos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Suporte em português</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
              <div className="flex items-center space-x-2 px-4 py-3 bg-gray-800/50 border-b border-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400 text-sm ml-4">ZapCRM - Inbox</span>
              </div>
              <div className="p-4 sm:p-8">
                <div className="grid grid-cols-12 gap-4 h-[300px] sm:h-[400px]">
                  {/* Sidebar */}
                  <div className="col-span-3 bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="h-8 bg-gray-700 rounded animate-pulse" />
                    <div className="h-12 bg-green-600/20 border-l-4 border-green-500 rounded" />
                    <div className="h-12 bg-gray-700/50 rounded" />
                    <div className="h-12 bg-gray-700/50 rounded" />
                    <div className="h-12 bg-gray-700/50 rounded" />
                  </div>
                  {/* Chat */}
                  <div className="col-span-6 bg-gray-800 rounded-lg p-3 flex flex-col">
                    <div className="flex items-center space-x-3 pb-3 border-b border-gray-700">
                      <div className="w-10 h-10 bg-green-500 rounded-full" />
                      <div>
                        <div className="h-4 w-24 bg-gray-700 rounded" />
                        <div className="h-3 w-16 bg-gray-600 rounded mt-1" />
                      </div>
                    </div>
                    <div className="flex-1 py-4 space-y-3">
                      <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-lg px-4 py-2 max-w-[80%]">
                          <div className="h-3 w-32 bg-gray-600 rounded" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-green-600 rounded-lg px-4 py-2 max-w-[80%]">
                          <div className="h-3 w-40 bg-green-500 rounded" />
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-lg px-4 py-2 max-w-[80%]">
                          <div className="h-3 w-48 bg-gray-600 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-700 rounded-full" />
                  </div>
                  {/* Details */}
                  <div className="col-span-3 bg-gray-800 rounded-lg p-3 space-y-3">
                    <div className="w-16 h-16 mx-auto bg-green-500 rounded-full" />
                    <div className="h-4 bg-gray-700 rounded mx-auto w-24" />
                    <div className="h-3 bg-gray-600 rounded mx-auto w-32" />
                    <div className="pt-3 border-t border-gray-700 space-y-2">
                      <div className="h-6 bg-gray-700 rounded" />
                      <div className="h-6 bg-gray-700 rounded" />
                      <div className="h-6 bg-gray-700 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-8">
            Empresas que confiam no ZapCRM
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-50">
            {['🏢 TechCorp', '🏪 MegaStore', '🏥 ClinicaPro', '🎓 EduPrime', '🏋️ FitLife', '🏠 ImobTop'].map((company, i) => (
              <div key={i} className="text-xl font-bold text-gray-400">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma plataforma completa para transformar conversas em clientes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-500 to-emerald-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Por que escolher o ZapCRM?
            </h2>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              A única solução com API oficial que garante segurança e resultados
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center space-x-4 hover:bg-white/20 transition-colors"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-white font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-6 py-4">
              <div className="flex -space-x-3">
                {['😊', '😄', '🙂', '😃'].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl border-2 border-green-500">
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-green-100 text-sm">+500 empresas satisfeitas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho da sua operação
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`relative bg-white rounded-2xl p-8 border-2 transition-all ${
                  plan.popular 
                    ? 'border-green-500 shadow-xl shadow-green-500/10 scale-105' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Mais Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-sm text-gray-500">R$</span>
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-3 rounded-full font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8">
            Todos os planos incluem 14 dias de teste grátis. Cancele a qualquer momento.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Histórias reais de empresas que transformaram seu atendimento
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center space-x-1 mb-4">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-xl text-gray-700 mb-6 italic">
                "{testimonials[activeTestimonial].text}"
              </p>
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{testimonials[activeTestimonial].image}</div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonials[activeTestimonial].name}</p>
                  <p className="text-gray-500">{testimonials[activeTestimonial].role} • {testimonials[activeTestimonial].company}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === activeTestimonial ? 'bg-green-500 w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Junte-se a centenas de empresas que já transformaram seu WhatsApp em uma máquina de vendas
          </p>

          <form className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Seu melhor email"
                className="flex-1 px-5 py-4 rounded-full border border-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <span>Começar Grátis</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </form>

          <p className="text-sm text-gray-500 mt-4">
            14 dias grátis • Sem cartão de crédito • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">ZapCRM</span>
              </div>
              <p className="text-gray-400">
                A plataforma #1 de CRM com WhatsApp do Brasil.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2026 ZapCRM. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Smartphone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
