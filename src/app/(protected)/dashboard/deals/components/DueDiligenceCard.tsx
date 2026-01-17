"use client"

import { useState, useTransition } from "react"
import { createPortal } from "react-dom"
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scale,
  FileSearch,
  X,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { runDueDiligenceAction } from "../actions"

type LawsuitInfo = {
  number: string
  court: string
  type: string
  subject?: string
  status: string
  value?: number
  startDate?: string
  relevance: "critical" | "high" | "medium" | "low"
  relevanceReason?: string
}

type DueDiligenceData = {
  analyzedAt: string
  debtorName: string
  debtorDocument?: string
  riskScore: "low" | "medium" | "high" | "critical"
  riskPercentage: number
  lawsuits: {
    total: number
    asPlaintiff: number
    asDefendant: number
    criticalCount: number
    items: LawsuitInfo[]
  }
  aiAnalysis: {
    summary: string
    mainRisks: string[]
    blockingRisks: string[]
    recommendation: "proceed" | "caution" | "investigate" | "avoid"
    recommendationText: string
    confidence: number
  }
  sources: string[]
  errors?: string[]
}

type Props = {
  dealId: string
  hasDebtorInfo: boolean
  existingData?: DueDiligenceData | null
  analysisDate?: Date | null
}

function getRiskColor(score: string) {
  switch (score) {
    case "low": return "text-emerald-400"
    case "medium": return "text-amber-400"
    case "high": return "text-orange-400"
    case "critical": return "text-rose-400"
    default: return "text-gray-400"
  }
}

function getRiskBgColor(score: string) {
  switch (score) {
    case "low": return "bg-emerald-500/10 border-emerald-500/30"
    case "medium": return "bg-amber-500/10 border-amber-500/30"
    case "high": return "bg-orange-500/10 border-orange-500/30"
    case "critical": return "bg-rose-500/10 border-rose-500/30"
    default: return "bg-gray-500/10 border-gray-500/30"
  }
}

function getRiskIcon(score: string) {
  switch (score) {
    case "low": return ShieldCheck
    case "medium": return Shield
    case "high": return ShieldAlert
    case "critical": return ShieldX
    default: return Shield
  }
}

function getRiskLabel(score: string) {
  switch (score) {
    case "low": return "Baixo Risco"
    case "medium": return "Risco Moderado"
    case "high": return "Alto Risco"
    case "critical": return "Risco Crítico"
    default: return "Não analisado"
  }
}

function getRecommendationConfig(rec: string) {
  switch (rec) {
    case "proceed":
      return {
        icon: CheckCircle,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/30",
        label: "Prosseguir",
      }
    case "caution":
      return {
        icon: AlertTriangle,
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/30",
        label: "Cautela",
      }
    case "investigate":
      return {
        icon: FileSearch,
        color: "text-orange-400",
        bg: "bg-orange-500/10 border-orange-500/30",
        label: "Investigar",
      }
    case "avoid":
      return {
        icon: XCircle,
        color: "text-rose-400",
        bg: "bg-rose-500/10 border-rose-500/30",
        label: "Evitar",
      }
    default:
      return {
        icon: Info,
        color: "text-gray-400",
        bg: "bg-gray-500/10 border-gray-500/30",
        label: "Indefinido",
      }
  }
}

function RelevanceBadge({ relevance }: { relevance: string }) {
  const config = {
    critical: { color: "bg-rose-500/20 text-rose-400 border-rose-500/40", label: "Crítico" },
    high: { color: "bg-orange-500/20 text-orange-400 border-orange-500/40", label: "Alto" },
    medium: { color: "bg-amber-500/20 text-amber-400 border-amber-500/40", label: "Médio" },
    low: { color: "bg-gray-500/20 text-gray-400 border-gray-500/40", label: "Baixo" },
  }[relevance] || { color: "bg-gray-500/20 text-gray-400 border-gray-500/40", label: "—" }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

function formatBRL(value: number | undefined) {
  if (!value) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// Modal de detalhes
function DueDiligenceModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean
  onClose: () => void
  data: DueDiligenceData
}) {
  if (!isOpen || typeof document === "undefined") return null

  const RiskIcon = getRiskIcon(data.riskScore)
  const recConfig = getRecommendationConfig(data.aiAnalysis.recommendation)
  const RecIcon = recConfig.icon

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[#141B29] bg-[#0B0F17] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141B29]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getRiskBgColor(data.riskScore)}`}>
              <Scale className={`h-5 w-5 ${getRiskColor(data.riskScore)}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Due Diligence</h2>
              <p className="text-xs text-[#7C889E]">
                Análise de {data.debtorName}
                {data.debtorDocument && ` • ${data.debtorDocument}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#141B29] transition-colors"
          >
            <X className="h-5 w-5 text-[#7C889E]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Score e Recomendação */}
          <div className="grid grid-cols-2 gap-4">
            {/* Score de Risco */}
            <div className={`rounded-xl border p-4 ${getRiskBgColor(data.riskScore)}`}>
              <div className="flex items-center gap-3">
                <RiskIcon className={`h-8 w-8 ${getRiskColor(data.riskScore)}`} />
                <div>
                  <div className="text-2xl font-bold text-white">{data.riskPercentage}%</div>
                  <div className={`text-sm font-medium ${getRiskColor(data.riskScore)}`}>
                    {getRiskLabel(data.riskScore)}
                  </div>
                </div>
              </div>
            </div>

            {/* Recomendação */}
            <div className={`rounded-xl border p-4 ${recConfig.bg}`}>
              <div className="flex items-center gap-3">
                <RecIcon className={`h-8 w-8 ${recConfig.color}`} />
                <div>
                  <div className={`text-lg font-bold ${recConfig.color}`}>
                    {recConfig.label}
                  </div>
                  <div className="text-sm text-[#9AA6BC]">
                    {data.aiAnalysis.recommendationText}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo da IA */}
          <div className="rounded-xl bg-[#05060B] border border-[#141B29] p-4">
            <h3 className="text-sm font-medium text-white mb-2">Resumo da Análise</h3>
            <p className="text-sm text-[#9AA6BC] leading-relaxed">
              {data.aiAnalysis.summary}
            </p>
          </div>

          {/* Riscos Impeditivos */}
          {data.aiAnalysis.blockingRisks.length > 0 && (
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4">
              <h3 className="text-sm font-medium text-rose-400 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Riscos Impeditivos
              </h3>
              <ul className="space-y-1">
                {data.aiAnalysis.blockingRisks.map((risk, i) => (
                  <li key={i} className="text-sm text-rose-300 flex items-start gap-2">
                    <span className="text-rose-500 mt-1">⛔</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pontos de Atenção */}
          {data.aiAnalysis.mainRisks.length > 0 && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
              <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pontos de Atenção
              </h3>
              <ul className="space-y-1">
                {data.aiAnalysis.mainRisks.map((risk, i) => (
                  <li key={i} className="text-sm text-amber-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">⚠️</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Processos */}
          <div className="rounded-xl bg-[#05060B] border border-[#141B29] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">
                Processos Encontrados
              </h3>
              <div className="flex items-center gap-3 text-xs text-[#7C889E]">
                <span>Total: <span className="text-white font-medium">{data.lawsuits.total}</span></span>
                {data.lawsuits.criticalCount > 0 && (
                  <span className="text-rose-400">
                    Críticos: <span className="font-medium">{data.lawsuits.criticalCount}</span>
                  </span>
                )}
              </div>
            </div>

            {data.lawsuits.items.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.lawsuits.items.map((lawsuit, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#0B0F17] border border-[#141B29]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[#4F7DFF]">
                          {lawsuit.number}
                        </span>
                        <RelevanceBadge relevance={lawsuit.relevance} />
                      </div>
                      <div className="text-sm text-white truncate">
                        {lawsuit.type}
                      </div>
                      <div className="text-xs text-[#7C889E] flex items-center gap-2 mt-1">
                        <span>{lawsuit.court}</span>
                        {lawsuit.startDate && (
                          <>
                            <span>•</span>
                            <span>{formatDate(lawsuit.startDate)}</span>
                          </>
                        )}
                        {lawsuit.value && (
                          <>
                            <span>•</span>
                            <span>{formatBRL(lawsuit.value)}</span>
                          </>
                        )}
                      </div>
                      {lawsuit.relevanceReason && (
                        <div className="text-xs text-[#9AA6BC] mt-1 italic">
                          {lawsuit.relevanceReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[#7C889E] text-center py-4">
                Nenhum processo encontrado nos tribunais consultados.
              </div>
            )}
          </div>

          {/* Fontes */}
          {data.sources.length > 0 && (
            <div className="text-xs text-[#7C889E] flex items-center gap-2 flex-wrap">
              <span>Fontes consultadas:</span>
              {data.sources.map((source, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-[#141B29]">
                  {source}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#141B29]">
          <div className="text-xs text-[#7C889E]">
            Análise realizada em {formatDate(data.analyzedAt)}
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#141B29] bg-[#0B0F17] hover:bg-[#141B29]"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function DueDiligenceCard({ dealId, hasDebtorInfo, existingData, analysisDate }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [data, setData] = useState<DueDiligenceData | null>(existingData || null)

  const handleAnalyze = () => {
    setError(null)
    startTransition(async () => {
      const result = await runDueDiligenceAction(dealId)
      if (result.success && result.data) {
        setData(result.data as DueDiligenceData)
      } else {
        setError(result.error || "Erro ao executar análise")
      }
    })
  }

  const hasAnalysis = !!data

  // Card quando não tem análise
  if (!hasAnalysis) {
    return (
      <div className="rounded-xl border border-[#141B29] bg-[#0B0F17] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#141B29]">
              <Scale className="h-5 w-5 text-[#7C889E]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Due Diligence</h3>
              <p className="text-xs text-[#7C889E]">
                {hasDebtorInfo
                  ? "Análise de riscos jurídicos do devedor"
                  : "Execute a análise de documentos primeiro"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isPending || !hasDebtorInfo}
            className="bg-[#4F7DFF] hover:bg-[#2D5BFF] disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Analisar Devedor
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400">
            {error}
          </div>
        )}
      </div>
    )
  }

  // Card com análise existente
  const RiskIcon = getRiskIcon(data.riskScore)
  const recConfig = getRecommendationConfig(data.aiAnalysis.recommendation)

  return (
    <>
      <div className={`rounded-xl border p-4 ${getRiskBgColor(data.riskScore)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Score */}
            <div className="flex items-center gap-3">
              <RiskIcon className={`h-8 w-8 ${getRiskColor(data.riskScore)}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{data.riskPercentage}%</span>
                  <span className={`text-sm font-medium ${getRiskColor(data.riskScore)}`}>
                    {getRiskLabel(data.riskScore)}
                  </span>
                </div>
                <div className="text-xs text-[#9AA6BC]">
                  {data.lawsuits.total} processos • Recomendação: {recConfig.label}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="border-[#141B29] bg-[#0B0F17]/50 hover:bg-[#141B29] text-sm"
            >
              Ver detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isPending}
              className="border-[#141B29] bg-[#0B0F17]/50 hover:bg-[#141B29]"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Resumo rápido */}
        {(data.aiAnalysis.blockingRisks.length > 0 || data.aiAnalysis.mainRisks.length > 0) && (
          <div className="mt-3 pt-3 border-t border-white/10">
            {data.aiAnalysis.blockingRisks.length > 0 && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {data.aiAnalysis.blockingRisks.length} risco(s) impeditivo(s)
                </span>
              </div>
            )}
            {data.aiAnalysis.mainRisks.length > 0 && (
              <div className="text-xs text-amber-400 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>
                  {data.aiAnalysis.mainRisks.length} ponto(s) de atenção
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400">
            {error}
          </div>
        )}
      </div>

      <DueDiligenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
      />
    </>
  )
}

