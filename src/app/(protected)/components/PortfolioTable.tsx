import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export async function PortfolioTable() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const deals = await prisma.deal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      propertyName: true,
      propertyType: true,
      address: true,
      status: true,
      purchasePrice: true,
      resalePrice: true,
      roi: true,
      auctioneerFeePercent: true,
      expectedSaleMonths: true,
    },
  })

  if (deals.length === 0) {
    return (
      <section>
        <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Últimos Deals</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/deals/new">Novo Deal</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-[#7C889E]">
              <p>Nenhum Imovel cadastrado ainda.</p>
              <p className="text-sm mt-1">Comece analisando um novo imóvel.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section>
      <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">Últimos Deals</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/deals">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-[#7C889E]">
                <tr className="border-b border-[#141B29]">
                  <th className="py-3 text-left">Imóvel</th>
                  <th className="py-3 text-left">Tipo</th>
                  <th className="py-3 text-left">Status</th>
                  <th className="py-3 text-right">Compra</th>
                  <th className="py-3 text-right">Venda Est.</th>
                  <th className="py-3 text-right">ROI</th>
                  <th className="py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141B29]">
                {deals.map((deal) => (
                  <Row
                    key={deal.id}
                    id={deal.id}
                    title={deal.propertyName ?? "Sem nome"}
                    subtitle={deal.address ?? "—"}
                    type={deal.propertyType ?? (deal.auctioneerFeePercent ? "Leilão" : "Direto")}
                    status={deal.status}
                    purchasePrice={formatBRL(deal.purchasePrice)}
                    resalePrice={formatBRL(deal.resalePrice ?? 0)}
                    roi={deal.roi}
                    expectedMonths={deal.expectedSaleMonths ?? 12}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {deals.map((deal) => (
              <MobileCard
                key={deal.id}
                id={deal.id}
                title={deal.propertyName ?? "Sem nome"}
                subtitle={deal.address ?? "—"}
                type={deal.propertyType ?? (deal.auctioneerFeePercent ? "Leilão" : "Direto")}
                status={deal.status}
                purchasePrice={formatBRL(deal.purchasePrice)}
                resalePrice={formatBRL(deal.resalePrice ?? 0)}
                roi={deal.roi}
                expectedMonths={deal.expectedSaleMonths ?? 12}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function MobileCard(props: {
  id: string
  title: string
  subtitle: string
  type: string
  status: string
  purchasePrice: string
  resalePrice: string
  roi: number
  expectedMonths: number
}) {
  const statusClass =
    props.status === "Em análise"
      ? "bg-[#0B1323] text-[#F59E0B] border-[#141B29]"
      : props.status === "Aprovado"
        ? "bg-[#06221B] text-[#32D583] border-[#0B3A2C]"
        : "bg-[#0B1323] text-[#4F7DFF] border-[#141B29]"

  const roiPercent = (props.roi * 100).toFixed(1)
  const roiIsGood = props.roi >= 0.15
  const roiIsBad = props.roi < 0.05

  return (
    <Link
      href={`/dashboard/deals/${props.id}`}
      className="block p-4 rounded-xl border border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] transition"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-[#0B1323] border border-[#141B29] grid place-items-center text-[#7C889E] text-sm font-medium shrink-0">
          {props.title.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white truncate mb-1">{props.title}</div>
          <div className="text-xs text-[#7C889E] truncate">{props.subtitle}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center rounded-lg border border-[#141B29] bg-[#0B1323] px-2 py-1 text-xs text-[#C7D0DF]">
          {props.type}
        </span>
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${statusClass}`}>
          {props.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[#7C889E]">Compra</span>
          <span className="text-white font-medium">{props.purchasePrice}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#7C889E]">Venda Est.</span>
          <div className="text-right">
            <div className="text-white font-medium">{props.resalePrice}</div>
            <div className="text-xs text-[#7C889E]">{props.expectedMonths} meses</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#141B29]">
          <span className="text-[#7C889E]">ROI</span>
          <span className={`font-semibold ${roiIsGood ? "text-[#32D583]" : roiIsBad ? "text-[#FF5A6A]" : "text-white"}`}>
            {roiPercent}%
          </span>
        </div>
      </div>
    </Link>
  )
}

function Row(props: {
  id: string
  title: string
  subtitle: string
  type: string
  status: string
  purchasePrice: string
  resalePrice: string
  roi: number
  expectedMonths: number
}) {
  const statusClass =
    props.status === "Em análise"
      ? "bg-[#0B1323] text-[#F59E0B] border-[#141B29]"
      : props.status === "Aprovado"
        ? "bg-[#06221B] text-[#32D583] border-[#0B3A2C]"
        : "bg-[#0B1323] text-[#4F7DFF] border-[#141B29]"

  const roiPercent = (props.roi * 100).toFixed(1)
  const roiIsGood = props.roi >= 0.15
  const roiIsBad = props.roi < 0.05

  return (
    <tr className="hover:bg-[#0B1323]/40 transition">
      <td className="py-4">
        <Link href={`/dashboard/deals/${props.id}`} className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-lg bg-[#0B1323] border border-[#141B29] grid place-items-center text-[#7C889E] text-xs font-medium">
            {props.title.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white truncate group-hover:text-[#4F7DFF] transition">{props.title}</div>
            <div className="text-xs text-[#7C889E] truncate max-w-[200px]">{props.subtitle}</div>
          </div>
        </Link>
      </td>
      <td className="py-4">
        <span className="inline-flex items-center rounded-lg border border-[#141B29] bg-[#0B1323] px-2 py-1 text-xs text-[#C7D0DF]">
          {props.type}
        </span>
      </td>
      <td className="py-4">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusClass}`}>
          {props.status}
        </span>
      </td>
      <td className="py-4 text-right">
        <div className="text-sm text-white">{props.purchasePrice}</div>
      </td>
      <td className="py-4 text-right">
        <div className="text-sm text-white">{props.resalePrice}</div>
        <div className="text-xs text-[#7C889E]">{props.expectedMonths} meses</div>
      </td>
      <td className="py-4 text-right">
        <div className={`flex items-center justify-end gap-1 text-sm ${roiIsGood ? "text-[#32D583]" : roiIsBad ? "text-[#FF5A6A]" : "text-white"}`}>
          {roiIsGood ? (
            <TrendingUp className="h-4 w-4" />
          ) : roiIsBad ? (
            <TrendingDown className="h-4 w-4" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
          {roiPercent}%
        </div>
      </td>
      <td className="py-4 text-right">
        <Link
          href={`/dashboard/deals/${props.id}`}
          className="h-8 w-8 rounded-lg border border-[#141B29] bg-[#0B0F17] grid place-items-center hover:bg-[#0B1323] transition"
        >
          <MoreHorizontal className="h-4 w-4 text-[#9AA6BC]" />
        </Link>
      </td>
    </tr>
  )
}
