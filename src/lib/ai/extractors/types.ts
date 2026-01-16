/**
 * Tipos para dados extraídos de documentos imobiliários
 */

// Dados extraídos da matrícula do imóvel
export type PropertyRegistryExtracted = {
  // Dados do imóvel
  address?: string
  propertyType?: "Apartamento" | "Casa" | "Terreno" | "Comercial" | "Rural"
  privateArea?: number // m² - área privativa/útil (apartamentos)
  totalArea?: number // m² - área total construída
  landArea?: number // m² - área do terreno

  // Indica se o imóvel foi consolidado/retomado por banco
  isConsolidated?: boolean

  // Proprietário atual (último registrado na matrícula)
  currentOwner?: {
    name?: string
    document?: string // CPF ou CNPJ
    documentType?: "CPF" | "CNPJ"
  }

  // Antigo proprietário/devedor (em caso de consolidação ou venda anterior)
  previousOwner?: {
    name?: string
    document?: string // CPF ou CNPJ
    documentType?: "CPF" | "CNPJ"
  }

  // Ônus e gravames
  hasLien?: boolean // Penhora
  hasMortgage?: boolean // Hipoteca
  hasUsufruct?: boolean // Usufruto
  liens?: string[] // Lista de ônus encontrados

  // Débitos mencionados
  iptuDebt?: number
  condoDebt?: number

  // Histórico
  lastSalePrice?: number
  lastSaleDate?: string

  // Alertas de risco
  risks?: string[]

  // Confiança da extração (0-1)
  confidence: number
  rawText?: string // Texto bruto extraído (para debug)
}

// Dados extraídos do edital de leilão
export type AuctionNoticeExtracted = {
  // Dados do leilão
  auctionType?: "1ª Praça" | "2ª Praça" | "Extrajudicial" | "Judicial"
  minimumBid?: number
  evaluationValue?: number
  auctioneerFeePercent?: number

  // Condições de pagamento
  downPaymentPercent?: number
  paymentConditions?: string

  // Débitos
  iptuDebt?: number
  condoDebt?: number
  otherDebts?: { description: string; value: number }[]

  // Ocupação
  isOccupied?: boolean
  occupationType?: "Proprietário" | "Inquilino" | "Invasor" | "Desocupado"

  // Prazos
  auctionDate?: string
  evictionDeadline?: string

  // Riscos identificados
  risks?: string[]

  // Confiança
  confidence: number
  rawText?: string
}

// Tipo genérico para resultado de extração
export type ExtractionResult<T> = {
  success: boolean
  data?: T
  error?: string
  processingTime?: number
}

// Tipo de documento suportado
export type DocumentType = "property-registry" | "auction-notice"

// União dos tipos de dados extraídos
export type ExtractedData = PropertyRegistryExtracted | AuctionNoticeExtracted

