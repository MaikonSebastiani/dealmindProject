import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BedDouble, Bath, Ruler, MoreHorizontal } from "lucide-react"

export function PortfolioTable() {
  return (
    <section>
      <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">Meus Imóveis</CardTitle>
          <Button size="sm" variant="outline">
            Ver todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-[#7C889E]">
                <tr className="border-b border-[#141B29]">
                  <th className="py-3 text-left">Imóvel</th>
                  <th className="py-3 text-left">Tipo</th>
                  <th className="py-3 text-left">Especificações</th>
                  <th className="py-3 text-left">Status</th>
                  <th className="py-3 text-right">Valor</th>
                  <th className="py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141B29]">
                <Row
                  title="Apartamento Luxo Centro"
                  subtitle="Av. Paulista, 1000 • São Paulo"
                  type="Residencial"
                  beds={3}
                  baths={2}
                  area="120m²"
                  status="Alugado"
                  statusTone="green"
                  value="R$ 850.000"
                  subvalue="R$ 4.200/mês"
                />
                <Row
                  title="Sala Comercial Prime"
                  subtitle="Rua Augusta, 500 • São Paulo"
                  type="Comercial"
                  beds={1}
                  baths={1}
                  area="80m²"
                  status="Alugado"
                  statusTone="green"
                  value="R$ 450.000"
                  subvalue="R$ 5.500/mês"
                />
                <Row
                  title="Casa Alto Padrão"
                  subtitle="Al. Santos, 200 • São Paulo"
                  type="Residencial"
                  beds={4}
                  baths={3}
                  area="250m²"
                  status="Disponível"
                  statusTone="blue"
                  value="R$ 1.200.000"
                  subvalue="R$ 8.000/mês"
                />
                <Row
                  title="Galpão Industrial"
                  subtitle="Rod. Anhanguera, km 35"
                  type="Industrial"
                  beds={2}
                  baths={2}
                  area="1200m²"
                  status="Alugado"
                  statusTone="green"
                  value="R$ 2.350.000"
                  subvalue="R$ 15.000/mês"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function Row(props: {
  title: string
  subtitle: string
  type: string
  beds: number
  baths: number
  area: string
  status: string
  statusTone: "green" | "blue"
  value: string
  subvalue: string
}) {
  const statusClass =
    props.statusTone === "green"
      ? "bg-[#06221B] text-[#32D583] border-[#0B3A2C]"
      : "bg-[#0B1323] text-[#4F7DFF] border-[#141B29]"

  return (
    <tr className="hover:bg-[#0B1323]/40 transition">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#0B1323] border border-[#141B29]" />
          <div className="min-w-0">
            <div className="text-sm text-white truncate">{props.title}</div>
            <div className="text-xs text-[#7C889E] truncate">{props.subtitle}</div>
          </div>
        </div>
      </td>
      <td className="py-4">
        <span className="inline-flex items-center rounded-lg border border-[#141B29] bg-[#0B1323] px-2 py-1 text-xs text-[#C7D0DF]">
          {props.type}
        </span>
      </td>
      <td className="py-4">
        <div className="flex items-center gap-3 text-xs text-[#9AA6BC]">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-4 w-4 text-[#7C889E]" /> {props.beds}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-4 w-4 text-[#7C889E]" /> {props.baths}
          </span>
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-4 w-4 text-[#7C889E]" /> {props.area}
          </span>
        </div>
      </td>
      <td className="py-4">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusClass}`}>
          {props.status}
        </span>
      </td>
      <td className="py-4 text-right">
        <div className="text-sm text-white">{props.value}</div>
        <div className="text-xs text-[#7C889E]">{props.subvalue}</div>
      </td>
      <td className="py-4 text-right">
        <button className="h-8 w-8 rounded-lg border border-[#141B29] bg-[#0B0F17] grid place-items-center">
          <MoreHorizontal className="h-4 w-4 text-[#9AA6BC]" />
        </button>
      </td>
    </tr>
  )
}
