/**
 * Tipos para o serviço de Due Diligence
 */

// Informações de uma parte processual
export type ProcessParty = {
  name: string
  role: "autor" | "reu" | "terceiro" | "interessado" | "unknown"
  document?: string
}

// Movimentação de um processo
export type ProcessMovement = {
  date: string
  description: string
}

// Processo judicial normalizado
export type LawsuitInfo = {
  number: string
  court: string
  instance?: string
  type: string // classe processual
  subject?: string // assunto
  status: string
  value?: number
  startDate?: string
  lastMovement?: string
  parties: ProcessParty[]
  relevance: "critical" | "high" | "medium" | "low"
  relevanceReason?: string
}

// Protesto (futuro)
export type ProtestInfo = {
  date: string
  value: number
  creditor: string
  status: "ativo" | "quitado" | "cancelado"
}

// Análise da IA
export type AIRiskAnalysis = {
  summary: string
  mainRisks: string[]
  blockingRisks: string[] // Riscos que impedem a compra
  recommendation: "proceed" | "caution" | "investigate" | "avoid"
  recommendationText: string
  confidence: number
}

// Resultado completo do Due Diligence
export type DueDiligenceResult = {
  // Identificação
  analyzedAt: Date
  debtorName: string
  debtorDocument?: string
  propertyAddress?: string

  // Score de risco
  riskScore: "low" | "medium" | "high" | "critical"
  riskPercentage: number // 0-100

  // Processos judiciais
  lawsuits: {
    total: number
    asPlaintiff: number // Como autor
    asDefendant: number // Como réu
    relatedToProperty: number
    criticalCount: number
    items: LawsuitInfo[]
  }

  // Protestos (futuro)
  protests?: {
    total: number
    totalValue: number
    items: ProtestInfo[]
  }

  // Análise da IA
  aiAnalysis: AIRiskAnalysis

  // Metadados
  sources: string[] // Fontes consultadas
  errors?: string[] // Erros durante a consulta
}

// Input para análise
export type DueDiligenceInput = {
  dealId: string
  debtorName: string
  debtorDocument?: string // CPF ou CNPJ
  propertyAddress?: string
  propertyRegistration?: string // Matrícula
}

// Resposta da API DataJud
export type DataJudHit = {
  _source: {
    numeroProcesso: string
    classeProcessual?: string
    assunto?: string
    orgaoJulgador?: string
    grau?: string
    dataAjuizamento?: string
    movimentos?: Array<{
      dataHora: string
      nome: string
    }>
  }
}

export type DataJudResponse = {
  hits?: {
    total?: { value: number }
    hits?: DataJudHit[]
  }
}

