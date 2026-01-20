/**
 * Cliente Gemini para análise de documentos
 * 
 * Tier gratuito: 15 RPM, 1M tokens/dia, 1500 RPD
 * Docs: https://ai.google.dev/pricing
 */

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AIVisionClient, AIVisionRequest, AIVisionResponse } from "./types"
import { logger } from "@/lib/logger"

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
        const finishReason = response.candidates?.[0]?.finishReason
        logger.error(
          "Resposta vazia do Gemini",
          new Error("Resposta vazia"),
          { finishReason },
          "Gemini"
        )
        throw new Error("Resposta vazia do Gemini")
      }

      logger.debug("Resposta recebida", { responseSize: text.length }, "Gemini")
      return { content: text }
    } catch (error) {
      logger.error("Erro na chamada ao Gemini", error, undefined, "Gemini")
      throw error
    }
  }
}

