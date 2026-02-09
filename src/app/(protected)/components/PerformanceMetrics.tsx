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
  saleRate: number
  totalDeals: number
  portfolioDeals: number
  dealsForSale: number
  soldDeals: number
}

export async function PerformanceMetrics() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  // Métricas de performance sempre consideram TODOS os deals (sem filtro de período)
  // O filtro de período é usado apenas para visualizações, não para métricas agregadas
  // IMPORTANTE: Sem take/limit - busca TODOS os deals do usuário
  const deals = await prisma.deal.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      status: true,
      roi: true,
      monthlyCashFlow: true,
      createdAt: true,
    },
    // Sem orderBy, take ou skip - busca todos os registros
  })

  // Calcular métricas
  // Considerar TODOS os deals para métricas (não apenas ativos)
  // ROI médio: considerar todos os deals com ROI > 0
  const allDealsWithROI = deals.filter((d) => d.roi > 0)
  const averageROI =
    allDealsWithROI.length > 0
      ? allDealsWithROI.reduce((acc, d) => acc + d.roi, 0) / allDealsWithROI.length
      : 0

  // Cash flow total mensal: apenas deals ativos (que estão gerando renda)
  const portfolioDeals = deals.filter((d) => activeStatuses.includes(d.status as DealStatus))
  const totalMonthlyCashFlow = portfolioDeals.reduce(
    (acc, d) => acc + (d.monthlyCashFlow ?? 0),
    0
  )

  // Taxa de Venda: deals que estão ou estiveram "Vendido"
  // Contar deals vendidos diretamente (status atual = "Vendido")
  const soldDeals = deals.filter((d) => d.status === "Vendido").length

  // Total de deals que estiveram ou estão à venda OU foram vendidos
  // Inclui: "À venda" (ainda à venda) + "Vendido" (já vendidos)
  const dealsForSale = deals.filter((d) => 
    d.status === "À venda" || d.status === "Vendido"
  ).length

  // Taxa de venda: deals vendidos / total de deals à venda (incluindo os já vendidos)
  // Se não há deals à venda/vendidos, taxa é 0
  const saleRate = dealsForSale > 0 ? soldDeals / dealsForSale : 0

  const metrics: PerformanceMetricsData = {
    averageROI,
    totalMonthlyCashFlow,
    saleRate,
    totalDeals: deals.length,
    portfolioDeals: portfolioDeals.length,
    dealsForSale,
    soldDeals,
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
              {allDealsWithROI.length} {allDealsWithROI.length === 1 ? "imóvel" : "imóveis"} analisados
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

          {/* Taxa de Venda */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#7C889E]">
              <Target className="h-3 w-3" />
              <span>Taxa de Venda</span>
            </div>
            <div className="text-xl font-semibold text-white">
              {saleRate > 0 ? formatPercent(saleRate) : "—"}
            </div>
            <div className="text-xs text-[#7C889E]">
              {soldDeals} de {dealsForSale} {dealsForSale === 1 ? "deal vendido" : "deals vendidos"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

