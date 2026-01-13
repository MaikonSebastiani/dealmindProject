import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ChevronRight, Pencil, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"
import { DeleteDealDialog } from "../components/DeleteDealDialog"
import { deleteDealAction } from "../actions"

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

function RiskIndicator(props: { label: string; active: boolean }) {
  const dot = props.active ? "bg-[#FF5A6A]" : "bg-[#141B29]"
  const text = props.active ? "text-white" : "text-[#9AA6BC]"
  const badge = props.active ? "border-[#3A0B16] bg-[#2A0B12]" : "border-[#141B29] bg-[#0B0F17]"

  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${badge}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`text-sm truncate ${text}`}>{props.label}</span>
      </div>
      <span className={props.active ? "text-xs text-[#FF5A6A]" : "text-xs text-[#7C889E]"}>
        {props.active ? "Atenção" : "Ok"}
      </span>
    </div>
  )
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/?callbackUrl=/dashboard")

  const { id } = await params

  const deal = await prisma.deal.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!deal) {
    notFound()
  }

  async function deleteFromDialog(formData: FormData) {
    "use server"
    const dealId = String(formData.get("dealId") ?? "")
    if (!dealId) return
    await deleteDealAction(dealId)
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
            <h1 className="text-xl font-semibold">{deal.propertyName ?? "Deal"}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
            >
              <Link href={`/dashboard/deals/${deal.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <DeleteDealDialog
              dealId={deal.id}
              dealName={deal.propertyName ?? "Deal"}
              action={deleteFromDialog}
            />
          </div>
        </div>
      </header>

      <div className="px-10 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="outline"
            className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
          >
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
          <DealKpiCard label="ROI" value={formatPercent(deal.roi)} />
          <DealKpiCard label="Cap Rate" value={formatPercent(deal.capRate)} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informações do imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7C889E]">Endereço</span>
                <span className="text-white text-right">{deal.address ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7C889E]">Tipo</span>
                <span className="text-white">{deal.propertyType ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7C889E]">Status</span>
                <span className="inline-flex items-center rounded-lg border border-[#141B29] bg-[#0B1323] px-2 py-1 text-xs text-[#9AA6BC]">
                  {deal.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7C889E]">Criado em</span>
                <span className="text-white">
                  {new Date(deal.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Análise financeira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7C889E]">Preço de compra</span>
                <span className="text-white">{formatBRL(deal.purchasePrice)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7C889E]">Custos de aquisição</span>
                <span className="text-white">{formatBRL(deal.acquisitionCosts)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7C889E]">Despesas mensais</span>
                <span className="text-white">{formatBRL(deal.monthlyExpenses)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#7C889E]">IPTU anual</span>
                <span className="text-white">{formatBRL(deal.annualPropertyTax)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Indicadores de risco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <RiskIndicator label="Cash Flow negativo" active={deal.riskNegativeCashFlow} />
              <RiskIndicator label="ROI baixo" active={deal.riskLowROI} />
              <RiskIndicator label="Alavancagem alta" active={deal.riskHighLeverage} />
            </CardContent>
          </Card>
        </section>

        <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Documentos</CardTitle>
              <Button type="button" className="bg-[#4F7DFF] hover:bg-[#2D5BFF]">
                <Upload className="h-4 w-4 mr-2" />
                Upload documento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#141B29]">
              {[
                { id: "doc_01", name: "Matrícula do imóvel", status: "Pendente" },
                { id: "doc_02", name: "Contrato de compra e venda", status: "Pendente" },
              ].map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="text-white">{doc.name}</div>
                  <span className="text-xs text-[#9AA6BC]">{doc.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}


