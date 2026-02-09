import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { DashboardHeader } from "../components/DashboardHeader"
import { KpiCard } from "../components/KpiCard"
import { DashboardChartGrid } from "../components/DashboardChartGrid"
import { PortfolioTable } from "../components/PortfolioTable"
import { PerformanceMetrics } from "../components/PerformanceMetrics"
import { Banknote, Building2, Wallet, Search, Home, BadgeCheck, Key, Percent } from "lucide-react"
import { activeStatuses, pipelineStatuses, type DealStatus } from "@/lib/domain/deals/dealStatus"
import { getPeriodStartDate, isDateInPeriod } from "@/lib/utils/dateFilters"
import type { PeriodOption } from "../components/PeriodFilter"

// Forçar revalidação a cada requisição (sem cache)
export const dynamic = "force-dynamic"

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
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
}): number {
  const resalePrice = deal.resalePrice ?? 0
  if (resalePrice <= 0) return 0

  const holdingCosts = ((deal.monthlyCondoFee ?? 0) + (deal.monthlyIptu ?? 0)) * deal.expectedSaleMonths
  const brokerFee = (deal.brokerFeePercent ?? 0) / 100 * resalePrice

  return Math.max(0, resalePrice - deal.purchasePrice - deal.acquisitionCosts - holdingCosts - brokerFee)
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const session = await auth()
  const { period } = await searchParams
  const periodOption = (period as PeriodOption) || "12m"
  const periodStartDate = getPeriodStartDate(periodOption)

  // Métricas baseadas em status
  let pipelineCount = 0 // Em análise + Aprovado
  let pipelineValue = 0
  let portfolioCount = 0 // Comprado + Em reforma + Alugado + À venda
  let portfolioValue = 0
  let soldCount = 0 // Vendido
  let rentingCount = 0 // Alugado
  let totalRentIncome = 0 // Soma do aluguel mensal dos "Alugados"
  let totalDeals = 0

  // Rentabilidade
  let rentabilidadeAnual = 0
  let rentabilidadeTotal = 0
  let mesesInvestindo = 0

  // CDI aproximado (taxa anual)
  const CDI_ANUAL = 0.1215 // 12.15% a.a.

  if (session?.user?.id) {
    // Construir filtro de data se necessário
    const dateFilter = periodStartDate
      ? {
          createdAt: {
            gte: periodStartDate,
          },
        }
      : {}

    const deals = await prisma.deal.findMany({
      where: {
        userId: session.user.id,
        ...dateFilter,
      },
      select: {
        id: true,
        status: true,
        purchasePrice: true,
        resalePrice: true,
        acquisitionCosts: true,
        monthlyCondoFee: true,
        monthlyIptu: true,
        brokerFeePercent: true,
        expectedSaleMonths: true,
        roi: true,
        monthlyRent: true,
        createdAt: true,
      },
    })

    totalDeals = deals.length

    // Pipeline: Em análise + Aprovado
    const pipelineDeals = deals.filter(d => pipelineStatuses.includes(d.status as DealStatus))
    pipelineCount = pipelineDeals.length
    pipelineValue = pipelineDeals.reduce((acc, d) => acc + d.purchasePrice, 0)

    // Portfólio Ativo: Comprado + Em reforma + Alugado + À venda
    const portfolioDeals = deals.filter(d => activeStatuses.includes(d.status as DealStatus))
    portfolioCount = portfolioDeals.length
    portfolioValue = portfolioDeals.reduce((acc, d) => acc + d.purchasePrice, 0)

    // Vendidos
    const soldDeals = deals.filter(d => d.status === "Vendido")
    soldCount = soldDeals.length

    // Alugados
    const rentingDeals = deals.filter(d => d.status === "Alugado")
    rentingCount = rentingDeals.length
    totalRentIncome = rentingDeals.reduce((acc, d) => acc + (d.monthlyRent ?? 0), 0)

    // ===== Calcular Rentabilidade =====
    // Buscar primeira compra para determinar tempo de investimento
    const primeiraCompra = await prisma.dealStatusChange.findFirst({
      where: {
        deal: { userId: session.user.id },
        toStatus: "Comprado",
      },
      orderBy: { changedAt: "asc" },
    })

    if (primeiraCompra) {
      const dataInicio = primeiraCompra.changedAt
      const agora = new Date()
      mesesInvestindo = Math.max(1, Math.round(
        (agora.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30)
      ))

      // Calcular lucro total realizado (vendas)
      const lucroRealizado = soldDeals.reduce((acc, d) => acc + calculateDealProfit(d), 0)

      // Capital inicial = primeiro investimento (aproximação: soma das compras dos vendidos)
      // Para simplificar: usamos o valor do primeiro deal comprado
      const primeiroDeal = await prisma.deal.findFirst({
        where: { 
          userId: session.user.id,
          status: { in: ["Comprado", "Em reforma", "Alugado", "À venda", "Vendido"] }
        },
        orderBy: { createdAt: "asc" },
        select: { purchasePrice: true, acquisitionCosts: true },
      })

      // Estimar capital inicial baseado no primeiro período
      // Buscar todas as compras do primeiro mês
      const comprasIniciais = await prisma.dealStatusChange.findMany({
        where: {
          deal: { userId: session.user.id },
          toStatus: "Comprado",
          changedAt: {
            lte: new Date(dataInicio.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 dias
          },
        },
        include: {
          deal: { select: { purchasePrice: true, acquisitionCosts: true } },
        },
      })

      const capitalInicial = comprasIniciais.reduce(
        (acc, c) => acc + c.deal.purchasePrice + c.deal.acquisitionCosts, 
        0
      ) || primeiroDeal?.purchasePrice || 0

      if (capitalInicial > 0) {
        // Patrimônio atual = carteira + lucros realizados
        const patrimonioAtual = portfolioValue + lucroRealizado

        // Rentabilidade total
        rentabilidadeTotal = (patrimonioAtual / capitalInicial) - 1

        // Rentabilidade anualizada: ((1 + total)^(12/meses)) - 1
        if (mesesInvestindo >= 1) {
          rentabilidadeAnual = Math.pow(1 + rentabilidadeTotal, 12 / mesesInvestindo) - 1
        }
      }
    }
  }

  return (
    <>
      <DashboardHeader 
        userName={session?.user?.name ?? "Usuário"} 
        userEmail={session?.user?.email ?? undefined}
      />

      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Métricas de Performance */}
        <PerformanceMetrics />

        {/* KPIs principais */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <KpiCard
            title="Pipeline"
            value={String(pipelineCount)}
            delta={pipelineCount > 0 ? formatBRL(pipelineValue) : "Nenhum deal"}
            icon={Search}
          />
          <KpiCard
            title="Portfólio Ativo"
            value={String(portfolioCount)}
            delta={portfolioCount > 0 ? formatBRL(portfolioValue) : "Nenhum deal"}
            icon={Home}
          />
          <KpiCard
            title="Alugados"
            value={String(rentingCount)}
            delta={rentingCount > 0 ? `${formatBRL(totalRentIncome)}/mês` : "Nenhum alugado"}
            icon={Key}
          />
          <KpiCard
            title="Vendidos"
            value={String(soldCount)}
            delta={"Imóveis vendidos"}
            icon={BadgeCheck}
          />
        </section>

        {/* KPIs secundários */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <KpiCard
            title="Total de Imóveis"
            value={String(totalDeals)}
            delta="Todos os status"
            icon={Building2}
          />
          <KpiCard
            title="Capital Investido"
            value={formatBRL(portfolioValue)}
            delta="Em portfólio ativo"
            icon={Banknote}
          />
          <KpiCard
            title="Rentabilidade"
            value={`${(rentabilidadeAnual * 100).toFixed(0)}% a.a.`}
            delta="Rentabilidade anualizada"
            icon={Percent}
            highlight={rentabilidadeAnual > CDI_ANUAL}
          />
          <KpiCard
            title="Renda Passiva"
            value={formatBRL(totalRentIncome)}
            delta={rentingCount > 0 ? `${rentingCount} imóvel(is)` : "Nenhum alugado"}
            icon={Wallet}
          />
        </section>

        <DashboardChartGrid />
        <PortfolioTable />
      </div>
    </>
  )
}
