/**
 * Serviço principal de Due Diligence
 * 
 * Usa API do Escavador para busca nacional de processos judiciais
 */

import { createAIVisionClient } from "@/lib/ai/clients"
import { EscavadorProvider, EscavadorMockProvider } from "./providers/escavador"
import { EscavadorV2Provider, EscavadorV2MockProvider } from "./providers/escavador-v2"
import { DUE_DILIGENCE_SYSTEM, buildDueDiligencePrompt } from "./prompts"
import { logger } from "@/lib/logger"
import type {
  DueDiligenceInput,
  DueDiligenceResult,
  LawsuitInfo,
  AIRiskAnalysis,
} from "./types"

export class DueDiligenceService {
  private escavador: EscavadorProvider | EscavadorMockProvider | EscavadorV2Provider | EscavadorV2MockProvider
  private useMock: boolean
  private useV2: boolean

  private logger = logger.withContext("DueDiligence")

  constructor() {
    const apiKey = process.env.ESCAVADOR_API_KEY

    if (apiKey) {
      // Prioriza V2, mas mantém V1 como fallback se necessário
      try {
        this.escavador = new EscavadorV2Provider(apiKey)
        this.useV2 = true
        this.useMock = false
        this.logger.info("Usando API Escavador V2")
      } catch (error) {
        // Fallback para V1 se V2 falhar
        this.escavador = new EscavadorProvider(apiKey)
        this.useV2 = false
        this.useMock = false
        this.logger.info("Usando API Escavador V1 (fallback)")
      }
    } else {
      this.escavador = new EscavadorV2MockProvider()
      this.useV2 = true
      this.useMock = true
      this.logger.warn("Usando mock (sem ESCAVADOR_API_KEY)")
    }
  }

  /**
   * Executa análise completa de Due Diligence
   */
  async analyze(input: DueDiligenceInput): Promise<DueDiligenceResult> {
    this.logger.info("Iniciando análise", {
      debtorName: input.debtorName,
      debtorDocument: input.debtorDocument,
      propertyAddress: input.propertyAddress,
    })
    const startTime = Date.now()

    const sources: string[] = []
    const errors: string[] = []
    let lawsuits: LawsuitInfo[] = []

    // 1. Buscar processos judiciais no Escavador
    try {
      this.logger.debug("Buscando processos", {
        debtorDocument: input.debtorDocument || "N/A",
        debtorName: input.debtorName,
      })
      
      // Busca completa por CPF e Nome
      lawsuits = await this.escavador.searchComplete(
        input.debtorDocument,
        input.debtorName
      )
      
      sources.push("Escavador (Nacional)")

      this.logger.info("Processos encontrados", {
        count: lawsuits.length,
        debtorName: input.debtorName,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      this.logger.error("Erro ao buscar processos", error, {
        debtorName: input.debtorName,
        debtorDocument: input.debtorDocument,
        errorMessage,
      })
      
      // Adicionar mensagem de erro específica
      if (errorMessage.includes("autenticação") || errorMessage.includes("chave")) {
        errors.push("Erro de autenticação na API do Escavador. Verifique sua chave de API.")
      } else if (errorMessage.includes("Créditos") || errorMessage.includes("limite")) {
        errors.push("Créditos insuficientes ou limite excedido no Escavador. Verifique sua conta.")
      } else {
        errors.push(`Erro ao consultar Escavador: ${errorMessage}`)
      }
    }

    // 2. Analisar com IA
    let aiAnalysis: AIRiskAnalysis
    try {
      aiAnalysis = await this.analyzeWithAI(lawsuits, input)
      this.logger.info("Análise IA concluída", {
        recommendation: aiAnalysis.recommendation,
        confidence: aiAnalysis.confidence,
        debtorName: input.debtorName,
      })
    } catch (error) {
      this.logger.error("Erro na análise IA", error, {
        debtorName: input.debtorName,
        lawsuitsCount: lawsuits.length,
      })
      errors.push("Erro na análise por IA")
      
      // Fallback se IA falhar
      aiAnalysis = this.fallbackAnalysis(lawsuits)
    }

    // 3. Atualizar relevância dos processos baseado na análise da IA
    if (aiAnalysis && "processAnalysis" in aiAnalysis) {
      lawsuits = this.updateLawsuitsRelevance(lawsuits, (aiAnalysis as any).processAnalysis)
    }

    // 4. Calcular estatísticas
    const stats = this.calculateStats(lawsuits)

    const result: DueDiligenceResult = {
      analyzedAt: new Date(),
      debtorName: input.debtorName,
      debtorDocument: input.debtorDocument,
      propertyAddress: input.propertyAddress,

      riskScore: aiAnalysis.recommendation === "avoid" ? "critical" 
        : aiAnalysis.recommendation === "investigate" ? "high"
        : aiAnalysis.recommendation === "caution" ? "medium"
        : "low",
      riskPercentage: this.calculateRiskPercentage(aiAnalysis, stats),

      lawsuits: {
        total: lawsuits.length,
        asPlaintiff: stats.asPlaintiff,
        asDefendant: stats.asDefendant,
        relatedToProperty: stats.relatedToProperty,
        criticalCount: stats.criticalCount,
        items: lawsuits.slice(0, 20), // Limita a 20 para não sobrecarregar
      },

      aiAnalysis,
      sources,
      errors: errors.length > 0 ? errors : undefined,
    }

    const duration = Date.now() - startTime
    this.logger.info("Análise concluída", {
      duration,
      debtorName: input.debtorName,
      riskScore: result.riskScore,
      riskPercentage: result.riskPercentage,
      lawsuitsCount: result.lawsuits.total,
    })

    return result
  }

  /**
   * Analisa os processos usando IA
   */
  private async analyzeWithAI(
    lawsuits: LawsuitInfo[],
    input: DueDiligenceInput
  ): Promise<AIRiskAnalysis> {
    const aiClient = createAIVisionClient()

    // Prepara os dados dos processos para a IA (limita para não exceder tokens)
    const lawsuitsForAI = lawsuits.slice(0, 30).map(l => ({
      number: l.number,
      court: l.court,
      type: l.type,
      subject: l.subject,
      status: l.status,
      value: l.value,
      startDate: l.startDate,
      relevanceReason: l.relevanceReason,
    }))

    const prompt = buildDueDiligencePrompt({
      debtorName: input.debtorName,
      debtorDocument: input.debtorDocument,
      propertyAddress: input.propertyAddress,
      lawsuitsJson: lawsuits.length > 0 
        ? JSON.stringify(lawsuitsForAI, null, 2)
        : "Nenhum processo encontrado.",
    })

    const response = await aiClient.analyze({
      systemPrompt: DUE_DILIGENCE_SYSTEM,
      userPrompt: prompt,
      imageBase64: "", // Não precisa de imagem
      mimeType: "text/plain",
    })

    // Parse da resposta
    let parsed: any
    try {
      parsed = JSON.parse(response.content)
    } catch {
      // Tenta extrair JSON da resposta
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Não foi possível parsear resposta da IA")
      }
    }

    return {
      summary: parsed.summary || "Análise não disponível",
      mainRisks: parsed.mainRisks || [],
      blockingRisks: parsed.blockingRisks || [],
      recommendation: parsed.recommendation || "investigate",
      recommendationText: parsed.recommendationText || "Recomenda-se análise adicional",
      confidence: parsed.confidence || 0.5,
    }
  }

  /**
   * Análise fallback se IA falhar
   */
  private fallbackAnalysis(lawsuits: LawsuitInfo[]): AIRiskAnalysis {
    const hasMany = lawsuits.length > 5
    const hasCritical = lawsuits.some(l => 
      l.type.toLowerCase().includes("execução") ||
      l.type.toLowerCase().includes("penhora") ||
      l.relevance === "critical" ||
      l.relevance === "high"
    )

    return {
      summary: `Foram encontrados ${lawsuits.length} processos. Análise automática não disponível.`,
      mainRisks: hasMany ? ["Múltiplos processos encontrados"] : [],
      blockingRisks: hasCritical ? ["Possíveis execuções identificadas"] : [],
      recommendation: hasCritical ? "investigate" : hasMany ? "caution" : "proceed",
      recommendationText: "Recomenda-se verificação manual dos processos",
      confidence: 0.3,
    }
  }

  /**
   * Atualiza a relevância dos processos baseado na análise da IA
   */
  private updateLawsuitsRelevance(
    lawsuits: LawsuitInfo[],
    processAnalysis: Array<{ number: string; relevance: string; reason: string }>
  ): LawsuitInfo[] {
    if (!processAnalysis || !Array.isArray(processAnalysis)) return lawsuits

    const analysisMap = new Map(processAnalysis.map(p => [p.number, p]))

    return lawsuits.map(lawsuit => {
      const analysis = analysisMap.get(lawsuit.number)
      if (analysis) {
        return {
          ...lawsuit,
          relevance: analysis.relevance as LawsuitInfo["relevance"],
          relevanceReason: analysis.reason,
        }
      }
      return lawsuit
    })
  }

  /**
   * Calcula estatísticas dos processos
   */
  private calculateStats(lawsuits: LawsuitInfo[]) {
    return {
      asPlaintiff: lawsuits.filter(l => 
        l.parties.some(p => p.role === "autor")
      ).length,
      asDefendant: lawsuits.filter(l => 
        l.parties.some(p => p.role === "reu")
      ).length,
      relatedToProperty: lawsuits.filter(l =>
        l.type.toLowerCase().includes("imóvel") ||
        l.type.toLowerCase().includes("imovel") ||
        l.type.toLowerCase().includes("usucapião") ||
        l.type.toLowerCase().includes("condominiais") ||
        l.type.toLowerCase().includes("condomínio") ||
        l.subject?.toLowerCase().includes("imóvel") ||
        l.subject?.toLowerCase().includes("condominiais")
      ).length,
      criticalCount: lawsuits.filter(l => 
        l.relevance === "critical" || l.relevance === "high"
      ).length,
    }
  }

  /**
   * Calcula porcentagem de risco
   */
  private calculateRiskPercentage(
    aiAnalysis: AIRiskAnalysis,
    stats: ReturnType<typeof this.calculateStats>
  ): number {
    // Base da análise da IA
    let base = 0
    switch (aiAnalysis.recommendation) {
      case "avoid": base = 85; break
      case "investigate": base = 60; break
      case "caution": base = 35; break
      case "proceed": base = 15; break
    }

    // Ajustes baseado em estatísticas
    if (stats.criticalCount > 0) base = Math.max(base, 70)
    if (stats.relatedToProperty > 0) base += 15

    // Normaliza entre 0-100
    return Math.min(100, Math.max(0, base))
  }
}

// Singleton para uso em toda aplicação
let service: DueDiligenceService | null = null

export function getDueDiligenceService(): DueDiligenceService {
  if (!service) {
    service = new DueDiligenceService()
  }
  return service
}
