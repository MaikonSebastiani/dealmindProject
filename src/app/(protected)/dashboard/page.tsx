import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { DashboardHeader } from "../components/DashboardHeader"
import { KpiCard } from "../components/KpiCard"
import { DashboardChartGrid } from "../components/DashboardChartGrid"
import { TransactionsPanel } from "../components/TransactionsPanel"
import { PortfolioTable } from "../components/PortfolioTable"
import { Banknote, Building2, Percent, Wallet } from "lucide-react"

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export default async function DashboardPage() {
  const session = await auth()

  // Buscar métricas do usuário logado
  let totalDeals = 0
  let totalPurchaseValue = 0
  let totalResaleValue = 0
  let averageRoi = 0
  let dealsWithAuction = 0

  if (session?.user?.id) {
    const deals = await prisma.deal.findMany({
      where: { userId: session.user.id },
      select: {
        purchasePrice: true,
        resalePrice: true,
        roi: true,
        auctioneerFeePercent: true,
      },
    })

    totalDeals = deals.length
    totalPurchaseValue = deals.reduce((acc, d) => acc + d.purchasePrice, 0)
    totalResaleValue = deals.reduce((acc, d) => acc + (d.resalePrice ?? 0), 0)
    averageRoi = totalDeals > 0 
      ? deals.reduce((acc, d) => acc + d.roi, 0) / totalDeals 
      : 0
    dealsWithAuction = deals.filter(d => d.auctioneerFeePercent && d.auctioneerFeePercent > 0).length
  }

  const potentialProfit = totalResaleValue - totalPurchaseValue

  return (
    <>
      <DashboardHeader userName={session?.user?.name ?? "Usuário"} />

      <div className="px-10 py-6 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Valor Total em Análise" 
            value={formatBRL(totalPurchaseValue)} 
            delta={`${totalDeals} deals`}
            icon={Banknote} 
          />
          <KpiCard 
            title="Deals Cadastrados" 
            value={String(totalDeals)} 
            delta={`${dealsWithAuction} de leilão`}
            icon={Building2} 
          />
          <KpiCard 
            title="ROI Médio" 
            value={`${(averageRoi * 100).toFixed(1)}%`} 
            delta={averageRoi >= 0.15 ? "Bom" : averageRoi >= 0.10 ? "Médio" : "Baixo"}
            icon={Percent} 
          />
          <KpiCard 
            title="Lucro Potencial" 
            value={formatBRL(potentialProfit)} 
            delta={potentialProfit > 0 ? "Positivo" : "Negativo"}
            negative={potentialProfit < 0}
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
