/**
 * Interface abstrata para clientes de IA com suporte a visão
 */

export type AIVisionRequest = {
  systemPrompt: string
  userPrompt: string
  imageBase64: string
  mimeType: string
}

export type AIVisionResponse = {
  content: string
}

export interface AIVisionClient {
  /**
   * Envia uma imagem/documento para análise
   */
  analyze(request: AIVisionRequest): Promise<AIVisionResponse>
  
  /**
   * Nome do provedor para logging
   */
  readonly providerName: string
}

export type AIProvider = "openai" | "gemini"

