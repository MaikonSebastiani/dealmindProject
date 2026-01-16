"use client"

import { useState, useTransition } from "react"
import { createPortal } from "react-dom"
import { 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  Check, 
  X, 
  User, 
  FileText,
  Shield,
  Clock,
  Home,
  DollarSign,
  RefreshCw,
  Gavel
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { analyzeDealDocumentsAction } from "../actions"

type OwnerInfo = {
  name?: string
  document?: string
  documentType?: string
}

type AIAnalysisData = {
  // Dados da matrícula
  propertyRegistry?: {
    address?: string
    propertyType?: string
    privateArea?: number // área privativa (apartamentos)
    totalArea?: number // área total construída
    landArea?: number // área do terreno
    isConsolidated?: boolean // Imóvel consolidado/retomado por banco
    // Suporte para múltiplos proprietários (casais)
    currentOwners?: OwnerInfo[]
    previousOwners?: OwnerInfo[]
    // Compatibilidade com formato antigo (singular)
    currentOwner?: OwnerInfo
    previousOwner?: OwnerInfo
    hasLien?: boolean
    hasMortgage?: boolean
    hasUsufruct?: boolean
    liens?: string[]
    iptuDebt?: number
    condoDebt?: number
    lastSalePrice?: number
    lastSaleDate?: string
    risks?: string[]
    confidence: number
  }
  // Dados do edital (simplificado - foco em pagamento e ocupação)
  auctionNotice?: {
    auctionType?: string
    auctioneerFeePercent?: number
    downPaymentPercent?: number
    paymentConditions?: string
    acceptsFinancing?: boolean
    acceptsFGTS?: boolean
    isOccupied?: boolean
    occupationType?: string
    evictionDeadline?: string
    risks?: string[]
    confidence: number
  }
}

function formatBRL(value: number | undefined | null) {
  if (value === undefined || value === null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDateBR(dateStr: string | undefined | null) {
  if (!dateStr) return "—"
  try {
    // Se já vier no formato DD/MM/YYYY, retorna como está
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr
    
    // Converte ISO (YYYY-MM-DD) para BR (DD/MM/YYYY)
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

function formatCPFCNPJ(doc: string | undefined, type: string | undefined) {
  if (!doc) return null
  if (type === "CPF" && doc.length === 11) {
    return `${doc.slice(0, 3)}.${doc.slice(3, 6)}.${doc.slice(6, 9)}-${doc.slice(9)}`
  }
  if (type === "CNPJ" && doc.length === 14) {
    return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5, 8)}/${doc.slice(8, 12)}-${doc.slice(12)}`
  }
  return doc
}

// Helper para normalizar proprietários (suporta formato antigo singular e novo plural)
function getOwners(
  owners?: OwnerInfo[], 
  owner?: OwnerInfo
): OwnerInfo[] {
  if (owners && owners.length > 0) return owners
  if (owner && owner.name) return [owner]
  return []
}

// Componente para exibir lista de proprietários
function OwnersList({ 
  owners, 
  label, 
  isConsolidated 
}: { 
  owners: OwnerInfo[]
  label: string
  isConsolidated?: boolean 
}) {
  if (owners.length === 0) return null

  const bgClass = isConsolidated 
    ? "bg-amber-500/10 border border-amber-500/30" 
    : "bg-[#05060B] border border-[#141B29]"
  const iconClass = isConsolidated ? "text-amber-400" : "text-blue-400"
  const labelClass = isConsolidated ? "text-amber-400" : "text-[#7C889E]"

  return (
    <div className={`rounded-xl p-4 ${bgClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <User className={`h-4 w-4 ${iconClass}`} />
        <span className={`text-xs uppercase tracking-wider ${labelClass}`}>
          {label}
        </span>
        {isConsolidated && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Consolidado</span>
        )}
      </div>
      <div className="space-y-3">
        {owners.map((owner, index) => (
          <div key={index} className={owners.length > 1 ? "pb-3 border-b border-[#141B29]/50 last:border-0 last:pb-0" : ""}>
            <p className="text-sm font-medium text-white">{owner.name}</p>
            {owner.document && (
              <p className="text-xs text-[#7C889E] mt-0.5">
                {owner.documentType}: {formatCPFCNPJ(owner.document, owner.documentType)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


function InfoRow({ label, value, highlight, icon: Icon }: { 
  label: string
  value: string | number | undefined | null
  highlight?: boolean
  icon?: React.ComponentType<{ className?: string }>
  hideIfEmpty?: boolean
}) {
  // Verifica se o valor é vazio (null, undefined, "—", string vazia)
  const isEmpty = value === undefined || value === null || value === "—" || value === ""
  
  // Se hideIfEmpty não for passado, o componente não renderiza valores vazios por padrão
  if (isEmpty) return null
  
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[#141B29]/50 last:border-0 gap-4">
      <div className="flex items-center gap-2 text-sm text-[#7C889E] shrink-0">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </div>
      <span className={`text-sm text-right ${highlight ? "text-emerald-400 font-medium" : "text-white"}`}>
        {String(value)}
      </span>
    </div>
  )
}

// Palavras-chave que indicam risco impeditivo (bloqueio real)
const BLOCKING_KEYWORDS = [
  "penhora ativa",
  "bloqueio judicial",
  "indisponibilidade",
  "inalienabilidade",
  "usufruto",
  "invasor",
  "não pode ser vendido",
  "impedimento",
]

function isBlockingRisk(risk: string): boolean {
  const lowerRisk = risk.toLowerCase()
  return BLOCKING_KEYWORDS.some(keyword => lowerRisk.includes(keyword))
}

function RisksList({ risks }: { risks?: string[] }) {
  if (!risks || risks.length === 0) return null

  // Separar riscos impeditivos dos pontos a avaliar
  const blockingRisks = risks.filter(isBlockingRisk)
  const evaluationPoints = risks.filter(risk => !isBlockingRisk(risk))

  return (
    <div className="mt-4 space-y-3">
      {/* Riscos Impeditivos (vermelho) */}
      {blockingRisks.length > 0 && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span className="text-sm font-medium text-rose-400">Riscos Impeditivos</span>
          </div>
          <ul className="space-y-1">
            {blockingRisks.map((risk, i) => (
              <li key={i} className="text-xs text-rose-300 flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">⛔</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pontos a Avaliar (amarelo) */}
      {evaluationPoints.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Pontos a Avaliar</span>
          </div>
          <ul className="space-y-1">
            {evaluationPoints.map((point, i) => (
              <li key={i} className="text-xs text-amber-300 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">⚠️</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

type TabType = "matricula" | "edital"

function AnalysisResultModal({ 
  isOpen, 
  onClose, 
  data 
}: { 
  isOpen: boolean
  onClose: () => void
  data: AIAnalysisData 
}) {
  const [activeTab, setActiveTab] = useState<TabType>("matricula")

  if (!isOpen) return null

  const registry = data.propertyRegistry
  const auction = data.auctionNotice
  
  const hasRegistry = Boolean(registry)
  const hasAuction = Boolean(auction)

  // Se só tem edital, mostrar aba do edital por padrão
  const effectiveTab = !hasRegistry && hasAuction ? "edital" : activeTab

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
        <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-[#141B29] bg-[#0B0F17] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#141B29] px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/40">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Análise Completa por IA</h2>
                <p className="text-xs text-[#7C889E]">Dados extraídos dos documentos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#7C889E] hover:bg-[#141B29] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Abas */}
          <div className="flex border-b border-[#141B29] px-6 shrink-0">
            <button
              onClick={() => setActiveTab("matricula")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                effectiveTab === "matricula"
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-[#7C889E] hover:text-white"
              }`}
            >
              <FileText className="h-4 w-4" />
              Matrícula
              {!hasRegistry && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#141B29] text-[#7C889E]">—</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("edital")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                effectiveTab === "edital"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-[#7C889E] hover:text-white"
              }`}
            >
              <Gavel className="h-4 w-4" />
              Edital
              {!hasAuction && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#141B29] text-[#7C889E]">—</span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Aba Matrícula */}
            {effectiveTab === "matricula" && (
              <>
                {registry ? (
                  <div className="space-y-4">
                    {/* Devedor/Antigo Proprietário (se consolidado) */}
                    {registry.isConsolidated && (
                      <OwnersList 
                        owners={getOwners(registry.previousOwners, registry.previousOwner)}
                        label="Devedor (perdeu o imóvel)"
                        isConsolidated
                      />
                    )}

                    {/* Proprietário Atual */}
                    <OwnersList 
                      owners={getOwners(registry.currentOwners, registry.currentOwner)}
                      label={registry.isConsolidated ? "Credor/Banco (proprietário atual)" : "Proprietário Atual"}
                    />

                    {/* Dados do Imóvel */}
                    {(registry.address || registry.propertyType || registry.privateArea || registry.totalArea || registry.landArea) && (
                      <div className="rounded-xl bg-[#05060B] border border-[#141B29] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Home className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-medium text-white">Dados do Imóvel</span>
                        </div>
                        <InfoRow label="Endereço" value={registry.address} />
                        <InfoRow label="Tipo" value={registry.propertyType} />
                        <InfoRow label="Área privativa" value={registry.privateArea ? `${registry.privateArea} m²` : null} highlight />
                        <InfoRow label="Área total" value={registry.totalArea ? `${registry.totalArea} m²` : null} />
                        <InfoRow label="Área do terreno" value={registry.landArea ? `${registry.landArea} m²` : null} />
                      </div>
                    )}

                    {/* Ônus e Gravames */}
                    {(registry.hasLien !== undefined || registry.hasMortgage !== undefined || registry.hasUsufruct !== undefined) && (
                      <div className="rounded-xl bg-[#05060B] border border-[#141B29] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="h-4 w-4 text-amber-400" />
                          <span className="text-sm font-medium text-white">Ônus e Gravames</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {registry.hasLien !== undefined && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                              registry.hasLien ? "bg-rose-500/10 border border-rose-500/30" : "bg-emerald-500/10 border border-emerald-500/30"
                            }`}>
                              {registry.hasLien ? <AlertTriangle className="h-4 w-4 text-rose-400" /> : <Check className="h-4 w-4 text-emerald-400" />}
                              <span className={`text-sm ${registry.hasLien ? "text-rose-300" : "text-emerald-300"}`}>
                                Penhora: {registry.hasLien ? "Sim" : "Não"}
                              </span>
                            </div>
                          )}
                          {registry.hasMortgage !== undefined && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                              registry.hasMortgage ? "bg-rose-500/10 border border-rose-500/30" : "bg-emerald-500/10 border border-emerald-500/30"
                            }`}>
                              {registry.hasMortgage ? <AlertTriangle className="h-4 w-4 text-rose-400" /> : <Check className="h-4 w-4 text-emerald-400" />}
                              <span className={`text-sm ${registry.hasMortgage ? "text-rose-300" : "text-emerald-300"}`}>
                                Hipoteca: {registry.hasMortgage ? "Sim" : "Não"}
                              </span>
                            </div>
                          )}
                          {registry.hasUsufruct !== undefined && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                              registry.hasUsufruct ? "bg-rose-500/10 border border-rose-500/30" : "bg-emerald-500/10 border border-emerald-500/30"
                            }`}>
                              {registry.hasUsufruct ? <AlertTriangle className="h-4 w-4 text-rose-400" /> : <Check className="h-4 w-4 text-emerald-400" />}
                              <span className={`text-sm ${registry.hasUsufruct ? "text-rose-300" : "text-emerald-300"}`}>
                                Usufruto: {registry.hasUsufruct ? "Sim" : "Não"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Débitos */}
                    {(registry.iptuDebt || registry.condoDebt) && (
                      <div className="rounded-xl bg-[#05060B] border border-[#141B29] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="h-4 w-4 text-rose-400" />
                          <span className="text-sm font-medium text-white">Débitos Encontrados</span>
                        </div>
                        <InfoRow label="IPTU" value={registry.iptuDebt ? formatBRL(registry.iptuDebt) : null} />
                        <InfoRow label="Condomínio" value={registry.condoDebt ? formatBRL(registry.condoDebt) : null} />
                      </div>
                    )}

                    {/* Histórico */}
                    {(registry.lastSalePrice || registry.lastSaleDate) && (
                      <div className="rounded-xl bg-[#05060B] border border-[#141B29] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-[#7C889E]" />
                          <span className="text-sm font-medium text-white">Última Transação</span>
                        </div>
                        <InfoRow label="Valor" value={formatBRL(registry.lastSalePrice)} />
                        <InfoRow label="Data" value={formatDateBR(registry.lastSaleDate)} />
                      </div>
                    )}

                    <RisksList risks={registry.risks} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-[#7C889E] mx-auto mb-3" />
                    <p className="text-[#7C889E]">Nenhuma matrícula foi analisada</p>
                    <p className="text-xs text-[#7C889E] mt-1">Faça upload da matrícula e clique em Analisar</p>
                  </div>
                )}
              </>
            )}

            {/* Aba Edital */}
            {effectiveTab === "edital" && (
              <>
                {auction ? (
                  <div className="space-y-4">
                    {/* Condições de Pagamento */}
                    {(auction.auctionType || auction.auctioneerFeePercent || auction.downPaymentPercent || auction.paymentConditions || auction.acceptsFinancing !== undefined || auction.acceptsFGTS !== undefined) && (
                      <div className="rounded-xl bg-[#05060B] border border-[#141B29] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium text-white">Condições de Pagamento</span>
                        </div>
                        <InfoRow label="Tipo de leilão" value={auction.auctionType} />
                        <InfoRow 
                          label="Comissão do leiloeiro" 
                          value={auction.auctioneerFeePercent ? `${auction.auctioneerFeePercent}%` : null} 
                        />
                        <InfoRow 
                          label="Entrada mínima" 
                          value={auction.downPaymentPercent ? `${auction.downPaymentPercent}%` : null} 
                        />
                        {auction.paymentConditions && (
                          <div className="mt-3 p-3 rounded-lg bg-[#141B29]/50">
                            <p className="text-xs text-[#7C889E] mb-1">Formas de pagamento</p>
                            <p className="text-sm text-white">{auction.paymentConditions}</p>
                          </div>
                        )}
                        {(auction.acceptsFinancing !== undefined || auction.acceptsFGTS !== undefined) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {auction.acceptsFinancing !== undefined && (
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                auction.acceptsFinancing 
                                  ? "bg-emerald-500/10 border border-emerald-500/30" 
                                  : "bg-rose-500/10 border border-rose-500/30"
                              }`}>
                                {auction.acceptsFinancing 
                                  ? <Check className="h-4 w-4 text-emerald-400" /> 
                                  : <X className="h-4 w-4 text-rose-400" />
                                }
                                <span className={`text-sm ${auction.acceptsFinancing ? "text-emerald-300" : "text-rose-300"}`}>
                                  Financiamento
                                </span>
                              </div>
                            )}
                            {auction.acceptsFGTS !== undefined && (
                              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                auction.acceptsFGTS 
                                  ? "bg-emerald-500/10 border border-emerald-500/30" 
                                  : "bg-rose-500/10 border border-rose-500/30"
                              }`}>
                                {auction.acceptsFGTS 
                                  ? <Check className="h-4 w-4 text-emerald-400" /> 
                                  : <X className="h-4 w-4 text-rose-400" />
                                }
                                <span className={`text-sm ${auction.acceptsFGTS ? "text-emerald-300" : "text-rose-300"}`}>
                                  FGTS
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ocupação */}
                    {(auction.isOccupied !== undefined || auction.evictionDeadline || auction.occupationType) && (
                      <div className="rounded-xl bg-[#05060B] border border-[#141B29] p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Home className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">Situação do Imóvel</span>
                        </div>
                        {(auction.isOccupied !== undefined || auction.occupationType) && (
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-2 ${
                            auction.isOccupied === true
                              ? "bg-rose-500/10 border border-rose-500/30" 
                              : auction.isOccupied === false
                                ? "bg-emerald-500/10 border border-emerald-500/30"
                                : "bg-amber-500/10 border border-amber-500/30"
                          }`}>
                            {auction.isOccupied === true 
                              ? <AlertTriangle className="h-4 w-4 text-rose-400" /> 
                              : auction.isOccupied === false
                                ? <Check className="h-4 w-4 text-emerald-400" />
                                : <AlertTriangle className="h-4 w-4 text-amber-400" />
                            }
                            <span className={`text-sm ${
                              auction.isOccupied === true 
                                ? "text-rose-300" 
                                : auction.isOccupied === false 
                                  ? "text-emerald-300"
                                  : "text-amber-300"
                            }`}>
                              {auction.isOccupied === true 
                                ? `Ocupado${auction.occupationType && auction.occupationType !== "Não informado" ? ` (${auction.occupationType})` : ""}` 
                                : auction.isOccupied === false
                                  ? "Desocupado"
                                  : "Ocupação não informada"
                              }
                            </span>
                          </div>
                        )}
                        {auction.evictionDeadline && (
                          <div className="mt-2 p-3 rounded-lg bg-[#141B29]/50">
                            <p className="text-xs text-[#7C889E] mb-1">Responsabilidade / Prazo</p>
                            <p className="text-sm text-white">{auction.evictionDeadline}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <RisksList risks={auction.risks} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Gavel className="h-12 w-12 text-[#7C889E] mx-auto mb-3" />
                    <p className="text-[#7C889E]">Nenhum edital foi analisado</p>
                    <p className="text-xs text-[#7C889E] mt-1">Faça upload do edital e clique em Analisar</p>
                  </div>
                )}
              </>
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
      </div>
    </>,
    document.body
  )
}

export function AIAnalysisCard({ 
  dealId,
  hasDocuments,
  existingAnalysis,
  analysisDate,
  analysisConfidence,
}: { 
  dealId: string
  hasDocuments: boolean
  existingAnalysis: AIAnalysisData | null
  analysisDate: Date | null
  analysisConfidence: number | null
}) {
  const [isPending, startTransition] = useTransition()
  const [analysisData, setAnalysisData] = useState<AIAnalysisData | null>(existingAnalysis)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = () => {
    setError(null)
    startTransition(async () => {
      const result = await analyzeDealDocumentsAction(dealId)
      if (result.success && result.data) {
        setAnalysisData(result.data as AIAnalysisData)
        setShowModal(true)
      } else {
        setError(result.error || "Erro ao analisar documentos")
      }
    })
  }

  const hasAnalysis = analysisData !== null

  // Extrair dados resumidos para exibição
  // Se for consolidado, mostrar os devedores (previousOwners), senão mostrar os proprietários atuais
  const isConsolidated = analysisData?.propertyRegistry?.isConsolidated
  const registry = analysisData?.propertyRegistry
  const relevantOwners = isConsolidated 
    ? getOwners(registry?.previousOwners, registry?.previousOwner)
    : getOwners(registry?.currentOwners, registry?.currentOwner)
  const ownerLabel = isConsolidated ? "Devedor" : "Proprietário"
  const allRisks = [
    ...(analysisData?.propertyRegistry?.risks || []),
    ...(analysisData?.auctionNotice?.risks || [])
  ]
  const blockingRisksCount = allRisks.filter(isBlockingRisk).length
  const evaluationPointsCount = allRisks.filter(risk => !isBlockingRisk(risk)).length

  return (
    <>
      <div className="rounded-2xl border border-[#141B29] bg-[#0B0F17] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141B29]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/40">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Análise por IA</h3>
              <p className="text-xs text-[#7C889E]">
                {hasAnalysis 
                  ? `Atualizado em ${analysisDate?.toLocaleDateString("pt-BR")}`
                  : "Extraia dados dos documentos automaticamente"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!hasDocuments ? (
            <div className="text-center py-4">
              <FileText className="h-8 w-8 text-[#7C889E] mx-auto mb-2" />
              <p className="text-sm text-[#7C889E]">
                Faça upload da matrícula ou edital para habilitar a análise
              </p>
            </div>
          ) : hasAnalysis ? (
            <div className="space-y-4">
              {/* Proprietários ou Devedores (se consolidado) */}
              {relevantOwners.length > 0 && (
                <div className={`rounded-xl p-4 ${isConsolidated ? "bg-amber-500/10 border border-amber-500/30" : "bg-[#05060B] border border-[#141B29]"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <User className={`h-4 w-4 ${isConsolidated ? "text-amber-400" : "text-blue-400"}`} />
                    <span className={`text-xs uppercase tracking-wider ${isConsolidated ? "text-amber-400" : "text-[#7C889E]"}`}>
                      {ownerLabel}
                    </span>
                    {isConsolidated && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Consolidado</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {relevantOwners.map((owner, index) => (
                      <div key={index} className={relevantOwners.length > 1 ? "pb-2 border-b border-[#141B29]/30 last:border-0 last:pb-0" : ""}>
                        <p className="text-sm font-medium text-white">{owner.name}</p>
                        {owner.document && (
                          <p className="text-xs text-[#7C889E] mt-0.5">
                            {owner.documentType}: {formatCPFCNPJ(owner.document, owner.documentType)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas - Riscos Impeditivos */}
              {blockingRisksCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span className="text-sm text-rose-300">
                    {blockingRisksCount} {blockingRisksCount === 1 ? "risco impeditivo" : "riscos impeditivos"}
                  </span>
                </div>
              )}

              {/* Alertas - Pontos a Avaliar */}
              {evaluationPointsCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-sm text-amber-300">
                    {evaluationPointsCount} {evaluationPointsCount === 1 ? "ponto a avaliar" : "pontos a avaliar"}
                  </span>
                </div>
              )}

              {/* Ônus */}
              {analysisData?.propertyRegistry && (
                <div className="flex items-center gap-4 text-xs">
                  <div className={`flex items-center gap-1 ${analysisData.propertyRegistry.hasLien ? "text-rose-400" : "text-emerald-400"}`}>
                    {analysisData.propertyRegistry.hasLien ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    Penhora
                  </div>
                  <div className={`flex items-center gap-1 ${analysisData.propertyRegistry.hasMortgage ? "text-rose-400" : "text-emerald-400"}`}>
                    {analysisData.propertyRegistry.hasMortgage ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    Hipoteca
                  </div>
                  <div className={`flex items-center gap-1 ${analysisData.propertyRegistry.hasUsufruct ? "text-rose-400" : "text-emerald-400"}`}>
                    {analysisData.propertyRegistry.hasUsufruct ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    Usufruto
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => setShowModal(true)}
                  variant="outline"
                  size="sm"
                  className="border-[#141B29] bg-[#05060B] hover:bg-[#0B1323] text-white"
                >
                  Ver análise
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isPending}
                  variant="outline"
                  size="sm"
                  className="border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 gap-2"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Atualizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <Button
                onClick={handleAnalyze}
                disabled={isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando documentos...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analisar Imóvel
                  </>
                )}
              </Button>
              <p className="text-xs text-[#7C889E] mt-3">
                A IA irá extrair dados da matrícula e edital
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}
        </div>
      </div>

      {analysisData && (
        <AnalysisResultModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          data={analysisData}
        />
      )}
    </>
  )
}

