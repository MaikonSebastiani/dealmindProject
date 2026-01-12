import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TransactionItem } from "./TransactionItem"
import { RoiMonthlyChart } from "./RoiMonthlyChart"

const roiBars = [
  { month: "Jan", roi: 7.2 },
  { month: "Fev", roi: 7.8 },
  { month: "Mar", roi: 6.9 },
  { month: "Abr", roi: 8.3 },
  { month: "Mai", roi: 8.8 },
  { month: "Jun", roi: 9.1 },
  { month: "Jul", roi: 8.4 },
  { month: "Ago", roi: 8.9 },
  { month: "Set", roi: 9.4 },
  { month: "Out", roi: 8.7 },
  { month: "Nov", roi: 8.1 },
  { month: "Dez", roi: 8.5 },
]

export function TransactionsPanel() {
  const average =
    Math.round((roiBars.reduce((acc, b) => acc + b.roi, 0) / roiBars.length) * 10) / 10

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">ROI Mensal (%)</CardTitle>
            <div className="text-xs text-[#7C889E]">Média: {average}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <RoiMonthlyChart bars={roiBars} />
        </CardContent>
      </Card>

      <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">Transações Recentes</CardTitle>
          <Button size="sm" variant="outline">
            Ver todas
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <TransactionItem label="Aluguel - Apartamento Centro" subtitle="Hoje" value="+R$ 3.200" />
          <TransactionItem label="Manutenção - Casa Jardins" subtitle="Ontem" value="-R$ 850" negative />
          <TransactionItem label="Aluguel - Sala Comercial" subtitle="05 Jan" value="+R$ 5.500" />
          <TransactionItem label="Aluguel - Galpão Industrial" subtitle="04 Jan" value="+R$ 12.000" />
          <TransactionItem label="IPTU - Apartamento Sul" subtitle="03 Jan" value="-R$ 2.100" negative />
        </CardContent>
      </Card>
    </section>
  )
}
