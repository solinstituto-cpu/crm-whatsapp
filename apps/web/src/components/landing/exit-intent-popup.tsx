'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Gift, ArrowRight } from 'lucide-react'

interface ExitIntentPopupProps {
  whatsappNumber: string
  onClose: () => void
}

export default function ExitIntentPopup({ whatsappNumber, onClose }: ExitIntentPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !visible) {
        setVisible(true)
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [visible])

  const handleClose = () => {
    setVisible(false)
    onClose()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Gift className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Espera! Antes de ir...</h3>
            <p className="text-slate-600 text-sm">Ganhe 14 dias grátis para testar</p>
          </div>
        </div>
        <p className="text-slate-600 mb-6">
          Sem cartão de crédito. Cancele quando quiser. Conecte seu WhatsApp em minutos.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg"
          >
            Começar grátis
            <ArrowRight className="h-5 w-5" />
          </Link>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Vi a oferta de 14 dias grátis. Gostaria de começar.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
