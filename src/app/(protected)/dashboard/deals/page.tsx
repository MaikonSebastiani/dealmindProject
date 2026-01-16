import Link from "next/link"
import { Search, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"
import { calculateProjectViability } from "@/lib/domain/finance/calculateProjectViability"
import type { ProjectInput } from "@/lib/domain/deals/projectInput"

type ViabilityStatus = "Viável" | "Margem apertada" | "Inviável"

type DealListItem = {
  id: string
  name: string
  propertyType: string
  purchasePrice: number
  profit: number
  roi: number
  capitalNeeded: number
  viability: ViabilityStatus
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function ViabilityPill({ viability }: { viability: ViabilityStatus }) {
  const cls =
    viability === "Viável"
      ? "bg-[#06221B] text-[#32D583] border-[#0B3A2C]"
      : viability === "Margem apertada"
        ? "bg-[#0B1323] text-[#F59E0B] border-[#141B29]"
        : "bg-[#2A0B12] text-[#FF5A6A] border-[#3A0B16]"

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${cls}`}>
      {viability}
    </span>
  )
}

function DealRow({ deal }: { deal: DealListItem }) {
  const href = `/dashboard/deals/${deal.id}`
  return (
    <tr className="hover:bg-[#0B1323]/40 transition">
      <td className="p-0">
        <Link href={href} className="block py-4 text-sm text-white hover:underline">
          {deal.name}
        </Link>
      </td>
      <td className="p-0">
        <Link href={href} className="block py-4">
          <span className="inline-flex items-center rounded-lg border border-[#141B29] bg-[#0B1323] px-2 py-1 text-xs text-[#C7D0DF]">
            {deal.propertyType}
          </span>
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link href={href} className="block py-4 text-sm text-white hover:text-white/90">
          {formatBRL(deal.purchasePrice)}
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link href={href} className="block py-4 text-sm">
          <span className={deal.profit < 0 ? "text-[#FF5A6A]" : "text-[#32D583]"}>
            {formatBRL(deal.profit)}
          </span>
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link href={href} className="block py-4 text-sm text-white">
          {formatPercent(deal.roi)}
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link href={href} className="block py-4 text-sm text-white">
          {formatBRL(deal.capitalNeeded)}
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link href={href} className="block py-4">
          <ViabilityPill viability={deal.viability} />
        </Link>
      </td>
      <td className="p-0 text-right">
        <Link href={href} className="block py-4 text-xs text-[#9AA6BC] hover:text-white">
          Ver
        </Link>
      </td>
    </tr>
  )
}

function DealsSkeleton() {
  return (
    <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Deals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-[#0B1323]/60 border border-[#141B29] animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
      <CardContent className="py-10">
        <div className="max-w-md mx-auto text-center space-y-3">
          <div className="text-base font-semibold text-white">Nenhum deal cadastrado</div>
          <div className="text-sm text-[#7C889E]">
            Crie seu primeiro deal para começar a acompanhar ROI, cash flow e risco.
          </div>
          <Button asChild className="bg-[#4F7DFF] hover:bg-[#2D5BFF]">
            <Link href="/dashboard/deals/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Deal
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DealsPage() {
  const session = await auth()

  const items =
    session?.user?.id
      ? await prisma.deal.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      : []

  const deals: DealListItem[] = items.map((d) => {
    const input: ProjectInput = {
      acquisition: {
        purchasePrice: d.purchasePrice,
        downPaymentPercent: d.downPaymentPercent ?? 0,
        auctioneerFeePercent: d.auctioneerFeePercent ?? undefined,
        itbiPercent: d.itbiPercent ?? 0,
        registryCost: d.registryCost ?? 0,
      },
      financing: d.financingEnabled
        ? {
            enabled: true,
            interestRateAnnual: d.interestRateAnnual ?? 0,
            termMonths: d.termMonths ?? 0,
            amortizationType: (d.amortizationType === "SAC" ? "SAC" : "PRICE") as any,
          }
        : undefined,
      liabilities: {
        iptuDebt: d.iptuDebt ?? 0,
        condoDebt: d.condoDebt ?? 0,
      },
      operationAndExit: {
        resalePrice: d.resalePrice ?? 0,
        resaleDiscountPercent: d.resaleDiscountPercent ?? 0,
        brokerFeePercent: d.brokerFeePercent ?? 0,
        monthlyCondoFee: d.monthlyCondoFee ?? 0,
        monthlyIptu: d.monthlyIptu ?? 0,
        expectedSaleMonths: d.expectedSaleMonths ?? 12,
      },
    }

    const viability = calculateProjectViability(input)

    // Determinar viabilidade baseada nos mesmos critérios da página de detalhes
    const viabilityStatus: ViabilityStatus =
      viability.profit <= 0
        ? "Inviável"
        : viability.roiTotal < 0.1
          ? "Margem apertada"
          : "Viável"

    return {
      id: d.id,
      name: d.propertyName ?? "Sem nome",
      propertyType: d.propertyType ?? "—",
      purchasePrice: d.purchasePrice,
      profit: viability.profitAfterTax,
      roi: viability.roiAfterTax,
      capitalNeeded: viability.initialInvestment,
      viability: viabilityStatus,
    }
  })

  function getUiState(): "loading" | "empty" | "ready" {
    return deals.length === 0 ? "empty" : "ready"
  }

  const state = getUiState()

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
        <div className="flex items-center justify-between px-10 py-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Deals</h1>
            <p className="text-sm text-[#7C889E]">Lista de negócios imobiliários analisados</p>
          </div>
          <Button asChild className="bg-[#4F7DFF] hover:bg-[#2D5BFF]">
            <Link href="/dashboard/deals/new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Deal
            </Link>
          </Button>
        </div>
      </header>

      <div className="px-10 py-6 space-y-6">
        <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C889E]" />
                <input
                  placeholder="Buscar deals..."
                  className="h-10 w-full rounded-lg bg-[#05060B] border border-[#141B29] pl-10 pr-3 text-sm text-white placeholder-[#7C889E] outline-none focus:border-[#2D5BFF]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]">
                  ROI <ChevronDown className="h-4 w-4 ml-2 text-[#7C889E]" />
                </Button>
                <Button variant="outline" className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]">
                  Risco <ChevronDown className="h-4 w-4 ml-2 text-[#7C889E]" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {state === "loading" ? <DealsSkeleton /> : state === "empty" ? <EmptyState /> : (
          <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Meus Deals</CardTitle>
                <div className="text-xs text-[#7C889E]">{deals.length} itens</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-[#7C889E]">
                    <tr className="border-b border-[#141B29]">
                      <th className="py-3 text-left">Imóvel</th>
                      <th className="py-3 text-left">Tipo</th>
                      <th className="py-3 text-right">Compra</th>
                      <th className="py-3 text-right">Lucro Líquido</th>
                      <th className="py-3 text-right">ROI</th>
                      <th className="py-3 text-right">Capital Necessário</th>
                      <th className="py-3 text-right">Viabilidade</th>
                      <th className="py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141B29]">
                    {deals.map((deal) => (
                      <DealRow key={deal.id} deal={deal} />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}


