/**
 * Módulo de IA - Extração de documentos
 * 
 * Suporta múltiplos provedores:
 * - Google Gemini (gratuito) - padrão
 * - OpenAI GPT-4o (pago)
 * 
 * Configure AI_PROVIDER no .env.local para trocar
 */

// Tipos de dados extraídos
export type {
  PropertyRegistryExtracted,
  AuctionNoticeExtracted,
  ExtractionResult,
  DocumentType,
  ExtractedData,
} from "./extractors/types"

// Prompts
export {
  PROPERTY_REGISTRY_SYSTEM,
  PROPERTY_REGISTRY_PROMPT,
} from "./prompts/property-registry"

export {
  AUCTION_NOTICE_SYSTEM,
  AUCTION_NOTICE_PROMPT,
} from "./prompts/auction-notice"

// Clientes de IA
export {
  createAIVisionClient,
  getAIProvider,
} from "./clients"

export type {
  AIVisionClient,
  AIVisionRequest,
  AIVisionResponse,
  AIProvider,
} from "./clients"

