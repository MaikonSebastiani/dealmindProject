import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TransactionItem } from "./TransactionItem"

export function TransactionsPanel() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">ROI Mensal (%)</CardTitle>
            <div className="text-xs text-[#7C889E]">Média: 8.2%</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 rounded-xl border border-[#141B29] bg-gradient-to-b from-[#0B1323]/60 to-[#0B0F17] relative overflow-hidden">
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(#141B29 1px, transparent 1px)", backgroundSize: "100% 48px" }} />
            <div className="absolute inset-x-6 bottom-6 top-8 flex items-end gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-md bg-[#5B6CFF]"
                  style={{ height: `${45 + (i % 4) * 10}%`, opacity: 0.9 }}
                />
              ))}
            </div>
          </div>
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
