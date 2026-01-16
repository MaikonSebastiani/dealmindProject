/**
 * Cliente Gemini para análise de documentos
 * 
 * Tier gratuito: 15 RPM, 1M tokens/dia, 1500 RPD
 * Docs: https://ai.google.dev/pricing
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AIVisionClient, AIVisionRequest, AIVisionResponse } from "./types"

export class GeminiVisionClient implements AIVisionClient {
  private client: GoogleGenerativeAI
  readonly providerName = "Google Gemini"

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada")
    }
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async analyze(request: AIVisionRequest): Promise<AIVisionResponse> {
    // Usar gemini-2.0-flash (gratuito com suporte a visão e PDF)
    const model = this.client.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.1, // Baixa para consistência
        maxOutputTokens: 8192, // Aumentado para JSONs completos
        responseMimeType: "application/json", // Forçar resposta JSON
      },
    })

    // Preparar a imagem para o Gemini
    const imagePart = {
      inlineData: {
        data: request.imageBase64,
        mimeType: request.mimeType,
      },
    }

    // Combinar system prompt e user prompt (Gemini não tem system prompt separado)
    const combinedPrompt = `${request.systemPrompt}\n\n${request.userPrompt}`

    try {
      const result = await model.generateContent([combinedPrompt, imagePart])
      const response = result.response
      const text = response.text()

      if (!text) {
        console.error("[Gemini] Resposta vazia. FinishReason:", response.candidates?.[0]?.finishReason)
        throw new Error("Resposta vazia do Gemini")
      }

      console.log("[Gemini] Resposta recebida, tamanho:", text.length)
      return { content: text }
    } catch (error) {
      console.error("[Gemini] Erro na chamada:", error)
      throw error
    }
  }
}

