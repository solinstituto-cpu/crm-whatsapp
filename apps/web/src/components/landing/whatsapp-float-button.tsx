'use client'

import { Phone } from 'lucide-react'

interface WhatsAppFloatButtonProps {
  whatsappNumber: string
  message: string
}

export default function WhatsAppFloatButton({ whatsappNumber, message }: WhatsAppFloatButtonProps) {
  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-110 transition-all"
      aria-label="Falar no WhatsApp"
    >
      <Phone className="h-7 w-7" />
    </a>
  )
}
