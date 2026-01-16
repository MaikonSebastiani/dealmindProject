import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { DashboardHeader } from "../components/DashboardHeader"
import { KpiCard } from "../components/KpiCard"
import { DashboardChartGrid } from "../components/DashboardChartGrid"
import { TransactionsPanel } from "../components/TransactionsPanel"
import { PortfolioTable } from "../components/PortfolioTable"
import { Banknote, Building2, TrendingUp, Wallet, Search, Home, BadgeCheck, Key } from "lucide-react"
import { activeStatuses, pipelineStatuses } from "@/lib/domain/deals/dealStatus"

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export default async function DashboardPage() {
  const session = await auth()

  // Métricas baseadas em status
  let pipelineCount = 0 // Em análise + Aprovado
  let pipelineValue = 0
  let portfolioCount = 0 // Comprado + Em reforma + Alugado + À venda
  let portfolioValue = 0
  let soldCount = 0 // Vendido
  let rentingCount = 0 // Alugado
  let totalRentIncome = 0 // Soma do aluguel mensal dos "Alugados"
  let averageRoi = 0
  let totalDeals = 0

  if (session?.user?.id) {
    const deals = await prisma.deal.findMany({
      where: { userId: session.user.id },
      select: {
        status: true,
        purchasePrice: true,
        resalePrice: true,
        roi: true,
        monthlyRent: true,
      },
    })

    totalDeals = deals.length

    // Pipeline: Em análise + Aprovado
    const pipelineDeals = deals.filter(d => pipelineStatuses.includes(d.status as any))
    pipelineCount = pipelineDeals.length
    pipelineValue = pipelineDeals.reduce((acc, d) => acc + d.purchasePrice, 0)

    // Portfólio Ativo: Comprado + Em reforma + Alugado + À venda
    const portfolioDeals = deals.filter(d => activeStatuses.includes(d.status as any))
    portfolioCount = portfolioDeals.length
    portfolioValue = portfolioDeals.reduce((acc, d) => acc + d.purchasePrice, 0)

    // Vendidos
    const soldDeals = deals.filter(d => d.status === "Vendido")
    soldCount = soldDeals.length

    // Alugados
    const rentingDeals = deals.filter(d => d.status === "Alugado")
    rentingCount = rentingDeals.length
    totalRentIncome = rentingDeals.reduce((acc, d) => acc + (d.monthlyRent ?? 0), 0)

    // ROI médio (considerando todos os deals)
    averageRoi = totalDeals > 0
      ? deals.reduce((acc, d) => acc + d.roi, 0) / totalDeals
      : 0
  }

  return (
    <>
      <DashboardHeader 
        userName={session?.user?.name ?? "Usuário"} 
        userEmail={session?.user?.email ?? undefined}
      />

      <div className="px-10 py-6 space-y-6">
        {/* KPIs principais */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            title="Realizados"
            value={String(soldCount)}
            delta={soldCount > 0 ? `${soldCount} vendido(s)` : "Nenhum vendido"}
            icon={BadgeCheck}
          />
        </section>

        {/* KPIs secundários */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total de Deals"
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
            title="ROI Médio"
            value={`${(averageRoi * 100).toFixed(1)}%`}
            delta={averageRoi >= 0.15 ? "Bom" : averageRoi >= 0.10 ? "Médio" : "Baixo"}
            icon={TrendingUp}
          />
          <KpiCard
            title="Renda Passiva"
            value={formatBRL(totalRentIncome)}
            delta={rentingCount > 0 ? `${rentingCount} imóvel(is)` : "Nenhum alugado"}
            icon={Wallet}
          />
        </section>

        <DashboardChartGrid />
        <TransactionsPanel />
        <PortfolioTable />
      </div>
    </>
  )
}
