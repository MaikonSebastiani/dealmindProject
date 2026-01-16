/**
 * Factory para criar clientes de IA
 * 
 * O provedor é determinado pela variável de ambiente AI_PROVIDER
 * Padrão: "gemini" (gratuito)
 */

import type { AIVisionClient, AIProvider } from "./types"
import { GeminiVisionClient } from "./gemini"
import { OpenAIVisionClient } from "./openai"

export type { AIVisionClient, AIVisionRequest, AIVisionResponse, AIProvider } from "./types"

/**
 * Retorna o provedor de IA configurado
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase()
  
  if (provider === "openai") {
    return "openai"
  }
  
  // Padrão: Gemini (gratuito)
  return "gemini"
}

/**
 * Cria um cliente de IA baseado na configuração
 */
export function createAIVisionClient(): AIVisionClient {
  const provider = getAIProvider()
  
  switch (provider) {
    case "openai":
      return new OpenAIVisionClient()
    case "gemini":
    default:
      return new GeminiVisionClient()
  }
}

