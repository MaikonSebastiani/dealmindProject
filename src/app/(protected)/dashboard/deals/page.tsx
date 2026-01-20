import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"
import { DealStatusBadge } from "./components/DealStatusSelector"
import { dealStatuses, type DealStatus } from "@/lib/domain/deals/dealStatus"

// Forçar revalidação a cada requisição (sem cache)
export const dynamic = "force-dynamic"

type ViabilityStatus = "Viável" | "Margem apertada" | "Inviável"

type DealListItem = {
  id: string
  name: string
  propertyType: string
  status: string
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
      <td className="p-0">
        <Link href={href} className="block py-4">
          <DealStatusBadge status={deal.status} />
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

function StatusFilterButton({ 
  status, 
  count,
  isActive,
  href,
}: { 
  status: DealStatus | "Todos"
  count: number
  isActive: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      className={`
        inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors
        ${isActive 
          ? "border-[#4F7DFF] bg-[#4F7DFF]/10 text-[#4F7DFF]" 
          : "border-[#141B29] bg-[#0B0F17] text-[#9AA6BC] hover:bg-[#0B1323] hover:text-white"
        }
      `}
    >
      {status}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? "bg-[#4F7DFF]/20" : "bg-[#141B29]"}`}>
        {count}
      </span>
    </Link>
  )
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  const { status: filterStatus } = await searchParams

  const items =
    session?.user?.id
      ? await prisma.deal.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      : []

  // Contagem por status
  const statusCounts: Record<string, number> = {
    Todos: items.length,
  }
  for (const s of dealStatuses) {
    statusCounts[s] = items.filter(d => d.status === s).length
  }

  // Filtrar por status se especificado
  const filteredItems = filterStatus && filterStatus !== "Todos"
    ? items.filter(d => d.status === filterStatus)
    : items

  // Usar ROI já calculado do banco para consistência
  const deals: DealListItem[] = filteredItems.map((d) => {
    // Viabilidade baseada no ROI salvo
    const viabilityStatus: ViabilityStatus =
      d.roi <= 0
        ? "Inviável"
        : d.roi < 0.1
          ? "Margem apertada"
          : "Viável"

    // Lucro = ROI * Investimento Total
    const totalInvestment = d.purchasePrice + d.acquisitionCosts
    const profit = d.roi * totalInvestment

    return {
      id: d.id,
      name: d.propertyName ?? "Sem nome",
      propertyType: d.propertyType ?? "—",
      status: d.status,
      purchasePrice: d.purchasePrice,
      profit: profit,
      roi: d.roi, // Usar ROI do banco diretamente
      capitalNeeded: totalInvestment,
      viability: viabilityStatus,
    }
  })

  function getUiState(): "loading" | "empty" | "ready" {
    return deals.length === 0 ? "empty" : "ready"
  }

  const state = getUiState()
  const activeFilter = filterStatus || "Todos"

  return (
    <>
      <header className="bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 lg:px-10 py-4 sm:py-5">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold">Deals</h1>
            <p className="text-xs sm:text-sm text-[#7C889E]">Lista de negócios imobiliários analisados</p>
          </div>
          <Button asChild size="sm" className="bg-[#4F7DFF] hover:bg-[#2D5BFF] shrink-0">
            <Link href="/dashboard/deals/new">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Deal</span>
              <span className="sm:hidden">Novo</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Filtros */}
        <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
          <CardContent className="py-4">
            <div className="flex flex-col gap-4">
              {/* Busca */}
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C889E]" />
                <input
                  placeholder="Buscar deals..."
                  className="h-10 w-full rounded-lg bg-[#05060B] border border-[#141B29] pl-10 pr-3 text-sm text-white placeholder-[#7C889E] outline-none focus:border-[#2D5BFF]"
                />
              </div>

              {/* Filtros de status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#7C889E] mr-2">Status:</span>
                <StatusFilterButton
                  status="Todos"
                  count={statusCounts["Todos"]}
                  isActive={activeFilter === "Todos"}
                  href="/dashboard/deals"
                />
                {dealStatuses.map((s) => (
                  statusCounts[s] > 0 && (
                    <StatusFilterButton
                      key={s}
                      status={s}
                      count={statusCounts[s]}
                      isActive={activeFilter === s}
                      href={`/dashboard/deals?status=${encodeURIComponent(s)}`}
                    />
                  )
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {state === "loading" ? <DealsSkeleton /> : state === "empty" ? <EmptyState /> : (
          <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {activeFilter === "Todos" ? "Todos os Deals" : `Deals: ${activeFilter}`}
                </CardTitle>
                <div className="text-xs text-[#7C889E]">{deals.length} itens</div>
              </div>
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
                      <th className="py-3 text-right">Lucro Líquido</th>
                      <th className="py-3 text-right">ROI</th>
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

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/dashboard/deals/${deal.id}`}
                    className="block p-4 rounded-xl border border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate mb-1">{deal.name}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-lg border border-[#141B29] bg-[#0B1323] px-2 py-1 text-xs text-[#C7D0DF]">
                            {deal.propertyType}
                          </span>
                          <DealStatusBadge status={deal.status} />
                        </div>
                      </div>
                      <ViabilityPill viability={deal.viability} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-[#7C889E] mb-1">Compra</div>
                        <div className="text-white font-medium">{formatBRL(deal.purchasePrice)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#7C889E] mb-1">Lucro Líquido</div>
                        <div className={deal.profit < 0 ? "text-[#FF5A6A] font-medium" : "text-[#32D583] font-medium"}>
                          {formatBRL(deal.profit)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#7C889E] mb-1">ROI</div>
                        <div className="text-white font-medium">{formatPercent(deal.roi)}</div>
                      </div>
                      <div className="flex items-end">
                        <span className="text-xs text-[#9AA6BC]">Ver detalhes →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
