import { auth } from "@/auth"
import { DashboardHeader } from "../components/DashboardHeader"
import { KpiCard } from "../components/KpiCard"
import { DashboardChartGrid } from "../components/DashboardChartGrid"
import { TransactionsPanel } from "../components/TransactionsPanel"
import { PortfolioTable } from "../components/PortfolioTable"
import { Banknote, Building2, Percent, Wallet } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <>
      <DashboardHeader userName={session?.user?.name ?? "João Dias"} />

      <div className="px-10 py-6 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Patrimônio Total" value="R$ 4.850.000" delta="+12.5%" icon={Banknote} />
          <KpiCard title="Imóveis no Portfólio" value="12" delta="+2 este ano" icon={Building2} />
          <KpiCard title="Rentabilidade Média" value="8.7%" delta="+1.2%" icon={Percent} />
          <KpiCard title="Renda Mensal" value="R$ 32.400" delta="-2.1%" negative icon={Wallet} />
        </section>

        <DashboardChartGrid />
        <TransactionsPanel />
        <PortfolioTable />
      </div>
    </>
  )
}


