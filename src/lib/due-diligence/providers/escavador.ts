/**
 * Provider para API do Escavador
 * 
 * Documentação: https://api.escavador.com/docs
 * 
 * Cobertura nacional de processos judiciais
 * Busca por CPF, CNPJ, Nome ou número do processo
 */

import { logger } from "@/lib/logger"
import type { LawsuitInfo, ProcessParty } from "../types"

// Tipos da API do Escavador
type EscavadorPessoa = {
  id: number
  nome: string
  cpf_cnpj?: string
  tipo_pessoa?: "FISICA" | "JURIDICA"
  quantidade_processos?: number
}

type EscavadorProcesso = {
  id: number
  numero_cnj: string
  titulo_polo_ativo?: string
  titulo_polo_passivo?: string
  tribunal?: string
  classe?: {
    nome: string
  }
  assuntos?: Array<{
    nome: string
  }>
  data_inicio?: string
  data_ultima_movimentacao?: string
  grau?: string
  valor_causa?: number
  situacao?: string
  fontes?: Array<{
    nome: string
    sigla: string
    tipo: string
    grau: string
  }>
  envolvidos?: Array<{
    nome: string
    tipo_participacao: string
    polo?: "ATIVO" | "PASSIVO"
  }>
}

type EscavadorSearchResponse = {
  items: EscavadorProcesso[]
  total_count: number
  page: number
  page_count: number
}

type EscavadorPessoaResponse = {
  id: number
  nome: string
  cpf_cnpj?: string
  processos?: {
    items: EscavadorProcesso[]
    total_count: number
  }
}

export class EscavadorProvider {
  private baseUrl = "https://api.escavador.com/v1"
  private apiKey: string
  private logger = logger.withContext("Escavador")

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Busca pessoa por CPF e retorna seus processos
   */
  async searchByCPF(cpf: string): Promise<LawsuitInfo[]> {
    const cleanCpf = cpf.replace(/\D/g, "")
    this.logger.debug("Buscando por CPF", { cpf: cleanCpf })

    try {
      // Primeiro busca a pessoa
      const pessoaResponse = await fetch(
        `${this.baseUrl}/pessoas/documento/${cleanCpf}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!pessoaResponse.ok) {
        // SEMPRE capturar corpo da resposta primeiro (mesmo em 404)
        let errorBody = ""
        try {
          errorBody = await pessoaResponse.text()
        } catch {}
        
        // Verificar se há mensagem de erro relacionada a créditos no corpo
        const errorBodyLower = errorBody.toLowerCase()
        const hasCreditError = errorBodyLower.includes("crédito") || 
                               errorBodyLower.includes("credito") ||
                               errorBodyLower.includes("saldo") ||
                               errorBodyLower.includes("insuficiente") ||
                               errorBodyLower.includes("quota") ||
                               errorBodyLower.includes("limit") ||
                               errorBodyLower.includes("sem crédito") ||
                               errorBodyLower.includes("sem credito")
        
        if (pessoaResponse.status === 404) {
          // Se 404 mas tem mensagem de crédito, tratar como erro de crédito
          if (hasCreditError) {
            this.logger.error("Créditos insuficientes no Escavador (detectado em 404)", new Error(`Status 404 com erro de crédito`), {
              status: pessoaResponse.status,
              cpf: cleanCpf,
              errorBody: errorBody.substring(0, 500),
            })
            throw new Error("Créditos insuficientes no Escavador. Recarregue sua conta.")
          }
          
          this.logger.debug("Pessoa não encontrada por CPF", { 
            cpf: cleanCpf,
            errorBody: errorBody.substring(0, 200), // Logar corpo mesmo em 404 para debug
          })
          return []
        }
        
        // Identificar erros específicos
        if (pessoaResponse.status === 401 || pessoaResponse.status === 403) {
          this.logger.error("Erro de autenticação na API Escavador", new Error(`Status ${pessoaResponse.status}`), {
            status: pessoaResponse.status,
            cpf: cleanCpf,
            errorBody: errorBody.substring(0, 500),
          })
          throw new Error("Erro de autenticação na API do Escavador. Verifique sua chave de API.")
        }
        
        if (pessoaResponse.status === 402 || pessoaResponse.status === 429 || hasCreditError) {
          this.logger.error("Créditos insuficientes ou limite excedido no Escavador", new Error(`Status ${pessoaResponse.status}`), {
            status: pessoaResponse.status,
            cpf: cleanCpf,
            errorBody: errorBody.substring(0, 500),
          })
          throw new Error("Créditos insuficientes ou limite de requisições excedido no Escavador.")
        }
        
        this.logger.error("Erro na API ao buscar por CPF", new Error(`Status ${pessoaResponse.status}`), {
          status: pessoaResponse.status,
          cpf: cleanCpf,
          errorBody: errorBody.substring(0, 500),
        })
        return []
      }

      const pessoa: EscavadorPessoaResponse = await pessoaResponse.json()
      this.logger.info("Pessoa encontrada", {
        pessoaId: pessoa.id,
        nome: pessoa.nome,
        cpf: cleanCpf,
      })

      // Busca processos da pessoa
      return await this.getProcessosPessoa(pessoa.id)
    } catch (error) {
      this.logger.error("Erro ao buscar por CPF", error, { cpf: cleanCpf })
      return []
    }
  }

  /**
   * Busca pessoa por nome e retorna seus processos
   */
  async searchByName(name: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Buscando por nome", { name })

    try {
      // Busca pessoas pelo nome
      const searchResponse = await fetch(
        `${this.baseUrl}/pessoas/buscar?q=${encodeURIComponent(name)}&quantidade=5`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!searchResponse.ok) {
        // SEMPRE capturar corpo da resposta primeiro
        let errorBody = ""
        try {
          errorBody = await searchResponse.text()
        } catch {}
        
        // Verificar se há mensagem de erro relacionada a créditos no corpo
        const errorBodyLower = errorBody.toLowerCase()
        const hasCreditError = errorBodyLower.includes("crédito") || 
                               errorBodyLower.includes("credito") ||
                               errorBodyLower.includes("saldo") ||
                               errorBodyLower.includes("insuficiente") ||
                               errorBodyLower.includes("quota") ||
                               errorBodyLower.includes("limit") ||
                               errorBodyLower.includes("sem crédito") ||
                               errorBodyLower.includes("sem credito")
        
        // Identificar erros específicos
        if (searchResponse.status === 401 || searchResponse.status === 403) {
          this.logger.error("Erro de autenticação na API Escavador", new Error(`Status ${searchResponse.status}`), {
            status: searchResponse.status,
            name,
            errorBody: errorBody.substring(0, 500),
          })
          throw new Error("Erro de autenticação na API do Escavador. Verifique sua chave de API.")
        }
        
        if (searchResponse.status === 402 || searchResponse.status === 429 || hasCreditError) {
          this.logger.error("Créditos insuficientes ou limite excedido no Escavador", new Error(`Status ${searchResponse.status}`), {
            status: searchResponse.status,
            name,
            errorBody: errorBody.substring(0, 500),
          })
          throw new Error("Créditos insuficientes ou limite de requisições excedido no Escavador.")
        }
        
        this.logger.error("Erro na busca por nome", new Error(`Status ${searchResponse.status}`), {
          status: searchResponse.status,
          name,
          errorBody: errorBody.substring(0, 500),
        })
        return []
      }

      const searchResult = await searchResponse.json()
      const pessoas: EscavadorPessoa[] = searchResult.items || []

      if (pessoas.length === 0) {
        this.logger.debug("Nenhuma pessoa encontrada com o nome", { name })
        return []
      }

      this.logger.info("Pessoas encontradas", {
        count: pessoas.length,
        name,
      })

      // Pega processos da primeira pessoa (mais relevante)
      // Se precisar de mais precisão, pode filtrar por CPF depois
      const allProcessos: LawsuitInfo[] = []
      
      for (const pessoa of pessoas.slice(0, 2)) { // Limita a 2 pessoas
        const processos = await this.getProcessosPessoa(pessoa.id)
        allProcessos.push(...processos)
      }

      // Remove duplicatas por número do processo
      const seen = new Set<string>()
      return allProcessos.filter(p => {
        if (seen.has(p.number)) return false
        seen.add(p.number)
        return true
      })
    } catch (error) {
      this.logger.error("Erro ao buscar por nome", error, { name })
      return []
    }
  }

  /**
   * Busca processos de uma pessoa pelo ID interno do Escavador
   */
  private async getProcessosPessoa(pessoaId: number): Promise<LawsuitInfo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/pessoas/${pessoaId}/processos?quantidade=50`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        // SEMPRE capturar corpo da resposta primeiro
        let errorBody = ""
        try {
          errorBody = await response.text()
        } catch {}
        
        // Verificar se há mensagem de erro relacionada a créditos no corpo
        const errorBodyLower = errorBody.toLowerCase()
        const hasCreditError = errorBodyLower.includes("crédito") || 
                               errorBodyLower.includes("credito") ||
                               errorBodyLower.includes("saldo") ||
                               errorBodyLower.includes("insuficiente") ||
                               errorBodyLower.includes("quota") ||
                               errorBodyLower.includes("limit") ||
                               errorBodyLower.includes("sem crédito") ||
                               errorBodyLower.includes("sem credito")
        
        // Identificar erros específicos
        if (response.status === 401 || response.status === 403) {
          this.logger.error("Erro de autenticação na API Escavador", new Error(`Status ${response.status}`), {
            status: response.status,
            pessoaId,
            errorBody: errorBody.substring(0, 500),
          })
          throw new Error("Erro de autenticação na API do Escavador. Verifique sua chave de API.")
        }
        
        if (response.status === 402 || response.status === 429 || hasCreditError) {
          this.logger.error("Créditos insuficientes ou limite excedido no Escavador", new Error(`Status ${response.status}`), {
            status: response.status,
            pessoaId,
            errorBody: errorBody.substring(0, 500),
          })
          throw new Error("Créditos insuficientes ou limite de requisições excedido no Escavador.")
        }
        
        this.logger.error("Erro ao buscar processos", new Error(`Status ${response.status}`), {
          status: response.status,
          pessoaId,
          errorBody: errorBody.substring(0, 500),
        })
        return []
      }

      const data = await response.json()
      const processos: EscavadorProcesso[] = data.items || []
      const totalCount = data.total_count || processos.length

      this.logger.info("Processos encontrados para pessoa", {
        pessoaId,
        count: processos.length,
        totalCount,
        hasMore: totalCount > processos.length,
      })

      return processos.map(p => this.normalizeProcesso(p))
    } catch (error) {
      this.logger.error("Erro ao buscar processos da pessoa", error, { pessoaId })
      return []
    }
  }

  /**
   * Busca completa por CPF/CNPJ apenas (não busca por nome)
   */
  async searchComplete(cpf?: string, name?: string): Promise<LawsuitInfo[]> {
    const allResults: LawsuitInfo[] = []
    const seenNumbers = new Set<string>()

    this.logger.debug("Iniciando busca por CPF/CNPJ", {
      cpf: cpf ? `${cpf.substring(0, 3)}***` : "não fornecido",
      name: name ? "fornecido (não usado)" : "não fornecido",
    })

    // Busca apenas por CPF/CNPJ (mais preciso e evita falsos positivos)
    if (!cpf) {
      this.logger.warn("CPF/CNPJ não fornecido, não é possível buscar processos", {
        name: name || "não fornecido",
      })
      return []
    }

    try {
      const byCpf = await this.searchByCPF(cpf)
      this.logger.debug("Resultados da busca por CPF/CNPJ", {
        encontrados: byCpf.length,
        processos: byCpf.map(p => p.number),
      })
      for (const p of byCpf) {
        if (!seenNumbers.has(p.number)) {
          seenNumbers.add(p.number)
          allResults.push(p)
        }
      }
    } catch (error) {
      // Erro já foi logado no searchByCPF, apenas propagar
      throw error
    }

    this.logger.info("Busca por CPF/CNPJ concluída", {
      totalProcessos: allResults.length,
      cpf: "fornecido",
      processosUnicos: Array.from(seenNumbers),
    })
    return allResults
  }

  /**
   * Normaliza processo do Escavador para formato interno
   */
  private normalizeProcesso(processo: EscavadorProcesso): LawsuitInfo {
    // Extrai partes do processo
    const parties: ProcessParty[] = (processo.envolvidos || []).map(e => ({
      name: e.nome,
      role: e.polo === "ATIVO" ? "autor" as const 
        : e.polo === "PASSIVO" ? "reu" as const 
        : "terceiro" as const,
    }))

    // Determina relevância inicial baseada no tipo
    let relevance: LawsuitInfo["relevance"] = "medium"
    const classe = (processo.classe?.nome || "").toLowerCase()
    const assuntos = (processo.assuntos || []).map(a => a.nome.toLowerCase()).join(" ")

    // Processos críticos
    if (
      classe.includes("execução") ||
      classe.includes("penhora") ||
      classe.includes("falência") ||
      classe.includes("recuperação judicial") ||
      assuntos.includes("condomínio") ||
      assuntos.includes("condominiais") ||
      assuntos.includes("iptu") ||
      assuntos.includes("trabalhista")
    ) {
      relevance = "high"
    }

    // Processos muito críticos
    if (
      classe.includes("usucapião") ||
      classe.includes("indisponibilidade") ||
      classe.includes("arresto") ||
      classe.includes("sequestro")
    ) {
      relevance = "critical"
    }

    return {
      number: processo.numero_cnj || "Não informado",
      court: processo.tribunal || processo.fontes?.[0]?.sigla || "Não informado",
      instance: processo.grau || undefined,
      type: processo.classe?.nome || "Não informado",
      subject: processo.assuntos?.[0]?.nome || undefined,
      status: processo.situacao || "Em andamento",
      value: processo.valor_causa,
      startDate: processo.data_inicio,
      lastMovement: processo.data_ultima_movimentacao,
      parties,
      relevance,
      relevanceReason: this.getRelevanceReason(classe, assuntos),
    }
  }

  /**
   * Gera motivo da relevância
   */
  private getRelevanceReason(classe: string, assuntos: string): string | undefined {
    if (classe.includes("execução") && assuntos.includes("condominiais")) {
      return "Execução de despesas condominiais - dívida pode seguir o imóvel"
    }
    if (classe.includes("execução") && assuntos.includes("fiscal")) {
      return "Execução fiscal - pode gerar penhora do imóvel"
    }
    if (classe.includes("execução")) {
      return "Execução - verificar se há penhora"
    }
    if (classe.includes("trabalhista") || assuntos.includes("trabalhista")) {
      return "Processo trabalhista - pode gerar penhora de bens"
    }
    if (classe.includes("usucapião")) {
      return "Usucapião - disputa sobre propriedade do imóvel"
    }
    if (classe.includes("falência") || classe.includes("recuperação")) {
      return "Processo de falência/recuperação - alto risco"
    }
    return undefined
  }
}

/**
 * Provider mock para testes (sem API key)
 */
export class EscavadorMockProvider {
  private logger = logger.withContext("Escavador Mock")

  async searchByCPF(cpf: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Simulando busca por CPF", { cpf })
    return this.getMockData()
  }

  async searchByName(name: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Simulando busca por nome", { name })
    return this.getMockData()
  }

  async searchComplete(cpf?: string, name?: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Simulando busca completa", { cpf: cpf ? "fornecido" : undefined, name })
    return this.getMockData()
  }

  private getMockData(): LawsuitInfo[] {
    return [
      {
        number: "1010924-10.2024.8.26.0003",
        court: "TJSP",
        type: "Execução de Título Extrajudicial",
        subject: "Despesas Condominiais",
        status: "Em andamento",
        value: 9910.08,
        startDate: "2024-04-23",
        parties: [
          { name: "Condomínio Residencial Parque do Estado", role: "autor" },
          { name: "Devedor Exemplo", role: "reu" },
        ],
        relevance: "high",
        relevanceReason: "Execução de despesas condominiais - dívida pode seguir o imóvel",
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
          { name: "Devedor Exemplo", role: "reu" },
        ],
        relevance: "medium",
        relevanceReason: "Ação de cobrança - verificar se há penhora",
      },
    ]
  }
}

