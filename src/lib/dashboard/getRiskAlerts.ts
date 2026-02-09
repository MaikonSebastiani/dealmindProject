import { prisma } from "@/lib/db/prisma"

export type RiskAlert = {
  id: string
  type: "low_roi" | "no_ai_analysis" | "no_due_diligence"
  title: string
  description: string
  dealName: string
  dealId: string
  severity: "high" | "medium" | "low"
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export async function getRiskAlerts(userId: string): Promise<RiskAlert[]> {
  const alerts: RiskAlert[] = []

  // Buscar todos os deals do usuário
  const deals = await prisma.deal.findMany({
    where: { userId },
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

  return alerts
}

/**
 * Retorna apenas os IDs dos alertas não lidos (para contador do badge)
 */
export async function getUnreadAlertIds(userId: string): Promise<Set<string>> {
  // Buscar alertas já lidos pelo usuário
  const readAlerts = await prisma.readAlert.findMany({
    where: { userId },
    select: { alertId: true },
  })
  return new Set(readAlerts.map((a) => a.alertId))
}

