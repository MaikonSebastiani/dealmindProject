'use client'

/**
 * Componente de seleção de período para relatórios
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export type ReportPeriod = 'all' | '12m' | '6m' | '3m'

interface PeriodSelectorProps {
  value: ReportPeriod
  onChange: (value: ReportPeriod) => void
  variant?: 'default' | 'card'
}

const periodLabels: Record<ReportPeriod, string> = {
  all: 'Contexto geral',
  '12m': '12 meses',
  '6m': '6 meses',
  '3m': '3 meses',
}

export function PeriodSelector({ value, onChange, variant = 'default' }: PeriodSelectorProps) {
  if (variant === 'card') {
    return (
      <Select value={value} onValueChange={onChange}>
        <Card className="bg-[#05060B] border-[#141B29] cursor-pointer hover:border-[#4F7DFF]/50 transition-colors relative">
          <SelectTrigger className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <CardContent className="p-4 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-[#7C889E]">Período</div>
                <div className="text-lg font-semibold text-white">
                  {periodLabels[value]}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <SelectContent className="bg-[#0B0F17] border-[#141B29]">
          {Object.entries(periodLabels).map(([key, label]) => (
            <SelectItem
              key={key}
              value={key}
              className="text-white focus:bg-[#141B29] focus:text-white"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-[#7C889E]" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] bg-[#0B0F17] border-[#141B29] text-white">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent className="bg-[#0B0F17] border-[#141B29]">
          {Object.entries(periodLabels).map(([key, label]) => (
            <SelectItem
              key={key}
              value={key}
              className="text-white focus:bg-[#141B29] focus:text-white"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

