import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { auth } from "@/auth"

type RiskAlert = {
  id: string
  type: "low_roi" | "no_ai_analysis" | "no_due_diligence"
  title: string
  description: string
  dealName: string
  dealId: string
  severity: "high" | "medium" | "low"
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export async function RiskAlerts() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const alerts: RiskAlert[] = []

  // Buscar todos os deals do usuário
  const deals = await prisma.deal.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      propertyName: true,
      status: true,
      roi: true,
      aiAnalysisData: true,
      dueDiligenceData: true,
      purchasePrice: true,
    },
  })

  // 1. Deals com ROI < 5% (apenas deals ativos ou em pipeline)
  const lowRoiDeals = deals.filter(
    (d) =>
      d.roi < 0.05 &&
      (d.status === "Em análise" ||
        d.status === "Aprovado" ||
        d.status === "Comprado" ||
        d.status === "Em reforma" ||
        d.status === "Alugado" ||
        d.status === "À venda")
  )

  for (const deal of lowRoiDeals) {
    alerts.push({
      id: `low_roi_${deal.id}`,
      type: "low_roi",
      title: "ROI Baixo",
      description: `ROI de ${formatPercent(deal.roi)} está abaixo do recomendado (5%)`,
      dealName: deal.propertyName ?? "Sem nome",
      dealId: deal.id,
      severity: deal.roi < 0.02 ? "high" : "medium",
    })
  }

  // 2. Deals sem análise de IA (apenas em pipeline ou ativos)
  const noAiAnalysisDeals = deals.filter(
    (d) =>
      !d.aiAnalysisData &&
      (d.status === "Em análise" ||
        d.status === "Aprovado" ||
        d.status === "Comprado" ||
        d.status === "Em reforma")
  )

  for (const deal of noAiAnalysisDeals) {
    alerts.push({
      id: `no_ai_${deal.id}`,
      type: "no_ai_analysis",
      title: "Sem Análise de IA",
      description: "Deal ainda não possui análise de documentos por IA",
      dealName: deal.propertyName ?? "Sem nome",
      dealId: deal.id,
      severity: deal.status === "Comprado" || deal.status === "Em reforma" ? "high" : "medium",
    })
  }

  // 3. Deals sem Due Diligence (apenas em pipeline ou aprovados)
  const noDueDiligenceDeals = deals.filter(
    (d) =>
      !d.dueDiligenceData &&
      (d.status === "Em análise" || d.status === "Aprovado" || d.status === "Comprado")
  )

  for (const deal of noDueDiligenceDeals) {
    alerts.push({
      id: `no_dd_${deal.id}`,
      type: "no_due_diligence",
      title: "Sem Due Diligence",
      description: "Deal ainda não possui análise jurídica (Due Diligence)",
      dealName: deal.propertyName ?? "Sem nome",
      dealId: deal.id,
      severity: deal.status === "Comprado" ? "high" : "medium",
    })
  }

  // Ordenar por severidade (high primeiro)
  const severityOrder = { high: 0, medium: 1, low: 2 }
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // Limitar a 5 alertas mais importantes
  const topAlerts = alerts.slice(0, 5)

  if (topAlerts.length === 0) {
    return null
  }

  return (
    <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl border border-[#FF5A6A]/30 bg-[#FF5A6A]/10 grid place-items-center">
              <AlertTriangle className="h-4 w-4 text-[#FF5A6A]" />
            </div>
            <CardTitle className="text-sm">Alertas de Risco</CardTitle>
          </div>
          {alerts.length > 5 && (
            <span className="text-xs text-[#7C889E]">{alerts.length} alertas</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topAlerts.map((alert) => (
            <Link
              key={alert.id}
              href={`/dashboard/deals/${alert.dealId}`}
              className="block p-3 rounded-lg border border-[#141B29] bg-[#0B1323] hover:bg-[#0B1323]/80 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium ${
                        alert.severity === "high"
                          ? "text-[#FF5A6A]"
                          : alert.severity === "medium"
                            ? "text-[#F59E0B]"
                            : "text-[#7C889E]"
                      }`}
                    >
                      {alert.title}
                    </span>
                    {alert.severity === "high" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A6A] shrink-0" />
                    )}
                  </div>
                  <div className="text-sm text-white font-medium truncate mb-1">
                    {alert.dealName}
                  </div>
                  <div className="text-xs text-[#7C889E]">{alert.description}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#7C889E] group-hover:text-[#4F7DFF] transition-colors shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
        {alerts.length > 5 && (
          <div className="mt-4 pt-4 border-t border-[#141B29]">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
            >
              <Link href="/dashboard/deals">
                Ver todos os alertas ({alerts.length})
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

