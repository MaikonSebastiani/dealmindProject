'use client'

import { useState } from 'react'
import { FileText, BarChart3, Calendar, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportButton } from "./components/ExportButton"
import { PeriodSelector, type ReportPeriod } from "./components/PeriodSelector"
import { StatusFilter, type ReportStatus } from "./components/StatusFilter"
import { DealSelector } from "./components/DealSelector"

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<ReportPeriod>('all')
  const [status, setStatus] = useState<ReportStatus>('all')
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)

  return (
    <>
      <header className="bg-[#05060B] border-b border-[#141B29]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold">Relatórios</h1>
            <p className="text-xs sm:text-sm text-[#7C889E]">Análises e relatórios do seu portfólio</p>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Card Principal */}
        <Card className="bg-[#0B0F17] border-[#141B29]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Relatório de Portfólio</CardTitle>
                <p className="text-sm text-[#7C889E] mt-1">Análise completa do seu portfólio imobiliário</p>
              </div>
              <ExportButton reportType="portfolio" period={period} status={status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">

              {/* Informações do relatório */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[#05060B] border-[#141B29]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <BarChart3 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-xs text-[#7C889E]">Total Investido</div>
                          <div className="text-lg font-semibold text-white">Incluído no PDF</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <StatusFilter value={status} onChange={setStatus} variant="card" />
                  <PeriodSelector value={period} onChange={setPeriod} variant="card" />
                </div>

                {/* Descrição */}
                <div className="rounded-lg bg-[#05060B] border border-[#141B29] p-4">
                  <p className="text-sm text-[#7C889E]">
                    O relatório PDF inclui uma análise completa do seu portfólio, incluindo:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#7C889E] list-disc list-inside">
                    <li>Métricas de visão geral (Pipeline, Portfólio Ativo, Alugados, Vendidos)</li>
                    <li>Análise de rentabilidade</li>
                    <li>Tabela detalhada com todos os imóveis e suas métricas</li>
                    <li>Dados atualizados no momento da geração</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Relatório de Viabilidade */}
        <Card className="bg-[#0B0F17] border-[#141B29]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Relatório de Viabilidade</CardTitle>
                <p className="text-sm text-[#7C889E] mt-1">Análise detalhada de viabilidade de um imóvel específico</p>
              </div>
              <ExportButton 
                reportType="viability" 
                dealId={selectedDealId}
                label="Exportar PDF"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Seletor de Imóvel */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                  <DealSelector 
                    value={selectedDealId} 
                    onChange={setSelectedDealId} 
                    variant="card" 
                  />
                </div>

                {/* Descrição */}
                <div className="rounded-lg bg-[#05060B] border border-[#141B29] p-4">
                  <p className="text-sm text-[#7C889E]">
                    O relatório PDF de viabilidade inclui uma análise completa do imóvel selecionado, incluindo:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#7C889E] list-disc list-inside">
                    <li>Diagnóstico de viabilidade (Viável, Margem apertada ou Inviável)</li>
                    <li>ROI sobre capital investido (após IR)</li>
                    <li>Análise financeira detalhada (entradas, saídas, lucro líquido)</li>
                    <li>Detalhes da operação (compra, venda, custos operacionais)</li>
                    <li>Informações sobre financiamento ou parcelamento (se aplicável)</li>
                    <li>Análise de riscos do projeto</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

