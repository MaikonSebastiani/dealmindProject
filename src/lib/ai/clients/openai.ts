/**
 * Cliente OpenAI para análise de documentos
 * 
 * Requer plano pago com créditos
 * Docs: https://platform.openai.com/docs/guides/vision
 */

import OpenAI from "openai"
import type { AIVisionClient, AIVisionRequest, AIVisionResponse } from "./types"

export class OpenAIVisionClient implements AIVisionClient {
  private client: OpenAI
  readonly providerName = "OpenAI GPT-4o"

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY não configurada")
    }
    this.client = new OpenAI({ apiKey })
  }

  async analyze(request: AIVisionRequest): Promise<AIVisionResponse> {
    // Preparar conteúdo do usuário
    const userContent: any[] = [{ type: "text", text: request.userPrompt }]
    
    // Adicionar imagem apenas se fornecida e não for texto puro
    if (request.imageBase64 && request.mimeType !== "text/plain") {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${request.mimeType};base64,${request.imageBase64}`,
          detail: "high",
        },
      })
    }

    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: request.systemPrompt },
        {
          role: "user",
          content: userContent,
        },
      ],
      max_tokens: 8192, // Aumentado para análise de processos
      temperature: 0.1,
      response_format: { type: "json_object" }, // Forçar JSON quando possível
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("Resposta vazia da OpenAI")
    }

    return { content }
  }
}

