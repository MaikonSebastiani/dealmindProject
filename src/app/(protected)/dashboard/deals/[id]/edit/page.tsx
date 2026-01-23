import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"
import { DealForm } from "../../components/DealForm"
import { updateDealAction } from "../../actions"
import { formatNumberToPtBRMoney } from "@/lib/money"

const validPropertyTypes = ["Apartamento", "Casa", "Comercial", "Lote"] as const
type PropertyType = (typeof validPropertyTypes)[number]

function getPropertyType(value: string | null | undefined): PropertyType {
  if (value && validPropertyTypes.includes(value as PropertyType)) {
    return value as PropertyType
  }
  return "Apartamento"
}

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?callbackUrl=/dashboard")
  }

  const { id } = await params

  const deal = await prisma.deal.findFirst({
    where: { id, userId: session.user.id },
  }) as any

  if (!deal) {
    notFound()
  }

  const action = updateDealAction.bind(null, deal.id)

  const money = (v: number | null) => (typeof v === "number" ? formatNumberToPtBRMoney(v) : "0,00")
  const percent = (v: number | null) => (typeof v === "number" ? String(v) : "0")
  const percentOptional = (v: number | null) => (typeof v === "number" ? String(v) : "")
  const int = (v: number | null, fallback: string) => (typeof v === "number" ? String(v) : fallback)

  // Inferir paymentType baseado nos dados existentes
  // Se tiver financiamento habilitado, é financing
  // Se tiver termMonths mas não tiver financingEnabled, pode ser parcelamento
  // Senão é cash
  const paymentType: "cash" | "installment" | "financing" = 
    deal.financingEnabled 
      ? "financing" 
      : (deal.termMonths && deal.termMonths > 0 && !deal.financingEnabled)
        ? "installment"  // Inferir como parcelamento se tiver prazo mas não tiver financiamento
        : "cash"

  const defaultValues = {
    propertyName: deal.propertyName ?? "",
    address: deal.address ?? "",
    propertyType: getPropertyType(deal.propertyType),
    acquisition: {
      purchasePrice: money(deal.purchasePrice),
      downPaymentPercent: percent(deal.downPaymentPercent),
      auctioneerFeePercent: percentOptional(deal.auctioneerFeePercent),
      advisoryFeePercent: percentOptional(deal.advisoryFeePercent),
      itbiPercent: percent(deal.itbiPercent),
      registryCost: money(deal.registryCost),
    },
    paymentType: paymentType,
    installment: paymentType === "installment" && deal.termMonths
      ? {
          installmentsCount: int(deal.termMonths, "12"),
        }
      : {
          installmentsCount: "12",
        },
    financing: {
      enabled: true, // Sempre true quando paymentType === "financing"
      interestRateAnnual: percent(deal.interestRateAnnual),
      termMonths: int(deal.termMonths, "360"),
      amortizationType: (deal.amortizationType === "SAC" ? "SAC" : "PRICE") as "SAC" | "PRICE",
    },
    liabilities: {
      iptuDebt: money(deal.iptuDebt),
      condoDebt: money(deal.condoDebt),
    },
    renovation: {
      costs: money(deal.renovationCosts),
    },
    operationAndExit: {
      resalePrice: money(deal.resalePrice),
      resaleDiscountPercent: percent(deal.resaleDiscountPercent),
      brokerFeePercent: percent(deal.brokerFeePercent),
      monthlyCondoFee: money(deal.monthlyCondoFee),
      monthlyIptu: money(deal.monthlyIptu),
      expectedSaleMonths: int(deal.expectedSaleMonths, "12"),
    },
  }

  return (
    <DealForm
      title="Editar Deal"
      subtitle="Atualize os dados do projeto para recalcular a viabilidade."
      breadcrumb={[
        { label: "Deals", href: "/dashboard/deals" },
        { label: "Editar", href: `/dashboard/deals/${deal.id}/edit` },
      ]}
      submitLabel="Salvar alterações"
      cancelHref={`/dashboard/deals/${deal.id}`}
      dealId={deal.id}
      existingDocuments={{
        propertyRegistryFileName: deal.propertyRegistryFileName,
        auctionNoticeFileName: deal.auctionNoticeFileName,
      }}
      defaultValues={defaultValues as any}
      action={action}
    />
  )
}
