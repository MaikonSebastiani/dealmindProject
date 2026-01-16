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
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: request.systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: request.userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${request.mimeType};base64,${request.imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2500,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("Resposta vazia da OpenAI")
    }

    return { content }
  }
}

