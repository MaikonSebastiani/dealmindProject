"use client"

import { useState, useTransition } from "react"
import { createPortal } from "react-dom"
import {
  Scale,
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileSearch,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Gavel,
  ExternalLink,
  Info,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { runDueDiligenceAction } from "../actions"
import type { DueDiligenceResult, LawsuitInfo, AIRiskAnalysis } from "@/lib/due-diligence/types"

function formatBRL(value: number | undefined | null) {
  if (value === undefined || value === null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDateBR(dateStr: string | undefined | null) {
  if (!dateStr) return "—"
  try {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

function formatCPFCNPJ(doc: string | undefined) {
  if (!doc) return null
  const clean = doc.replace(/\D/g, "")
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`
  }
  if (clean.length === 14) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
  }
  return doc
}

function getRiskScoreColor(score: "low" | "medium" | "high" | "critical") {
  switch (score) {
    case "low":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    case "medium":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30"
    case "high":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30"
    case "critical":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30"
  }
}

function getRiskScoreLabel(score: "low" | "medium" | "high" | "critical") {
  switch (score) {
    case "low":
      return "Baixo Risco"
    case "medium":
      return "Risco Médio"
    case "high":
      return "Alto Risco"
    case "critical":
      return "Risco Crítico"
  }
}

function getRecommendationColor(recommendation: "proceed" | "caution" | "investigate" | "avoid") {
  switch (recommendation) {
    case "proceed":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    case "caution":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30"
    case "investigate":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30"
    case "avoid":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30"
  }
}

function getRecommendationLabel(recommendation: "proceed" | "caution" | "investigate" | "avoid") {
  switch (recommendation) {
    case "proceed":
      return "Prosseguir"
    case "caution":
      return "Cautela"
    case "investigate":
      return "Investigar Mais"
    case "avoid":
      return "Evitar"
  }
}

function getRelevanceColor(relevance: "critical" | "high" | "medium" | "low") {
  switch (relevance) {
    case "critical":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30"
    case "high":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30"
    case "medium":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30"
    case "low":
      return "text-[#7C889E] bg-[#05060B] border-[#141B29]"
  }
}

function LawsuitItem({ lawsuit }: { lawsuit: LawsuitInfo }) {
  const relevanceColor = getRelevanceColor(lawsuit.relevance)

  return (
    <div className="rounded-lg border border-[#141B29] bg-[#05060B] p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${relevanceColor}`}>
              {lawsuit.relevance === "critical" ? "Crítico" :
               lawsuit.relevance === "high" ? "Alto" :
               lawsuit.relevance === "medium" ? "Médio" : "Baixo"}
            </span>
            <span className="text-xs text-[#7C889E]">{lawsuit.court}</span>
          </div>
          <div className="text-sm font-medium text-white mb-1">{lawsuit.type}</div>
          {lawsuit.subject && (
            <div className="text-xs text-[#9AA6BC] mb-1">{lawsuit.subject}</div>
          )}
          <div className="text-xs text-[#7C889E] font-mono">{lawsuit.number}</div>
        </div>
      </div>

      {lawsuit.relevanceReason && (
        <div className="flex items-start gap-2 pt-2 border-t border-[#141B29]">
          <Info className="h-3.5 w-3.5 text-[#4F7DFF] shrink-0 mt-0.5" />
          <p className="text-xs text-[#9AA6BC]">{lawsuit.relevanceReason}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#141B29] text-xs">
        <div className="text-[#7C889E]">
          Status: <span className="text-[#9AA6BC]">{lawsuit.status}</span>
        </div>
        {lawsuit.startDate && (
          <div className="text-[#7C889E]">
            Início: <span className="text-[#9AA6BC]">{formatDateBR(lawsuit.startDate)}</span>
          </div>
        )}
        {lawsuit.value && (
          <div className="text-[#7C889E]">
            Valor: <span className="text-[#9AA6BC]">{formatBRL(lawsuit.value)}</span>
          </div>
        )}
      </div>

      {lawsuit.parties.length > 0 && (
        <div className="pt-2 border-t border-[#141B29]">
          <div className="text-xs text-[#7C889E] mb-1">Partes:</div>
          <div className="space-y-1">
            {lawsuit.parties.slice(0, 3).map((party, idx) => (
              <div key={idx} className="text-xs text-[#9AA6BC]">
                <span className={party.role === "autor" ? "text-blue-400" : party.role === "reu" ? "text-rose-400" : ""}>
                  {party.role === "autor" ? "Autor" : party.role === "reu" ? "Réu" : party.role}
                </span>
                : {party.name}
              </div>
            ))}
            {lawsuit.parties.length > 3 && (
              <div className="text-xs text-[#7C889E]">+{lawsuit.parties.length - 3} outras partes</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DueDiligenceModal({
  result,
  onClose,
}: {
  result: DueDiligenceResult
  onClose: () => void
}) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0B0F17] border border-[#141B29] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141B29] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2D5BFF]/10 border border-[#2D5BFF]/30">
              <Scale className="h-5 w-5 text-[#4F7DFF]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Análise de Due Diligence</h2>
              <p className="text-xs text-[#7C889E]">
                Analisado em {formatDateBR(
                  result.analyzedAt instanceof Date 
                    ? result.analyzedAt.toISOString() 
                    : typeof result.analyzedAt === 'string' 
                      ? result.analyzedAt 
                      : String(result.analyzedAt || '')
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#141B29] text-[#7C889E] hover:text-white transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Score e Recomendação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#05060B] border-[#141B29]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-[#7C889E]">Score de Risco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg border ${getRiskScoreColor(result.riskScore)}`}>
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{result.riskPercentage}%</div>
                    <div className={`text-sm font-medium ${getRiskScoreColor(result.riskScore).split(" ")[0]}`}>
                      {getRiskScoreLabel(result.riskScore)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#05060B] border-[#141B29]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-[#7C889E]">Recomendação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg border ${getRecommendationColor(result.aiAnalysis.recommendation)}`}>
                    <Gavel className="h-6 w-6" />
                  </div>
                  <div>
                    <div className={`text-lg font-semibold ${getRecommendationColor(result.aiAnalysis.recommendation).split(" ")[0]}`}>
                      {getRecommendationLabel(result.aiAnalysis.recommendation)}
                    </div>
                    <div className="text-xs text-[#7C889E] mt-1">
                      Confiança: {(result.aiAnalysis.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Devedor */}
          <Card className="bg-[#05060B] border-[#141B29]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Devedor Analisado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#7C889E]">Nome:</span>
                <span className="text-white font-medium">{result.debtorName}</span>
              </div>
              {result.debtorDocument && (
                <div className="flex items-center justify-between">
                  <span className="text-[#7C889E]">CPF/CNPJ:</span>
                  <span className="text-white font-medium">{formatCPFCNPJ(result.debtorDocument) || result.debtorDocument}</span>
                </div>
              )}
              {result.propertyAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-[#7C889E]">Endereço do imóvel:</span>
                  <span className="text-white font-medium text-right">{result.propertyAddress}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Análise da IA */}
          <Card className="bg-[#05060B] border-[#141B29]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Análise por IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-[#9AA6BC] leading-relaxed">
                {result.aiAnalysis.summary}
              </div>

              {result.aiAnalysis.blockingRisks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                    <span className="text-sm font-medium text-rose-400">Riscos Impeditivos</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.aiAnalysis.blockingRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#9AA6BC]">
                        <span className="text-rose-400 mt-1">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.aiAnalysis.mainRisks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Principais Riscos</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.aiAnalysis.mainRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-[#9AA6BC]">
                        <span className="text-amber-400 mt-1">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-[#141B29]">
                <div className="text-sm font-medium text-white mb-1">
                  {result.aiAnalysis.recommendationText}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas de Processos */}
          <Card className="bg-[#05060B] border-[#141B29]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Estatísticas de Processos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{result.lawsuits.total}</div>
                  <div className="text-xs text-[#7C889E] mt-1">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{result.lawsuits.asPlaintiff}</div>
                  <div className="text-xs text-[#7C889E] mt-1">Como Autor</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-400">{result.lawsuits.asDefendant}</div>
                  <div className="text-xs text-[#7C889E] mt-1">Como Réu</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{result.lawsuits.criticalCount}</div>
                  <div className="text-xs text-[#7C889E] mt-1">Críticos</div>
                </div>
              </div>
              {result.lawsuits.relatedToProperty > 0 && (
                <div className="mt-4 pt-4 border-t border-[#141B29] text-center">
                  <div className="text-lg font-semibold text-amber-400">{result.lawsuits.relatedToProperty}</div>
                  <div className="text-xs text-[#7C889E] mt-1">Relacionados ao Imóvel</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Processos */}
          {result.lawsuits.items.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Processos Encontrados</h3>
              <div className="space-y-3">
                {result.lawsuits.items.map((lawsuit, idx) => (
                  <LawsuitItem key={idx} lawsuit={lawsuit} />
                ))}
              </div>
              {result.lawsuits.total > result.lawsuits.items.length && (
                <div className="mt-3 text-center text-xs text-[#7C889E]">
                  Mostrando {result.lawsuits.items.length} de {result.lawsuits.total} processos
                </div>
              )}
            </div>
          )}

          {/* Fontes */}
          {result.sources.length > 0 && (
            <div className="pt-4 border-t border-[#141B29]">
              <div className="text-xs text-[#7C889E] mb-2">Fontes consultadas:</div>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((source, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-[#141B29] text-[#9AA6BC] border border-[#1D2536]"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Erros */}
          {result.errors && result.errors.length > 0 && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span className="text-sm font-medium text-rose-400">Erros durante a análise</span>
              </div>
              <ul className="space-y-1">
                {result.errors.map((error, idx) => (
                  <li key={idx} className="text-xs text-rose-300">• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#141B29] px-6 py-4 shrink-0">
          <Button
            onClick={onClose}
            className="bg-[#141B29] hover:bg-[#1a2235] text-white"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function DueDiligenceCard({
  dealId,
  hasAIAnalysis,
  existingData,
  riskScore,
  riskPercent,
  analysisDate,
}: {
  dealId: string
  hasAIAnalysis: boolean
  existingData: DueDiligenceResult | null
  riskScore: string | null
  riskPercent: number | null
  analysisDate: Date | null
}) {
  const [isPending, startTransition] = useTransition()
  const [ddData, setDdData] = useState<DueDiligenceResult | null>(existingData)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = () => {
    setError(null)
    startTransition(async () => {
      const result = await runDueDiligenceAction(dealId)
      if (result.success && result.data) {
        setDdData(result.data as DueDiligenceResult)
        setShowModal(true)
      } else {
        setError(result.error || "Erro ao executar Due Diligence")
      }
    })
  }

  const hasData = ddData !== null
  const currentRiskScore = (ddData?.riskScore || riskScore) as "low" | "medium" | "high" | "critical" | null
  const currentRiskPercent = ddData?.riskPercentage ?? riskPercent

  return (
    <>
      <Card className="bg-[#0B0F17] border-[#141B29] rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#2D5BFF]/10 border border-[#2D5BFF]/30">
                <Scale className="h-5 w-5 text-[#4F7DFF]" />
              </div>
              <div>
                <CardTitle className="text-base">Apuração Jurídica</CardTitle>
                <p className="text-xs text-[#7C889E] mt-0.5">
                  Análise de riscos jurídicos do devedor
                </p>
              </div>
            </div>
            {hasData && (
              <button
                onClick={() => setShowModal(true)}
                className="text-xs text-[#4F7DFF] hover:text-[#2D5BFF] transition-colors"
              >
                Ver detalhes
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!hasData ? (
            <>
              {!hasAIAnalysis ? (
                <div className="rounded-lg border border-dashed border-[#141B29] bg-[#05060B]/50 p-6 text-center">
                  <FileSearch className="h-8 w-8 text-[#7C889E] mx-auto mb-3" />
                  <p className="text-sm text-[#9AA6BC] mb-1">
                    Execute a análise de documentos primeiro
                  </p>
                  <p className="text-xs text-[#7C889E]">
                    A análise de documentos identifica o devedor para a busca jurídica
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#141B29] bg-[#05060B] p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-[#4F7DFF] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-white mb-1">Busca de processos judiciais</p>
                        <p className="text-xs text-[#7C889E]">
                          Busca nacional de processos do devedor identificado na análise de documentos
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-300">{error}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleAnalyze}
                    disabled={isPending}
                    className="w-full bg-[#4F7DFF] hover:bg-[#2D5BFF] text-white"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <FileSearch className="h-4 w-4 mr-2" />
                        Executar Due Diligence
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Score de Risco */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg border p-3 ${getRiskScoreColor(currentRiskScore || "low")}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-medium">Score de Risco</span>
                  </div>
                  <div className="text-xl font-bold">{currentRiskPercent ?? 0}%</div>
                  <div className="text-xs mt-1">{getRiskScoreLabel(currentRiskScore || "low")}</div>
                </div>

                <div className={`rounded-lg border p-3 ${getRecommendationColor(ddData.aiAnalysis.recommendation)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Gavel className="h-4 w-4" />
                    <span className="text-xs font-medium">Recomendação</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {getRecommendationLabel(ddData.aiAnalysis.recommendation)}
                  </div>
                  <div className="text-xs mt-1 text-[#7C889E]">
                    {(ddData.aiAnalysis.confidence * 100).toFixed(0)}% confiança
                  </div>
                </div>
              </div>

              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-[#05060B] border border-[#141B29] p-2 text-center">
                  <div className="text-lg font-bold text-white">{ddData.lawsuits.total}</div>
                  <div className="text-[10px] text-[#7C889E] mt-0.5">Processos</div>
                </div>
                <div className="rounded-lg bg-[#05060B] border border-[#141B29] p-2 text-center">
                  <div className="text-lg font-bold text-rose-400">{ddData.lawsuits.asDefendant}</div>
                  <div className="text-[10px] text-[#7C889E] mt-0.5">Como Réu</div>
                </div>
                <div className="rounded-lg bg-[#05060B] border border-[#141B29] p-2 text-center">
                  <div className="text-lg font-bold text-orange-400">{ddData.lawsuits.criticalCount}</div>
                  <div className="text-[10px] text-[#7C889E] mt-0.5">Críticos</div>
                </div>
              </div>

              {/* Resumo da Análise */}
              <div className="rounded-lg border border-[#141B29] bg-[#05060B] p-3">
                <p className="text-xs text-[#9AA6BC] line-clamp-2">
                  {ddData.aiAnalysis.summary}
                </p>
              </div>

              {/* Riscos Principais (Preview) */}
              {ddData.aiAnalysis.blockingRisks.length > 0 && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                    <span className="text-xs font-medium text-rose-400">
                      {ddData.aiAnalysis.blockingRisks.length} risco(s) impeditivo(s)
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {ddData.aiAnalysis.blockingRisks.slice(0, 2).map((risk, idx) => (
                      <li key={idx} className="text-xs text-rose-300">• {risk}</li>
                    ))}
                    {ddData.aiAnalysis.blockingRisks.length > 2 && (
                      <li className="text-xs text-rose-300">
                        +{ddData.aiAnalysis.blockingRisks.length - 2} outros riscos
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowModal(true)}
                  variant="outline"
                  className="flex-1 border-[#141B29] bg-[#05060B] hover:bg-[#0B0F17] text-white"
                >
                  <FileSearch className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isPending}
                  variant="outline"
                  className="border-[#141B29] bg-[#05060B] hover:bg-[#0B0F17] text-white"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {analysisDate && (
                <p className="text-xs text-[#7C889E] text-center">
                  Última análise: {formatDateBR(analysisDate.toString())}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showModal && ddData && (
        <DueDiligenceModal result={ddData} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
