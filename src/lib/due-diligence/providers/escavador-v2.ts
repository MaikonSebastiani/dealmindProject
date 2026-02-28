/**
 * Provider para API V2 do Escavador
 * 
 * Documentação: https://api.escavador.com/v2/docs
 * 
 * Vantagens da V2:
 * - Mais informações estruturadas
 * - Busca por número CNJ
 * - Atualização de processos
 * - Monitoramento de processos
 */

import { logger } from "@/lib/logger"
import type { LawsuitInfo, ProcessParty } from "../types"

// Tipos da API V2 do Escavador
type EscavadorV2Processo = {
  numero_cnj: string
  data_inicio?: string
  tribunal?: {
    id: number
    nome: string
    sigla: string
  }
  classe?: {
    nome: string
  }
  assuntos?: Array<{
    nome: string
  }>
  valor_causa?: number
  situacao?: string
  grau?: string
  envolvidos?: Array<{
    nome: string
    tipo_participacao: string
    polo?: "ATIVO" | "PASSIVO"
  }>
  movimentacoes?: Array<{
    data: string
    descricao: string
  }>
}

type EscavadorV2SearchResponse = {
  items: EscavadorV2Processo[]
  total_count: number
  page: number
  page_count: number
}

type EscavadorV2ProcessoDetail = EscavadorV2Processo & {
  data_ultima_movimentacao?: string
  data_ultima_verificacao?: string
  tempo_desde_ultima_verificacao?: string
}

type EscavadorV2StatusAtualizacao = {
  numero_cnj: string
  data_ultima_verificacao?: string
  tempo_desde_ultima_verificacao?: string
  status?: "SUCESSO" | "NAO_ENCONTRADO" | "ERRO" | "EM_ANDAMENTO"
}

type EscavadorPessoa = {
  id: number
  nome: string
  cpf_cnpj?: string
  tipo_pessoa?: "FISICA" | "JURIDICA"
  quantidade_processos?: number
}

type EscavadorPessoaResponse = {
  id: number
  nome: string
  cpf_cnpj?: string
  quantidade_processos?: number
}

export class EscavadorV2Provider {
  private baseUrl = "https://api.escavador.com/api/v2"
  private apiKey: string
  private logger = logger.withContext("EscavadorV2")

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Busca processos por número CNJ
   * Útil para verificar processos específicos mencionados em documentos
   */
  async searchByCNJ(numeroCNJ: string): Promise<LawsuitInfo | null> {
    const cleanCNJ = numeroCNJ.replace(/\D/g, "")
    this.logger.debug("Buscando processo por CNJ", { numeroCNJ: cleanCNJ })

    try {
      const response = await fetch(
        `${this.baseUrl}/processos/numero_cnj/${cleanCNJ}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        
        if (response.status === 404) {
          this.logger.debug("Processo não encontrado", { numeroCNJ: cleanCNJ })
          return null
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error("Erro de autenticação na API do Escavador. Verifique sua chave de API.")
        }

        if (response.status === 402 || response.status === 429) {
          throw new Error("Créditos insuficientes ou limite de requisições excedido.")
        }

        this.logger.error("Erro ao buscar processo por CNJ", new Error(`Status ${response.status}`), {
          status: response.status,
          numeroCNJ: cleanCNJ,
          errorBody: errorBody.substring(0, 500),
        })
        return null
      }

      const processo: EscavadorV2ProcessoDetail = await response.json()
      return this.normalizeProcesso(processo)
    } catch (error) {
      this.logger.error("Erro ao buscar processo por CNJ", error, { numeroCNJ: cleanCNJ })
      if (error instanceof Error && error.message.includes("autenticação")) {
        throw error
      }
      return null
    }
  }

  /**
   * Busca processos por CPF/CNPJ
   * Nota: A V2 ainda usa a busca de pessoas primeiro, similar à V1
   */
  async searchByCPF(cpf: string): Promise<LawsuitInfo[]> {
    const cleanCpf = cpf.replace(/\D/g, "")
    this.logger.debug("Buscando por CPF", { cpf: cleanCpf })

    try {
      // Na V2, ainda precisamos buscar pessoas primeiro
      // Depois buscamos os processos de cada pessoa encontrada
      const pessoaResponse = await fetch(
        `https://api.escavador.com/api/v1/pessoas/documento/${cleanCpf}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!pessoaResponse.ok) {
        const errorBody = await pessoaResponse.text().catch(() => "")
        
        if (pessoaResponse.status === 404) {
          this.logger.debug("Pessoa não encontrada por CPF", { 
            cpf: cleanCpf,
            errorBody: errorBody.substring(0, 500), // Logar corpo mesmo em 404 para debug
            reason: "CPF não está indexado no banco do Escavador ou não existe",
          })
          return []
        }

        if (pessoaResponse.status === 401 || pessoaResponse.status === 403) {
          throw new Error("Erro de autenticação na API do Escavador. Verifique sua chave de API.")
        }

        if (pessoaResponse.status === 402 || pessoaResponse.status === 429) {
          throw new Error("Créditos insuficientes ou limite de requisições excedido.")
        }

        this.logger.error("Erro ao buscar por CPF", new Error(`Status ${pessoaResponse.status}`), {
          status: pessoaResponse.status,
          cpf: cleanCpf,
          errorBody: errorBody.substring(0, 500),
        })
        return []
      }

      const pessoa: EscavadorPessoaResponse = await pessoaResponse.json()
      
      // Logar informações sobre quantidade de processos se disponível
      const quantidadeProcessos = pessoa.quantidade_processos
      this.logger.info("Pessoa encontrada", {
        pessoaId: pessoa.id,
        nome: pessoa.nome,
        cpf: cleanCpf,
        quantidadeProcessos: quantidadeProcessos ?? "não informado",
      })

      // Se pessoa tem quantidade_processos informada e é 0, logar e retornar vazio
      if (quantidadeProcessos !== undefined && quantidadeProcessos === 0) {
        this.logger.warn("Pessoa encontrada mas sem processos indexados", {
          pessoaId: pessoa.id,
          nome: pessoa.nome,
          cpf: cleanCpf,
          reason: "Pessoa existe no Escavador mas não tem processos vinculados ou indexados",
        })
        return []
      }

      // Busca processos da pessoa usando V1 (ainda é a forma mais eficiente)
      const processos = await this.getProcessosPessoa(pessoa.id)
      
      // Se não encontrou processos mas a API indicava que havia, logar
      if (processos.length === 0 && quantidadeProcessos !== undefined && quantidadeProcessos > 0) {
        this.logger.warn("Pessoa indicava ter processos mas nenhum foi retornado", {
          pessoaId: pessoa.id,
          nome: pessoa.nome,
          quantidadeProcessosEsperados: quantidadeProcessos,
          reason: "Processos podem não estar totalmente indexados ou há problema na API",
        })
      }
      
      return processos
    } catch (error) {
      this.logger.error("Erro ao buscar por CPF", error, { cpf: cleanCpf })
      if (error instanceof Error && error.message.includes("autenticação")) {
        throw error
      }
      return []
    }
  }

  /**
   * Busca processos de uma pessoa pelo ID interno do Escavador
   */
  private async getProcessosPessoa(pessoaId: number): Promise<LawsuitInfo[]> {
    try {
      const response = await fetch(
        `https://api.escavador.com/api/v1/pessoas/${pessoaId}/processos?quantidade=50`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        
        if (response.status === 401 || response.status === 403) {
          throw new Error("Erro de autenticação na API do Escavador. Verifique sua chave de API.")
        }

        if (response.status === 402 || response.status === 429) {
          throw new Error("Créditos insuficientes ou limite de requisições excedido.")
        }

        this.logger.error("Erro ao buscar processos", new Error(`Status ${response.status}`), {
          status: response.status,
          pessoaId,
          errorBody: errorBody.substring(0, 500),
        })
        return []
      }

      const data = await response.json()
      const processos: EscavadorV2Processo[] = data.items || []
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
      if (error instanceof Error && error.message.includes("autenticação")) {
        throw error
      }
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
        `https://api.escavador.com/api/v1/pessoas/buscar?q=${encodeURIComponent(name)}&quantidade=5`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!searchResponse.ok) {
        const errorBody = await searchResponse.text().catch(() => "")
        
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
        pessoas: pessoas.map(p => ({ id: p.id, nome: p.nome, quantidadeProcessos: p.quantidade_processos })),
      })

      // Pega processos das pessoas mais relevantes (limita a 2 para não gastar muitos créditos)
      const allProcessos: LawsuitInfo[] = []
      
      for (const pessoa of pessoas.slice(0, 2)) {
        const processos = await this.getProcessosPessoa(pessoa.id)
        allProcessos.push(...processos)
      }

      // Remove duplicatas por número do processo
      const seen = new Set<string>()
      const uniqueProcessos = allProcessos.filter(p => {
        if (seen.has(p.number)) return false
        seen.add(p.number)
        return true
      })

      this.logger.info("Busca por nome concluída", {
        pessoasConsultadas: pessoas.slice(0, 2).length,
        processosEncontrados: uniqueProcessos.length,
        processosDuplicadosRemovidos: allProcessos.length - uniqueProcessos.length,
      })

      return uniqueProcessos
    } catch (error) {
      this.logger.error("Erro ao buscar por nome", error, { name })
      if (error instanceof Error && error.message.includes("autenticação")) {
        throw error
      }
      if (error instanceof Error && error.message.includes("Créditos")) {
        throw error
      }
      return []
    }
  }

  /**
   * Busca completa por CPF/CNPJ com fallback para nome
   */
  async searchComplete(cpf?: string, name?: string): Promise<LawsuitInfo[]> {
    const allResults: LawsuitInfo[] = []
    const seenNumbers = new Set<string>()

    this.logger.debug("Iniciando busca completa", {
      cpf: cpf ? `${cpf.substring(0, 3)}***` : "não fornecido",
      name: name ? "fornecido" : "não fornecido",
    })

    if (!cpf && !name) {
      this.logger.warn("CPF/CNPJ e nome não fornecidos, não é possível buscar processos")
      return []
    }

    // Primeiro tenta busca por CPF
    if (cpf) {
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
        // Se erro de autenticação ou créditos, propagar
        if (error instanceof Error && (error.message.includes("autenticação") || error.message.includes("Créditos"))) {
          throw error
        }
        this.logger.warn("Erro na busca por CPF, continuando com fallback", { error: error instanceof Error ? error.message : "Erro desconhecido" })
      }
    }

    // Se não encontrou resultados e nome foi fornecido, tenta busca por nome como fallback
    if (allResults.length === 0 && name) {
      this.logger.info("Nenhum resultado por CPF, tentando busca por nome como fallback", {
        cpf: cpf ? "fornecido" : "não fornecido",
        name,
      })
      
      try {
        const byName = await this.searchByName(name)
        this.logger.debug("Resultados da busca por nome (fallback)", {
          encontrados: byName.length,
          processos: byName.map(p => p.number),
        })
        for (const p of byName) {
          if (!seenNumbers.has(p.number)) {
            seenNumbers.add(p.number)
            allResults.push(p)
          }
        }
        
        if (byName.length > 0) {
          this.logger.info("Fallback por nome encontrou resultados", {
            processosEncontrados: byName.length,
            metodo: "busca por nome",
          })
        }
      } catch (error) {
        // Se erro de autenticação ou créditos, propagar
        if (error instanceof Error && (error.message.includes("autenticação") || error.message.includes("Créditos"))) {
          throw error
        }
        this.logger.warn("Erro na busca por nome (fallback)", { error: error instanceof Error ? error.message : "Erro desconhecido" })
      }
    }

    this.logger.info("Busca completa concluída", {
      totalProcessos: allResults.length,
      metodoUsado: cpf && allResults.length > 0 ? "CPF" : name && allResults.length > 0 ? "nome (fallback)" : "nenhum resultado",
      processosUnicos: Array.from(seenNumbers),
    })
    return allResults
  }

  /**
   * Verifica status de atualização de um processo
   */
  async getProcessStatus(numeroCNJ: string): Promise<EscavadorV2StatusAtualizacao | null> {
    const cleanCNJ = numeroCNJ.replace(/\D/g, "")
    this.logger.debug("Verificando status de atualização", { numeroCNJ: cleanCNJ })

    try {
      const response = await fetch(
        `${this.baseUrl}/processos/numero_cnj/${cleanCNJ}/status-atualizacao`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        return null
      }

      return await response.json()
    } catch (error) {
      this.logger.error("Erro ao verificar status", error, { numeroCNJ: cleanCNJ })
      return null
    }
  }

  /**
   * Solicita atualização de um processo
   */
  async requestProcessUpdate(numeroCNJ: string): Promise<boolean> {
    const cleanCNJ = numeroCNJ.replace(/\D/g, "")
    this.logger.debug("Solicitando atualização de processo", { numeroCNJ: cleanCNJ })

    try {
      const response = await fetch(
        `${this.baseUrl}/processos/numero_cnj/${cleanCNJ}/atualizar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "")
        this.logger.error("Erro ao solicitar atualização", new Error(`Status ${response.status}`), {
          status: response.status,
          numeroCNJ: cleanCNJ,
          errorBody: errorBody.substring(0, 500),
        })
        return false
      }

      return true
    } catch (error) {
      this.logger.error("Erro ao solicitar atualização", error, { numeroCNJ: cleanCNJ })
      return false
    }
  }

  /**
   * Normaliza processo da V2 para formato interno
   */
  private normalizeProcesso(processo: EscavadorV2Processo | EscavadorV2ProcessoDetail): LawsuitInfo {
    const parties: ProcessParty[] = (processo.envolvidos || []).map(e => ({
      name: e.nome,
      role: e.polo === "ATIVO" ? "autor" as const 
        : e.polo === "PASSIVO" ? "reu" as const 
        : "terceiro" as const,
    }))

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

    const lastMovement = "data_ultima_movimentacao" in processo 
      ? processo.data_ultima_movimentacao 
      : undefined

    return {
      number: processo.numero_cnj || "Não informado",
      court: processo.tribunal?.sigla || "Não informado",
      instance: processo.grau || undefined,
      type: processo.classe?.nome || "Não informado",
      subject: processo.assuntos?.[0]?.nome || undefined,
      status: processo.situacao || "Em andamento",
      value: processo.valor_causa,
      startDate: processo.data_inicio,
      lastMovement,
      parties,
      relevance,
      relevanceReason: this.getRelevanceReason(classe, assuntos),
    }
  }

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
export class EscavadorV2MockProvider {
  private logger = logger.withContext("EscavadorV2 Mock")

  async searchByCNJ(numeroCNJ: string): Promise<LawsuitInfo | null> {
    this.logger.debug("Simulando busca por CNJ", { numeroCNJ })
    return null
  }

  async searchByCPF(cpf: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Simulando busca por CPF", { cpf })
    return []
  }

  async searchByName(name: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Simulando busca por nome", { name })
    return []
  }

  async searchComplete(cpf?: string, name?: string): Promise<LawsuitInfo[]> {
    this.logger.debug("Simulando busca completa", { cpf: cpf ? "fornecido" : undefined, name })
    return []
  }

  async getProcessStatus(numeroCNJ: string) {
    return null
  }

  async requestProcessUpdate(numeroCNJ: string): Promise<boolean> {
    return false
  }
}

