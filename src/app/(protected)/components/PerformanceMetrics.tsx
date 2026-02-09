import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"
import { pipelineStatuses, activeStatuses, type DealStatus } from "@/lib/domain/deals/dealStatus"

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

type PerformanceMetricsData = {
  averageROI: number
  totalMonthlyCashFlow: number
  conversionRate: number
  totalDeals: number
  portfolioDeals: number
  pipelineDeals: number
  convertedDeals: number
}

export async function PerformanceMetrics() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const deals = await prisma.deal.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      status: true,
      roi: true,
      monthlyCashFlow: true,
    },
  })

  // Calcular métricas
  const portfolioDeals = deals.filter((d) => activeStatuses.includes(d.status as DealStatus))
  const pipelineDeals = deals.filter((d) => pipelineStatuses.includes(d.status as DealStatus))

  // ROI médio do portfólio (apenas deals ativos)
  const portfolioROIs = portfolioDeals.map((d) => d.roi).filter((roi) => roi > 0)
  const averageROI =
    portfolioROIs.length > 0
      ? portfolioROIs.reduce((acc, roi) => acc + roi, 0) / portfolioROIs.length
      : 0

  // Cash flow total mensal (apenas deals ativos)
  const totalMonthlyCashFlow = portfolioDeals.reduce(
    (acc, d) => acc + (d.monthlyCashFlow ?? 0),
    0
  )

  // Taxa de conversão: deals que saíram do pipeline para comprado
  // Buscar histórico de mudanças de status
  const statusChanges = await prisma.dealStatusChange.findMany({
    where: {
      deal: { userId: session.user.id },
      toStatus: "Comprado",
    },
    include: {
      deal: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  // Deals que passaram pelo pipeline e foram comprados
  const convertedDeals = statusChanges.filter((change) => {
    // Verificar se o deal já teve status de pipeline antes de ser comprado
    const deal = deals.find((d) => d.id === change.dealId)
    return deal && pipelineStatuses.includes(change.deal.fromStatus as DealStatus)
  }).length

  // Total de deals que passaram pelo pipeline (incluindo os que ainda estão lá)
  const totalPipelineDeals = pipelineDeals.length + convertedDeals
  const conversionRate = totalPipelineDeals > 0 ? convertedDeals / totalPipelineDeals : 0

  const metrics: PerformanceMetricsData = {
    averageROI,
    totalMonthlyCashFlow,
    conversionRate,
    totalDeals: deals.length,
    portfolioDeals: portfolioDeals.length,
    pipelineDeals: pipelineDeals.length,
    convertedDeals,
  }

  return (
    <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl border border-[#4F7DFF]/30 bg-[#4F7DFF]/10 grid place-items-center">
            <BarChart3 className="h-4 w-4 text-[#4F7DFF]" />
          </div>
          <CardTitle className="text-sm">Métricas de Performance</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* ROI Médio */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#7C889E]">
              <TrendingUp className="h-3 w-3" />
              <span>ROI Médio</span>
            </div>
            <div className="text-xl font-semibold text-white">
              {averageROI > 0 ? formatPercent(averageROI) : "—"}
            </div>
            <div className="text-xs text-[#7C889E]">
              {portfolioDeals.length} {portfolioDeals.length === 1 ? "imóvel" : "imóveis"} no portfólio
            </div>
          </div>

          {/* Cash Flow Total */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#7C889E]">
              <DollarSign className="h-3 w-3" />
              <span>Cash Flow Mensal</span>
            </div>
            <div className="text-xl font-semibold text-white">
              {totalMonthlyCashFlow > 0 ? formatBRL(totalMonthlyCashFlow) : "R$ 0"}
            </div>
            <div className="text-xs text-[#7C889E]">
              {formatBRL(totalMonthlyCashFlow * 12)}/ano
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#7C889E]">
              <Target className="h-3 w-3" />
              <span>Taxa de Conversão</span>
            </div>
            <div className="text-xl font-semibold text-white">
              {conversionRate > 0 ? formatPercent(conversionRate) : "—"}
            </div>
            <div className="text-xs text-[#7C889E]">
              {convertedDeals} de {totalPipelineDeals} deals convertidos
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

