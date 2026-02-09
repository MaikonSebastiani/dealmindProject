'use client'

/**
 * Componente de filtro de status para relatórios
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tag, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { dealStatuses, type DealStatus } from '@/lib/domain/deals/dealStatus'

export type ReportStatus = DealStatus | 'all'

interface StatusFilterProps {
  value: ReportStatus
  onChange: (value: ReportStatus) => void
  variant?: 'default' | 'card'
}

const statusLabels: Record<ReportStatus, string> = {
  all: 'Todos os imóveis',
  'Em análise': 'Em análise',
  'Aprovado': 'Aprovado',
  'Comprado': 'Comprado',
  'Em reforma': 'Em reforma',
  'Alugado': 'Alugado',
  'À venda': 'À venda',
  'Vendido': 'Vendido',
  'Arquivado': 'Arquivado',
}

export function StatusFilter({ value, onChange, variant = 'default' }: StatusFilterProps) {
  if (variant === 'card') {
    return (
      <Select value={value} onValueChange={onChange}>
        <Card className="bg-[#05060B] border-[#141B29] cursor-pointer hover:border-[#4F7DFF]/50 transition-colors relative">
          <SelectTrigger className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <CardContent className="p-4 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Tag className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-[#7C889E] mb-1">Status</div>
                <div className="text-lg font-semibold text-white">
                  {statusLabels[value]}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-[#7C889E] shrink-0" />
            </div>
          </CardContent>
        </Card>
        <SelectContent className="bg-[#0B0F17] border-[#141B29]">
          {(['all', ...dealStatuses] as ReportStatus[]).map((status) => (
            <SelectItem
              key={status}
              value={status}
              className="text-white focus:bg-[#141B29] focus:text-white"
            >
              {statusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Tag className="h-4 w-4 text-[#7C889E]" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] bg-[#0B0F17] border-[#141B29] text-white">
          <SelectValue placeholder="Selecione o status" />
        </SelectTrigger>
        <SelectContent className="bg-[#0B0F17] border-[#141B29]">
          {(['all', ...dealStatuses] as ReportStatus[]).map((status) => (
            <SelectItem
              key={status}
              value={status}
              className="text-white focus:bg-[#141B29] focus:text-white"
            >
              {statusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

