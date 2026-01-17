import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PortfolioTypeDonutChart } from "./PortfolioTypeDonutChart"
import { PortfolioEvolutionChart } from "./PortfolioEvolutionChart"
import { TopDealsRanking, type TopDeal } from "./TopDealsRanking"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"

type PropertyTypeSegment = {
  label: "Casa" | "Apartamento" | "Lote" | "Comercial"
  percent: number
  color: string
}

type EvolutionDataPoint = {
  month: string
  value: number
  label: string
}

// Calcular lucro de um deal vendido
function calculateDealProfit(deal: {
  purchasePrice: number
  resalePrice: number | null
  acquisitionCosts: number
  monthlyCondoFee: number | null
  monthlyIptu: number | null
  brokerFeePercent: number | null
  expectedSaleMonths: number
  renovationCosts: number | null
}): number {
  const resalePrice = deal.resalePrice ?? 0
  if (resalePrice <= 0) return 0

  const holdingCosts = ((deal.monthlyCondoFee ?? 0) + (deal.monthlyIptu ?? 0)) * deal.expectedSaleMonths
  const brokerFee = (deal.brokerFeePercent ?? 0) / 100 * resalePrice
  const renovationCosts = deal.renovationCosts ?? 0

  const profit = resalePrice - deal.purchasePrice - deal.acquisitionCosts - holdingCosts - brokerFee - renovationCosts
  // Desconto IR de 15% sobre lucro
  const incomeTax = profit > 0 ? profit * 0.15 : 0
  
  return Math.max(0, profit - incomeTax)
}

const typeColors: Record<string, string> = {
  Apartamento: "#4F7DFF",
  Casa: "#22C55E",
  Comercial: "#F59E0B",
  Lote: "#EC4899",
}

// Status que indicam que o imóvel está no patrimônio
const portfolioStatuses = ["Comprado", "Em reforma", "Alugado", "À venda", "Vendido"]

// Formatar mês/ano
function formatMonthYear(date: Date): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return `${months[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`
}

function formatMonthYearFull(date: Date): string {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  return `${months[date.getMonth()]}/${date.getFullYear()}`
}

export async function DashboardChartGrid() {
  const session = await auth()

  let segments: PropertyTypeSegment[] = []
  let evolutionData: EvolutionDataPoint[] = []
  let topDeals: TopDeal[] = []

  if (session?.user?.id) {
    // Buscar deals com tipo de imóvel
    const deals = await prisma.deal.findMany({
      where: { userId: session.user.id },
      select: { 
        id: true,
        propertyType: true,
        purchasePrice: true,
      },
    })

    // ======= Top Deals por Lucro (Vendidos) =======
    const soldDeals = await prisma.deal.findMany({
      where: { 
        userId: session.user.id,
        status: "Vendido",
      },
      select: {
        id: true,
        propertyName: true,
        propertyType: true,
        purchasePrice: true,
        resalePrice: true,
        acquisitionCosts: true,
        monthlyCondoFee: true,
        monthlyIptu: true,
        brokerFeePercent: true,
        expectedSaleMonths: true,
        renovationCosts: true,
        roi: true,
      },
    })

    // Calcular lucro e ordenar por maior lucro
    topDeals = soldDeals
      .map(deal => ({
        id: deal.id,
        name: deal.propertyName ?? "Sem nome",
        propertyType: deal.propertyType ?? "Apartamento",
        profit: calculateDealProfit(deal),
        roi: deal.roi ?? 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 3)

    // ======= Gráfico de Distribuição por Tipo =======
    const typeCounts: Record<string, number> = {}
    for (const deal of deals) {
      const type = deal.propertyType ?? "Apartamento"
      typeCounts[type] = (typeCounts[type] ?? 0) + 1
    }

    const total = deals.length

    if (total > 0) {
      segments = Object.entries(typeCounts)
        .map(([type, count]) => ({
          label: type as PropertyTypeSegment["label"],
          percent: Math.round((count / total) * 100),
          color: typeColors[type] ?? "#7C889E",
        }))
        .sort((a, b) => b.percent - a.percent)
    }

    // ======= Gráfico de Evolução do Patrimônio =======
    // Buscar todas as mudanças de status para "Comprado" (entrada no patrimônio)
    const statusChanges = await prisma.dealStatusChange.findMany({
      where: {
        deal: { userId: session.user.id },
        toStatus: { in: portfolioStatuses },
      },
      include: {
        deal: {
          select: { purchasePrice: true },
        },
      },
      orderBy: { changedAt: "asc" },
    })

    // Criar mapa de deal -> preço e data de entrada no patrimônio
    const dealEntryMap = new Map<string, { price: number; date: Date }>()
    
    for (const change of statusChanges) {
      // Só considerar a primeira vez que o deal entrou no portfólio
      if (!dealEntryMap.has(change.dealId)) {
        dealEntryMap.set(change.dealId, {
          price: change.deal.purchasePrice,
          date: change.changedAt,
        })
      }
    }

    // Agrupar por mês/ano e calcular valor acumulado
    const monthlyData = new Map<string, { date: Date; total: number }>()
    let runningTotal = 0

    // Ordenar por data
    const entries = Array.from(dealEntryMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )

    for (const entry of entries) {
      const monthKey = formatMonthYear(entry.date)
      runningTotal += entry.price

      // Atualizar ou criar entrada do mês
      const existing = monthlyData.get(monthKey)
      if (existing) {
        existing.total = runningTotal
      } else {
        monthlyData.set(monthKey, { date: entry.date, total: runningTotal })
      }
    }

    // Converter para array ordenado
    evolutionData = Array.from(monthlyData.entries())
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([month, data]) => ({
        month,
        value: data.total,
        label: formatMonthYearFull(data.date),
      }))
  }

  return (
    <section className="space-y-6">
      {/* Linha 1: Gráfico de Evolução + Distribuição por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[#0B0F17] border-[#141B29] rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Evolução do Patrimônio</CardTitle>
              <div className="flex items-center gap-2 text-xs text-[#9AA6BC]">
                <span className="h-2 w-2 rounded-full bg-[#4F7DFF]" />
                Capital investido
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PortfolioEvolutionChart data={evolutionData.length > 0 ? evolutionData : undefined} />
          </CardContent>
        </Card>

        <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribuição por Tipo de Imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioTypeDonutChart segments={segments.length > 0 ? segments : undefined} />
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Top Deals */}
      <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">🏆 Top Deals por Lucro</CardTitle>
            <span className="text-xs text-[#7C889E]">Realizações</span>
          </div>
        </CardHeader>
        <CardContent>
          <TopDealsRanking deals={topDeals.length > 0 ? topDeals : undefined} />
        </CardContent>
      </Card>
    </section>
  )
}
