'use client'

/**
 * Componente de botão para exportar relatório PDF
 * Client component para gerenciar estado de loading
 */

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReportPeriod } from './PeriodSelector'
import type { ReportStatus } from './StatusFilter'

interface ExportButtonProps {
  reportType: 'portfolio' | 'performance' | 'viability'
  period?: ReportPeriod
  status?: ReportStatus
  dealId?: string | null
  label?: string
}

export function ExportButton({ 
  reportType, 
  period, 
  status = 'all', 
  dealId,
  label = 'Exportar PDF' 
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    // Validação para relatório de viabilidade
    if (reportType === 'viability' && !dealId) {
      alert('Por favor, selecione um imóvel para gerar o relatório de viabilidade.')
      return
    }

    setIsLoading(true)
    try {
      const url = new URL(`/api/reports/${reportType}`, window.location.origin)
      
      if (reportType === 'viability') {
        url.searchParams.set('dealId', dealId!)
      } else {
        if (period) {
          url.searchParams.set('period', period)
        }
        if (status && status !== 'all') {
          url.searchParams.set('status', status)
        }
      }
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error('Erro ao gerar relatório')
      }

      // Criar blob e fazer download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      alert('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      className="bg-[#4F7DFF] hover:bg-[#4F7DFF]/90 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}

