import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ChevronRight, ExternalLink, FileText, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"
import { DeleteDealDialog } from "../components/DeleteDealDialog"
import { DealStatusSelector } from "../components/DealStatusSelector"
import { AIAnalysisCard } from "../components/AIAnalysisCard"
import { deleteDealAction } from "../actions"
import { calculateProjectViability } from "@/lib/domain/finance/calculateProjectViability"
import type { ProjectInput } from "@/lib/domain/deals/projectInput"

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
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

function Row(props: { label: string; value: string; tone?: "muted" | "neutral" | "good" | "bad" }) {
  const valueCls =
    props.tone === "good"
      ? "text-[#32D583]"
      : props.tone === "bad"
        ? "text-[#FF5A6A]"
        : props.tone === "muted"
          ? "text-[#9AA6BC]"
          : "text-white"

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#7C889E]">{props.label}</span>
      <span className={`${valueCls} text-right`}>{props.value}</span>
    </div>
  )
}

function SectionTitle(props: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wider text-[#7C889E]">{props.children}</div>
}

function Pill(props: { label: string; tone: "good" | "warn" | "bad" }) {
  const cls =
    props.tone === "good"
      ? "bg-[#06221B] text-[#32D583] border-[#0B3A2C]"
      : props.tone === "warn"
        ? "bg-[#0B1323] text-[#F59E0B] border-[#141B29]"
        : "bg-[#2A0B12] text-[#FF5A6A] border-[#3A0B16]"

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${cls}`}>
      {props.label}
    </span>
  )
}

function ViabilityCard(props: { status: "Viável" | "Margem apertada" | "Inviável"; detail: string }) {
  const tone: "good" | "warn" | "bad" =
    props.status === "Viável" ? "good" : props.status === "Margem apertada" ? "warn" : "bad"

  const titleColor = tone === "good" ? "text-[#32D583]" : tone === "warn" ? "text-[#F59E0B]" : "text-[#FF5A6A]"
  const border = tone === "good" ? "border-[#0B3A2C]" : tone === "warn" ? "border-[#141B29]" : "border-[#3A0B16]"
  const bg = tone === "good" ? "bg-[#06221B]" : tone === "warn" ? "bg-[#0B1323]" : "bg-[#2A0B12]"

  return (
    <Card className={`rounded-2xl border ${border} ${bg}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm text-white">Diagnóstico de viabilidade</CardTitle>
          <Pill label={props.status} tone={tone} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${titleColor}`}>{props.status}</div>
        <div className="mt-2 text-sm text-[#9AA6BC]">{props.detail}</div>
      </CardContent>
    </Card>
  )
}

function formatMonthsLabel(months: number) {
  return months === 1 ? "1 mês" : `${months} meses`
}

function DocumentChip(props: { 
  label: string
  fileName: string | null
  href: string
}) {
  if (!props.fileName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#141B29] bg-[#05060B]/50 text-[#7C889E]">
        <FileText className="h-4 w-4 shrink-0" />
        <span className="text-xs truncate">{props.label}</span>
      </div>
    )
  }

  return (
    <a 
      href={props.href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#141B29] bg-[#05060B] hover:bg-[#0B0F17] hover:border-[#2D5BFF] transition-colors group"
    >
      <FileText className="h-4 w-4 text-[#4F7DFF] shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-white truncate">{props.label}</div>
        <div className="text-[10px] text-[#7C889E] truncate">{props.fileName}</div>
      </div>
      <ExternalLink className="h-3 w-3 text-[#7C889E] group-hover:text-[#4F7DFF] shrink-0" />
    </a>
  )
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/?callbackUrl=/dashboard")

  const { id } = await params

  const deal = await prisma.deal.findFirst({
    where: { id, userId: session.user.id },
  }) as any

  if (!deal) {
    notFound()
  }

  const projectInput: ProjectInput = {
    acquisition: {
      purchasePrice: deal.purchasePrice,
      downPaymentPercent: deal.downPaymentPercent ?? 0,
      auctioneerFeePercent: deal.auctioneerFeePercent ?? undefined,
      itbiPercent: deal.itbiPercent ?? 0,
      registryCost: deal.registryCost ?? 0,
    },
    financing: deal.financingEnabled
      ? {
          enabled: true,
          interestRateAnnual: deal.interestRateAnnual ?? 0,
          termMonths: deal.termMonths ?? 0,
          amortizationType: (deal.amortizationType === "SAC" ? "SAC" : "PRICE") as "SAC" | "PRICE",
        }
      : undefined,
    liabilities: {
      iptuDebt: deal.iptuDebt ?? 0,
      condoDebt: deal.condoDebt ?? 0,
    },
    renovation: {
      costs: deal.renovationCosts ?? 0,
    },
    operationAndExit: {
      resalePrice: deal.resalePrice ?? 0,
      resaleDiscountPercent: deal.resaleDiscountPercent ?? 0,
      brokerFeePercent: deal.brokerFeePercent ?? 0,
      monthlyCondoFee: deal.monthlyCondoFee ?? 0,
      monthlyIptu: deal.monthlyIptu ?? 0,
      expectedSaleMonths: deal.expectedSaleMonths ?? 12,
    },
  }

  const viability = calculateProjectViability(projectInput)
  const expectedSaleMonths = projectInput.operationAndExit.expectedSaleMonths

  const itbiValue = (projectInput.acquisition.purchasePrice * projectInput.acquisition.itbiPercent) / 100
  const auctioneerFeeValue = projectInput.acquisition.auctioneerFeePercent
    ? (projectInput.acquisition.purchasePrice * projectInput.acquisition.auctioneerFeePercent) / 100
    : 0

  const saleDiscountValue = (projectInput.operationAndExit.resalePrice * projectInput.operationAndExit.resaleDiscountPercent) / 100
  const saleAfterDiscount = projectInput.operationAndExit.resalePrice - saleDiscountValue
  const brokerFeeValue = (saleAfterDiscount * projectInput.operationAndExit.brokerFeePercent) / 100

  const condoTotal = projectInput.operationAndExit.monthlyCondoFee * expectedSaleMonths
  const iptuTotal = projectInput.operationAndExit.monthlyIptu * expectedSaleMonths
  const interestUntilSale = viability.financing?.interestPaidUntilSale ?? 0
  const remainingBalanceAtSale = viability.financing?.remainingBalanceAtSale ?? 0

  const viabilityStatus: "Viável" | "Margem apertada" | "Inviável" =
    deal.roi <= 0 ? "Inviável" : deal.roi < 0.1 ? "Margem apertada" : "Viável"

  const viabilityDetail =
    viabilityStatus === "Inviável"
      ? "O projeto não se paga no cenário atual. Ajuste preço, custos ou prazo para reavaliar."
      : viabilityStatus === "Margem apertada"
        ? "A rentabilidade anualizada é baixa para o risco do projeto. Reavalie premissas e margem."
        : "Boa relação risco/retorno no cenário atual. Vale avançar para diligência e negociação."

  async function deleteFromDialog(formData: FormData) {
    "use server"
    const dealId = String(formData.get("dealId") ?? "")
    if (!dealId) return
    await deleteDealAction(dealId)
  }

  // Verificar se é leilão (tem comissão de leiloeiro)
  const isAuction = (deal.auctioneerFeePercent ?? 0) > 0

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
        <div className="flex items-center justify-between px-10 py-5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#7C889E]">
              <Link href="/dashboard/deals" className="hover:text-white">
                Deals
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span>Detalhe</span>
            </div>
            <div className="flex items-center gap-4 mt-1 mb-4">
              <h1 className="text-2xl font-semibold truncate">{deal.propertyName ?? "Deal"}</h1>
              <DealStatusSelector dealId={deal.id} currentStatus={deal.status} />
            </div>
            <div className="text-sm text-[#7C889E] flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <span>Compra: <span className="text-white font-medium">{formatBRL(projectInput.acquisition.purchasePrice)}</span></span>
              <span className="text-[#2D3748]">•</span>
              <span>Venda: <span className="text-white font-medium">{formatBRL(projectInput.operationAndExit.resalePrice)}</span></span>
              <span className="text-[#2D3748]">•</span>
              <span>Venda estimada em <span className="text-white font-medium">{formatMonthsLabel(expectedSaleMonths)}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
            >
              <Link href={`/dashboard/deals/${deal.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar premissas
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
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DealKpiCard
            label="Lucro Líquido"
            value={formatBRL(viability.profit)}
            tone={viability.profit < 0 ? "bad" : "good"}
          />
          <DealKpiCard label="ROI" value={formatPercent(deal.roi)} />
          <DealKpiCard label="Capital Necessário" value={formatBRL(viability.initialInvestment)} />
        </section>

        <ViabilityCard status={viabilityStatus} detail={viabilityDetail} />

        {/* Documentos - barra compacta */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#141B29] bg-[#0B0F17]">
          <span className="text-xs text-[#7C889E] flex items-center gap-1.5 shrink-0">
            <FileText className="h-3.5 w-3.5" />
            Documentos:
          </span>
          <div className="flex flex-wrap gap-2">
            <DocumentChip
              label="Matrícula do imóvel"
              fileName={deal.propertyRegistryFileName}
              href={`/api/deals/${deal.id}/documents/property-registry`}
            />
            {(isAuction || deal.auctionNoticeFileName) && (
              <DocumentChip
                label="Edital do leilão"
                fileName={deal.auctionNoticeFileName}
                href={`/api/deals/${deal.id}/documents/auction-notice`}
              />
            )}
          </div>
        </div>

        {/* Análise por IA */}
        <AIAnalysisCard
          dealId={deal.id}
          hasDocuments={Boolean(deal.propertyRegistryFileName || deal.auctionNoticeFileName)}
          existingAnalysis={deal.aiAnalysisData ? JSON.parse(deal.aiAnalysisData) : null}
          analysisDate={deal.aiAnalysisDate}
          analysisConfidence={deal.aiAnalysisConfidence}
        />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Linha do tempo do projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div className="space-y-2">
                <Row label="Compra" value={formatBRL(projectInput.acquisition.purchasePrice)} />
                <Row
                  label="Entrada"
                  value={formatBRL((projectInput.acquisition.purchasePrice * projectInput.acquisition.downPaymentPercent) / 100)}
                />
                <Row
                  label="Custos iniciais + dívidas"
                  value={formatBRL(viability.acquisitionCosts)}
                />
              </div>

              <div className="space-y-2">
                <SectionTitle>Meses 1 → {expectedSaleMonths}</SectionTitle>
                <Row label="Condomínio mensal" value={formatBRL(projectInput.operationAndExit.monthlyCondoFee)} />
                <Row label="IPTU mensal" value={formatBRL(projectInput.operationAndExit.monthlyIptu)} />
                {viability.financing ? (
                  <Row
                    label="Juros (mês 1, estimado)"
                    value={formatBRL(viability.financing.financedPrincipal * viability.financing.monthlyRate)}
                  />
                ) : (
                  <Row label="Juros do financiamento" value="—" tone="muted" />
                )}
              </div>

              <div className="space-y-2">
                <SectionTitle>Mês {expectedSaleMonths}</SectionTitle>
                <Row label="Venda (valor esperado)" value={formatBRL(projectInput.operationAndExit.resalePrice)} />
                <Row label="Deságio aplicado" value={`- ${formatBRL(saleDiscountValue)}`} tone="muted" />
                <Row label="Comissão de corretagem" value={`- ${formatBRL(brokerFeeValue)}`} tone="muted" />
                {viability.financing ? (
                  <Row
                    label="Quitação do saldo devedor"
                    value={`- ${formatBRL(remainingBalanceAtSale)}`}
                    tone="muted"
                  />
                ) : null}
                <Row label="Resultado final" value={formatBRL(viability.profit)} tone={viability.profit < 0 ? "bad" : "good"} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Breakdown financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <SectionTitle>Custos de entrada</SectionTitle>
                  <Row label="Valor de compra" value={formatBRL(projectInput.acquisition.purchasePrice)} />
                  <Row label="ITBI" value={formatBRL(itbiValue)} />
                  <Row label="Registro" value={formatBRL(projectInput.acquisition.registryCost)} />
                  {auctioneerFeeValue > 0 ? (
                    <Row label="Comissão do leiloeiro" value={formatBRL(auctioneerFeeValue)} />
                  ) : (
                    <Row label="Comissão do leiloeiro" value="—" tone="muted" />
                  )}
                  <Row label="Dívida IPTU" value={formatBRL(projectInput.liabilities.iptuDebt)} />
                  <Row label="Dívida condomínio" value={formatBRL(projectInput.liabilities.condoDebt)} />
                </div>

                <div className="space-y-3">
                  <SectionTitle>Custos no período</SectionTitle>
                  <Row label={`Condomínio total (${formatMonthsLabel(expectedSaleMonths)})`} value={formatBRL(condoTotal)} />
                  <Row label={`IPTU total (${formatMonthsLabel(expectedSaleMonths)})`} value={formatBRL(iptuTotal)} />
                  <Row label="Juros até a venda" value={formatBRL(interestUntilSale)} />
                  {viability.financing ? (
                    <Row label="Saldo devedor na venda" value={formatBRL(remainingBalanceAtSale)} />
                  ) : (
                    <Row label="Saldo devedor na venda" value="—" tone="muted" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <SectionTitle>Custos de saída</SectionTitle>
                  <Row label="Deságio sobre venda" value={formatBRL(saleDiscountValue)} />
                  <Row label="Comissão do corretor" value={formatBRL(brokerFeeValue)} />
                </div>

                <div className="space-y-3">
                  <SectionTitle>Resumo</SectionTitle>
                  <Row label="Capital necessário (entrada + custos + dívidas)" value={formatBRL(viability.initialInvestment)} />
                  <Row label="Venda líquida" value={formatBRL(viability.saleNet)} />
                  {viability.financing ? (
                    <Row label="Venda líquida (após quitar financiamento)" value={formatBRL(viability.saleNetAfterLoan)} />
                  ) : (
                    <Row label="Venda líquida (após quitar financiamento)" value={formatBRL(viability.saleNet)} />
                  )}
                  <Row
                    label={`Imposto de renda (estimado ${(viability.incomeTaxRate * 100).toFixed(0)}%)`}
                    value={`- ${formatBRL(viability.incomeTax)}`}
                    tone="muted"
                  />
                  <Row label="Lucro líquido" value={formatBRL(viability.profit)} tone={viability.profit < 0 ? "bad" : "good"} />
                  <Row
                    label="Lucro após IR"
                    value={formatBRL(viability.profitAfterTax)}
                    tone={viability.profitAfterTax < 0 ? "bad" : "good"}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {viability.financing ? (
          <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Financiamento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-[#7C889E]">Tipo</div>
                <div className="text-white font-medium">{viability.financing.amortizationType}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[#7C889E]">Taxa anual</div>
                <div className="text-white font-medium">{viability.financing.interestRateAnnual.toFixed(1)}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[#7C889E]">Prazo total</div>
                <div className="text-white font-medium">{formatMonthsLabel(viability.financing.termMonths)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[#7C889E]">Parcela inicial (estimada)</div>
                <div className="text-white font-medium">{formatBRL(viability.financing.initialInstallmentEstimate)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[#7C889E]">Juros até a venda</div>
                <div className="text-white font-medium">{formatBRL(viability.financing.interestPaidUntilSale)}</div>
              </div>
            </CardContent>
            <div className="px-6 pb-6">
              <div className="rounded-xl border border-[#141B29] bg-[#05060B] px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[#9AA6BC]">Saldo devedor estimado na venda ({formatMonthsLabel(viability.financing.monthsConsidered)})</div>
                  <div className="text-white font-medium">{formatBRL(viability.financing.remainingBalanceAtSale)}</div>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
          >
            <Link href="/dashboard/deals">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Deals
            </Link>
          </Button>

          <Button className="bg-[#4F7DFF] hover:bg-[#2D5BFF]" asChild>
            <Link href={`/dashboard/deals/${deal.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar premissas
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}
