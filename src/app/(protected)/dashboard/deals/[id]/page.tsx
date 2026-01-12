import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ChevronRight, Pencil, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type RiskFlag = {
  label: string
  active: boolean
}

type DealDetail = {
  id: string
  propertyName: string
  address: string
  propertyType: "Casa" | "Apartamento" | "Terreno" | "Comercial"
  status: "Ativo" | "Em análise" | "Arquivado"
  createdAt: string

  purchasePrice: number
  acquisitionCosts: number
  monthlyRent: number
  monthlyExpenses: number
  annualPropertyTax: number

  monthlyCashFlow: number
  roiPercent: number
  capRatePercent: number

  riskFlags: RiskFlag[]
  documents: Array<{ id: string; name: string; status: "Pendente" | "Enviado" }>
}

const mockDealsById: Record<string, DealDetail> = {
  d_01: {
    id: "d_01",
    propertyName: "Apartamento Centro (SP)",
    address: "Av. Paulista, 1000 • São Paulo - SP",
    propertyType: "Apartamento",
    status: "Ativo",
    createdAt: "2026-01-10",
    purchasePrice: 850_000,
    acquisitionCosts: 35_000,
    monthlyRent: 4200,
    monthlyExpenses: 800,
    annualPropertyTax: 2400,
    monthlyCashFlow: 1200,
    roiPercent: 8.4,
    capRatePercent: 6.2,
    riskFlags: [
      { label: "Cash Flow negativo", active: false },
      { label: "ROI baixo", active: false },
      { label: "Alavancagem alta", active: true },
    ],
    documents: [
      { id: "doc_01", name: "Matrícula do imóvel", status: "Enviado" },
      { id: "doc_02", name: "Contrato de compra e venda", status: "Pendente" },
    ],
  },
  d_02: {
    id: "d_02",
    propertyName: "Casa Jardins (SP)",
    address: "Al. Santos, 200 • São Paulo - SP",
    propertyType: "Casa",
    status: "Em análise",
    createdAt: "2026-01-08",
    purchasePrice: 1_200_000,
    acquisitionCosts: 62_000,
    monthlyRent: 8000,
    monthlyExpenses: 1600,
    annualPropertyTax: 5200,
    monthlyCashFlow: 2150,
    roiPercent: 9.1,
    capRatePercent: 5.7,
    riskFlags: [
      { label: "Cash Flow negativo", active: false },
      { label: "ROI baixo", active: false },
      { label: "Alavancagem alta", active: false },
    ],
    documents: [
      { id: "doc_01", name: "Laudo de vistoria", status: "Enviado" },
      { id: "doc_02", name: "IPTU (último ano)", status: "Enviado" },
      { id: "doc_03", name: "Seguro residencial", status: "Pendente" },
    ],
  },
  d_03: {
    id: "d_03",
    propertyName: "Loja Comercial (RJ)",
    address: "Rua da Carioca, 120 • Rio de Janeiro - RJ",
    propertyType: "Comercial",
    status: "Ativo",
    createdAt: "2026-01-05",
    purchasePrice: 450_000,
    acquisitionCosts: 18_000,
    monthlyRent: 2500,
    monthlyExpenses: 950,
    annualPropertyTax: 3600,
    monthlyCashFlow: -300,
    roiPercent: 6.8,
    capRatePercent: 7.4,
    riskFlags: [
      { label: "Cash Flow negativo", active: true },
      { label: "ROI baixo", active: true },
      { label: "Alavancagem alta", active: false },
    ],
    documents: [{ id: "doc_01", name: "Contrato de locação", status: "Enviado" }],
  },
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function DealKpiCard(props: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  const valueClass =
    props.tone === "good"
      ? "text-[#32D583]"
      : props.tone === "bad"
        ? "text-[#FF5A6A]"
        : "text-white"

  return (
    <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#7C889E]">{props.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${valueClass}`}>{props.value}</div>
      </CardContent>
    </Card>
  )
}

function RiskIndicator({ flag }: { flag: RiskFlag }) {
  const dot = flag.active ? "bg-[#FF5A6A]" : "bg-[#141B29]"
  const text = flag.active ? "text-white" : "text-[#9AA6BC]"
  const badge = flag.active ? "border-[#3A0B16] bg-[#2A0B12]" : "border-[#141B29] bg-[#0B0F17]"

  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${badge}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`text-sm truncate ${text}`}>{flag.label}</span>
      </div>
      <span className={flag.active ? "text-xs text-[#FF5A6A]" : "text-xs text-[#7C889E]"}>
        {flag.active ? "Ativo" : "Ok"}
      </span>
    </div>
  )
}

function NotFoundState() {
  return (
    <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
      <CardContent className="py-10">
        <div className="max-w-md mx-auto text-center space-y-3">
          <div className="text-base font-semibold text-white">Deal não encontrado</div>
          <div className="text-sm text-[#7C889E]">Verifique o link ou volte para a lista de deals.</div>
          <Button asChild variant="outline" className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323]">
            <Link href="/dashboard/deals">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Deals
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DealSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-72 rounded-lg bg-[#0B1323]/60 border border-[#141B29] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[92px] rounded-2xl bg-[#0B1323]/60 border border-[#141B29] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 rounded-2xl bg-[#0B1323]/60 border border-[#141B29] animate-pulse" />
        <div className="h-64 rounded-2xl bg-[#0B1323]/60 border border-[#141B29] animate-pulse" />
        <div className="h-64 rounded-2xl bg-[#0B1323]/60 border border-[#141B29] animate-pulse" />
      </div>
    </div>
  )
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  function getUiState(): "loading" | "ready" {
    return "ready"
  }

  const state = getUiState()
  const { id } = await params
  const deal = mockDealsById[id]

  if (state === "ready" && !deal) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
          <div className="flex items-center justify-between px-10 py-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#7C889E]">
                <Link href="/dashboard/deals" className="hover:text-white">
                  Deals
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span>Detalhe</span>
              </div>
              <h1 className="text-xl font-semibold">Detalhe</h1>
            </div>
          </div>
        </header>

        <div className="px-10 py-6">
          <NotFoundState />
        </div>
      </>
    )
  }

  if (state === "ready" && !deal) {
    notFound()
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
        <div className="flex items-center justify-between px-10 py-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#7C889E]">
              <Link href="/dashboard/deals" className="hover:text-white">
                Deals
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span>Detalhe</span>
            </div>
            <h1 className="text-xl font-semibold">{deal.propertyName}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" className="border-[#3A0B16] bg-[#2A0B12] hover:bg-[#2A0B12]/80 text-[#FF5A6A]">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </header>

      <div className="px-10 py-6 space-y-6">
        {state === "loading" ? (
          <DealSkeleton />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button asChild variant="outline" className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]">
                <Link href="/dashboard/deals">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DealKpiCard label="Valor de compra" value={formatBRL(deal.purchasePrice)} />
              <DealKpiCard
                label="Cash Flow mensal"
                value={formatBRL(deal.monthlyCashFlow)}
                tone={deal.monthlyCashFlow < 0 ? "bad" : "good"}
              />
              <DealKpiCard label="ROI" value={formatPercent(deal.roiPercent)} />
              <DealKpiCard label="Cap Rate" value={formatPercent(deal.capRatePercent)} />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Informações do imóvel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Endereço</span>
                    <span className="text-white text-right">{deal.address}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Tipo</span>
                    <span className="text-white">{deal.propertyType}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Status</span>
                    <span className="inline-flex items-center rounded-lg border border-[#141B29] bg-[#0B1323] px-2 py-1 text-xs text-[#9AA6BC]">
                      {deal.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Criado em</span>
                    <span className="text-white">{deal.createdAt}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Análise financeira</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Purchase Price</span>
                    <span className="text-white">{formatBRL(deal.purchasePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Acquisition Costs</span>
                    <span className="text-white">{formatBRL(deal.acquisitionCosts)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Monthly Rent</span>
                    <span className="text-white">{formatBRL(deal.monthlyRent)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Monthly Expenses</span>
                    <span className="text-white">{formatBRL(deal.monthlyExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#7C889E]">Annual Property Tax</span>
                    <span className="text-white">{formatBRL(deal.annualPropertyTax)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Indicadores de risco</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deal.riskFlags.map((flag) => (
                    <RiskIndicator key={flag.label} flag={flag} />
                  ))}
                </CardContent>
              </Card>
            </section>

            <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Documentos</CardTitle>
                  <Button className="bg-[#4F7DFF] hover:bg-[#2D5BFF]">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload documento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[#141B29]">
                  {deal.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-3 text-sm">
                      <div className="text-white">{doc.name}</div>
                      <span className="text-xs text-[#9AA6BC]">{doc.status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}


