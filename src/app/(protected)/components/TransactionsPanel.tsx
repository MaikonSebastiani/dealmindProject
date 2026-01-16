import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TransactionItem } from "./TransactionItem"

export function TransactionsPanel() {
  return (
    <section>
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
