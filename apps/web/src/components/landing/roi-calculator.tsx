'use client'

import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'

export default function ROICalculator() {
  const [messagesPerDay, setMessagesPerDay] = useState(50)
  const [timePerMessage, setTimePerMessage] = useState(3)
  const [hourlyCost, setHourlyCost] = useState(25)

  const manualTime = (messagesPerDay * timePerMessage) / 60
  const manualCost = manualTime * hourlyCost
  const automatedPercent = 0.6
  const savedTime = manualTime * automatedPercent
  const savedCost = manualCost * automatedPercent
  const monthlySaved = savedCost * 22

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">Quanto você economiza?</h3>
      </div>
      <p className="text-slate-600 text-sm mb-6">
        Ajuste os valores e veja o impacto da automação no seu tempo e custo.
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mensagens por dia</label>
          <input
            type="range"
            min="10"
            max="200"
            value={messagesPerDay}
            onChange={(e) => setMessagesPerDay(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <span className="text-sm font-semibold text-indigo-600">{messagesPerDay}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Minutos por mensagem (manual)</label>
          <input
            type="range"
            min="1"
            max="10"
            value={timePerMessage}
            onChange={(e) => setTimePerMessage(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <span className="text-sm font-semibold text-indigo-600">{timePerMessage} min</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Custo/hora do atendente (R$)</label>
          <input
            type="range"
            min="15"
            max="80"
            value={hourlyCost}
            onChange={(e) => setHourlyCost(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <span className="text-sm font-semibold text-indigo-600">R$ {hourlyCost}</span>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold text-emerald-800">Economia estimada</span>
        </div>
        <p className="text-2xl font-bold text-emerald-700">R$ {Math.round(monthlySaved).toLocaleString('pt-BR')}/mês</p>
        <p className="text-xs text-emerald-600 mt-1">
          ~{Math.round(savedTime * 22)} horas economizadas por mês com automação
        </p>
      </div>
    </div>
  )
}
