import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PortfolioTypeDonutChart } from "./PortfolioTypeDonutChart"

export function DashboardChartGrid() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Evolução do Patrimônio</CardTitle>
            <div className="flex items-center gap-2 text-xs text-[#9AA6BC]">
              <span className="h-2 w-2 rounded-full bg-[#4F7DFF]" />
              Patrimônio
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 rounded-xl border border-[#141B29] bg-gradient-to-b from-[#0B1323]/60 to-[#0B0F17] relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(#141B29 1px, transparent 1px), linear-gradient(90deg, #141B29 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
            <svg viewBox="0 0 600 220" className="absolute inset-0 h-full w-full">
              <path
                d="M20 160 C 90 140, 120 150, 170 145 S 280 130, 330 120 S 430 105, 480 92 S 560 75, 585 70"
                fill="none"
                stroke="#4F7DFF"
                strokeWidth="3"
              />
            </svg>
            <div className="absolute left-4 top-4 text-xs text-[#7C889E]">R$</div>
            <div className="absolute right-4 bottom-4 text-xs text-[#7C889E]">Dez</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribuição por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioTypeDonutChart />
        </CardContent>
      </Card>
    </section>
  )
}
