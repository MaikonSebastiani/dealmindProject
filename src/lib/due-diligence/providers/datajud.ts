/**
 * Provider para API pública do DataJud (CNJ)
 * 
 * A API é gratuita mas requer cadastro em:
 * https://datajud-wiki.cnj.jus.br/api-publica/acesso
 * 
 * Documentação: https://datajud-wiki.cnj.jus.br/api-publica/endpoints
 */

import { logger } from "@/lib/logger"
import type { DataJudResponse, LawsuitInfo, ProcessParty } from "../types"

// Tribunais disponíveis na API pública
export const AVAILABLE_COURTS = [
  "tjsp", "tjrj", "tjmg", "tjrs", "tjpr", "tjsc", "tjba", "tjpe", "tjce",
  "tjgo", "tjdf", "tjmt", "tjms", "tjes", "tjpa", "tjam", "tjma", "tjpi",
  "tjrn", "tjpb", "tjal", "tjse", "tjro", "tjac", "tjap", "tjrr", "tjto",
  // Tribunais federais
  "trf1", "trf2", "trf3", "trf4", "trf5", "trf6",
  // Tribunais do trabalho
  "trt1", "trt2", "trt3", "trt4", "trt5", "trt6", "trt7", "trt8", "trt9",
  "trt10", "trt11", "trt12", "trt13", "trt14", "trt15", "trt16", "trt17",
  "trt18", "trt19", "trt20", "trt21", "trt22", "trt23", "trt24",
] as const

export type CourtCode = typeof AVAILABLE_COURTS[number]

export class DataJudProvider {
  private baseUrl = "https://api-publica.datajud.cnj.jus.br"
  private apiKey: string
  private logger = logger.withContext("DataJud")

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Busca processos por CPF/CNPJ em um tribunal específico
   */
  async searchByDocument(
    document: string,
    court: CourtCode = "tjsp",
    size: number = 50
  ): Promise<DataJudResponse> {
    // Remove formatação do documento
    const cleanDoc = document.replace(/\D/g, "")

    const endpoint = `${this.baseUrl}/api_publica_${court}/_search`

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `APIKey ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            bool: {
              should: [
                { match: { "numeroDocumentoPrincipal": cleanDoc } },
                { match_phrase: { "dadosBasicos.polo.parte.pessoa.documento.numero": cleanDoc } },
              ],
              minimum_should_match: 1,
            },
          },
          size,
          sort: [{ dataAjuizamento: { order: "desc" } }],
        }),
      })

      if (!response.ok) {
        this.logger.error("Erro na API ao buscar por documento", new Error(`Status ${response.status}`), {
          status: response.status,
          statusText: response.statusText,
          court,
          document: cleanDoc.substring(0, 3) + "***", // Não logar documento completo
        })
        return { hits: { total: { value: 0 }, hits: [] } }
      }

      return await response.json()
    } catch (error) {
      this.logger.error("Erro na consulta ao tribunal", error, { court, document: cleanDoc.substring(0, 3) + "***" })
      return { hits: { total: { value: 0 }, hits: [] } }
    }
  }

  /**
   * Busca processos por nome em um tribunal específico
   */
  async searchByName(
    name: string,
    court: CourtCode = "tjsp",
    size: number = 50
  ): Promise<DataJudResponse> {
    const endpoint = `${this.baseUrl}/api_publica_${court}/_search`

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `APIKey ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            bool: {
              should: [
                { match_phrase: { "dadosBasicos.polo.parte.pessoa.nome": name } },
              ],
            },
          },
          size,
          sort: [{ dataAjuizamento: { order: "desc" } }],
        }),
      })

      if (!response.ok) {
        this.logger.error("Erro na API ao buscar por nome", new Error(`Status ${response.status}`), {
          status: response.status,
          court,
          name,
        })
        return { hits: { total: { value: 0 }, hits: [] } }
      }

      return await response.json()
    } catch (error) {
      this.logger.error("Erro na consulta ao tribunal por nome", error, { court, name })
      return { hits: { total: { value: 0 }, hits: [] } }
    }
  }

  /**
   * Busca em múltiplos tribunais por CPF E por NOME (deduplicado)
   */
  async searchMultipleCourts(
    document?: string,
    name?: string,
    courts: CourtCode[] = ["tjsp", "trf3", "trt2"]
  ): Promise<LawsuitInfo[]> {
    const allResults: LawsuitInfo[] = []
    const seenProcessNumbers = new Set<string>()

    for (const court of courts) {
      this.logger.debug("Consultando tribunal", { court: court.toUpperCase() })
      
      // 1. Busca por CPF/CNPJ (se disponível)
      if (document) {
        try {
          const byDoc = await this.searchByDocument(document, court, 30)
          if (byDoc.hits?.hits) {
            this.logger.debug("Processos encontrados por CPF", {
              court: court.toUpperCase(),
              count: byDoc.hits.hits.length,
            })
            for (const hit of byDoc.hits.hits) {
              const normalized = this.normalizeProcess(hit._source, court)
              if (!seenProcessNumbers.has(normalized.number)) {
                seenProcessNumbers.add(normalized.number)
                allResults.push(normalized)
              }
            }
          }
        } catch (e) {
          this.logger.error("Erro ao buscar por CPF", e, { court })
        }
        
        // Pequeno delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // 2. Busca por NOME (sempre, pois CPF pode não estar indexado)
      if (name) {
        try {
          const byName = await this.searchByName(name, court, 30)
          if (byName.hits?.hits) {
            this.logger.debug("Processos encontrados por nome", {
              court: court.toUpperCase(),
              count: byName.hits.hits.length,
            })
            for (const hit of byName.hits.hits) {
              const normalized = this.normalizeProcess(hit._source, court)
              // Só adiciona se não for duplicata
              if (!seenProcessNumbers.has(normalized.number)) {
                seenProcessNumbers.add(normalized.number)
                allResults.push(normalized)
              }
            }
          }
        } catch (e) {
          this.logger.error("Erro ao buscar por nome", e, { court })
        }
        
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    this.logger.info("Busca em múltiplos tribunais concluída", {
      totalProcessos: allResults.length,
      courtsConsultados: courts.length,
    })
    return allResults
  }

  /**
   * Normaliza um processo do DataJud para o formato interno
   */
  private normalizeProcess(source: DataJudHit["_source"], court: string): LawsuitInfo {
    const lastMovement = source.movimentos?.[0]

    return {
      number: source.numeroProcesso || "Não informado",
      court: court.toUpperCase(),
      instance: source.grau || undefined,
      type: source.classeProcessual || "Não informado",
      subject: source.assunto || undefined,
      status: lastMovement?.nome || "Em andamento",
      startDate: source.dataAjuizamento,
      lastMovement: lastMovement?.dataHora,
      parties: [], // DataJud não retorna partes de forma estruturada na busca
      relevance: "medium", // Será reclassificado pela IA
    }
  }
}

/**
 * Provider de simulação para testes (sem API key)
 */
export class DataJudMockProvider {
  private logger = logger.withContext("DataJud Mock")

  async searchByDocument(document: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Simulando busca por documento", { document: document.substring(0, 3) + "***" })
    
    // Simula alguns processos para teste
    return [
      {
        number: "1234567-89.2023.8.26.0100",
        court: "TJSP",
        type: "Execução Fiscal",
        subject: "IPTU",
        status: "Em andamento",
        startDate: "2023-05-15",
        parties: [
          { name: "Prefeitura de São Paulo", role: "autor" },
          { name: "Devedor Exemplo", role: "reu", document },
        ],
        relevance: "high",
        relevanceReason: "Execução fiscal pode gerar penhora",
      },
      {
        number: "9876543-21.2022.8.26.0100",
        court: "TJSP",
        type: "Procedimento Comum Cível",
        subject: "Cobrança",
        status: "Sentença proferida",
        startDate: "2022-08-20",
        parties: [
          { name: "Banco XYZ S.A.", role: "autor" },
          { name: "Devedor Exemplo", role: "reu", document },
        ],
        relevance: "medium",
        relevanceReason: "Ação de cobrança - verificar se há penhora",
      },
    ]
  }

  async searchByName(name: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Simulando busca por nome", { name })
    return this.searchByDocument("00000000000")
  }

  async searchMultipleCourts(): Promise<LawsuitInfo[]> {
    return this.searchByDocument("00000000000")
  }
}

// Tipo exportado do source para uso interno
type DataJudHit = {
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

