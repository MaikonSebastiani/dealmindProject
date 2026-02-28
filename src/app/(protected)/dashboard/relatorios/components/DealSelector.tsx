'use client'

import { useEffect, useState } from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

export interface DealOption {
  id: string
  name: string
  address?: string | null
}

interface DealSelectorProps {
  value: string | null
  onChange: (value: string | null) => void
  variant?: 'default' | 'card'
}

export function DealSelector({ value, onChange, variant = 'default' }: DealSelectorProps) {
  const [deals, setDeals] = useState<DealOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDeals() {
      try {
        const response = await fetch('/api/deals?pageSize=1000')
        if (!response.ok) throw new Error('Erro ao buscar imóveis')
        
        const data = await response.json()
        const dealsList: DealOption[] = data.data.map((deal: any) => ({
          id: deal.id,
          name: deal.propertyName || 'Imóvel sem nome',
          address: deal.address,
        }))
        
        setDeals(dealsList)
      } catch (error) {
        console.error('Erro ao buscar imóveis:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeals()
  }, [])

  const selectedDeal = deals.find(d => d.id === value)
  const displayText = selectedDeal 
    ? selectedDeal.name 
    : 'Selecione um imóvel'

  if (variant === 'card') {
    return (
      <Select 
        value={value || ''} 
        onValueChange={(val) => onChange(val || null)}
        disabled={isLoading}
      >
        <Card className="bg-[#05060B] border-[#141B29] cursor-pointer hover:border-[#4F7DFF]/50 transition-colors relative">
          <SelectTrigger className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <CardContent className="p-4 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Building2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#7C889E] mb-1">Imóvel</div>
                <div className="text-lg font-semibold text-white truncate">
                  {isLoading ? 'Carregando...' : displayText}
                </div>
                {selectedDeal?.address && (
                  <div className="text-xs text-[#7C889E] truncate mt-0.5">
                    {selectedDeal.address}
                  </div>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-[#7C889E] shrink-0" />
            </div>
          </CardContent>
        </Card>
        <SelectContent className="bg-[#0B0F17] border-[#141B29] max-h-[300px]">
          {deals.length === 0 ? (
            <SelectItem value="none" disabled>
              {isLoading ? 'Carregando imóveis...' : 'Nenhum imóvel encontrado'}
            </SelectItem>
          ) : (
            deals.map((deal) => (
              <SelectItem
                key={deal.id}
                value={deal.id}
                className="text-white focus:bg-[#141B29] focus:text-white"
              >
                <div className="flex flex-col">
                  <span>{deal.name}</span>
                  {deal.address && (
                    <span className="text-xs text-[#7C889E]">{deal.address}</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    )
  }

  // Variant default (select simples)
  return (
    <Select 
      value={value || ''} 
      onValueChange={(val) => onChange(val || null)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-full">
        {isLoading ? 'Carregando...' : displayText}
      </SelectTrigger>
      <SelectContent>
        {deals.length === 0 ? (
          <SelectItem value="none" disabled>
            {isLoading ? 'Carregando imóveis...' : 'Nenhum imóvel encontrado'}
          </SelectItem>
        ) : (
          deals.map((deal) => (
            <SelectItem key={deal.id} value={deal.id}>
              {deal.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

