/**
 * Provider para API do Escavador
 * 
 * Documentação: https://api.escavador.com/docs
 * 
 * Cobertura nacional de processos judiciais
 * Busca por CPF, CNPJ, Nome ou número do processo
 */

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

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Busca pessoa por CPF e retorna seus processos
   */
  async searchByCPF(cpf: string): Promise<LawsuitInfo[]> {
    const cleanCpf = cpf.replace(/\D/g, "")
    console.log(`[Escavador] Buscando por CPF: ${cleanCpf}`)

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
        if (pessoaResponse.status === 404) {
          console.log(`[Escavador] Pessoa não encontrada por CPF`)
          return []
        }
        console.error(`[Escavador] Erro na API: ${pessoaResponse.status}`)
        return []
      }

      const pessoa: EscavadorPessoaResponse = await pessoaResponse.json()
      console.log(`[Escavador] Pessoa encontrada: ${pessoa.nome}, ID: ${pessoa.id}`)

      // Busca processos da pessoa
      return await this.getProcessosPessoa(pessoa.id)
    } catch (error) {
      console.error(`[Escavador] Erro ao buscar por CPF:`, error)
      return []
    }
  }

  /**
   * Busca pessoa por nome e retorna seus processos
   */
  async searchByName(name: string): Promise<LawsuitInfo[]> {
    console.log(`[Escavador] Buscando por nome: ${name}`)

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
        console.error(`[Escavador] Erro na busca por nome: ${searchResponse.status}`)
        return []
      }

      const searchResult = await searchResponse.json()
      const pessoas: EscavadorPessoa[] = searchResult.items || []

      if (pessoas.length === 0) {
        console.log(`[Escavador] Nenhuma pessoa encontrada com o nome`)
        return []
      }

      console.log(`[Escavador] ${pessoas.length} pessoa(s) encontrada(s)`)

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
      console.error(`[Escavador] Erro ao buscar por nome:`, error)
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
        console.error(`[Escavador] Erro ao buscar processos: ${response.status}`)
        return []
      }

      const data = await response.json()
      const processos: EscavadorProcesso[] = data.items || []

      console.log(`[Escavador] ${processos.length} processos encontrados para pessoa ${pessoaId}`)

      return processos.map(p => this.normalizeProcesso(p))
    } catch (error) {
      console.error(`[Escavador] Erro ao buscar processos da pessoa:`, error)
      return []
    }
  }

  /**
   * Busca completa por CPF e Nome (deduplica resultados)
   */
  async searchComplete(cpf?: string, name?: string): Promise<LawsuitInfo[]> {
    const allResults: LawsuitInfo[] = []
    const seenNumbers = new Set<string>()

    // 1. Busca por CPF (mais preciso)
    if (cpf) {
      const byCpf = await this.searchByCPF(cpf)
      for (const p of byCpf) {
        if (!seenNumbers.has(p.number)) {
          seenNumbers.add(p.number)
          allResults.push(p)
        }
      }
    }

    // 2. Busca por nome (complementar)
    if (name) {
      const byName = await this.searchByName(name)
      for (const p of byName) {
        if (!seenNumbers.has(p.number)) {
          seenNumbers.add(p.number)
          allResults.push(p)
        }
      }
    }

    console.log(`[Escavador] Total: ${allResults.length} processos únicos`)
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
  async searchByCPF(cpf: string): Promise<LawsuitInfo[]> {
    console.log(`[Escavador Mock] Simulando busca por CPF: ${cpf}`)
    return this.getMockData()
  }

  async searchByName(name: string): Promise<LawsuitInfo[]> {
    console.log(`[Escavador Mock] Simulando busca por nome: ${name}`)
    return this.getMockData()
  }

  async searchComplete(cpf?: string, name?: string): Promise<LawsuitInfo[]> {
    console.log(`[Escavador Mock] Simulando busca completa`)
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

