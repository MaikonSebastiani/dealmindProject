// Status de um deal imobiliário
export const dealStatuses = [
  "Em análise",
  "Aprovado",
  "Comprado",
  "Em reforma",
  "Alugado",
  "À venda",
  "Vendido",
  "Arquivado",
] as const

export type DealStatus = (typeof dealStatuses)[number]

// Configurações de cada status
export const dealStatusConfig: Record<DealStatus, {
  label: string
  description: string
  color: "gray" | "blue" | "green" | "yellow" | "purple" | "orange" | "emerald" | "red"
  icon: "search" | "check" | "home" | "hammer" | "key" | "tag" | "badge-check" | "archive"
}> = {
  "Em análise": {
    label: "Em análise",
    description: "Avaliando viabilidade do deal",
    color: "gray",
    icon: "search",
  },
  "Aprovado": {
    label: "Aprovado",
    description: "Viabilidade aprovada, negociando",
    color: "blue",
    icon: "check",
  },
  "Comprado": {
    label: "Comprado",
    description: "Imóvel adquirido",
    color: "green",
    icon: "home",
  },
  "Em reforma": {
    label: "Em reforma",
    description: "Realizando melhorias/obras",
    color: "yellow",
    icon: "hammer",
  },
  "Alugado": {
    label: "Alugado",
    description: "Gerando renda passiva",
    color: "purple",
    icon: "key",
  },
  "À venda": {
    label: "À venda",
    description: "Anunciado no mercado",
    color: "orange",
    icon: "tag",
  },
  "Vendido": {
    label: "Vendido",
    description: "Deal finalizado com venda",
    color: "emerald",
    icon: "badge-check",
  },
  "Arquivado": {
    label: "Arquivado",
    description: "Cancelado/descartado",
    color: "red",
    icon: "archive",
  },
}

// Transições válidas de status
export const validStatusTransitions: Record<DealStatus, DealStatus[]> = {
  "Em análise": ["Aprovado", "Arquivado"],
  "Aprovado": ["Comprado", "Em análise", "Arquivado"],
  "Comprado": ["Em reforma", "Alugado", "À venda", "Arquivado"],
  "Em reforma": ["Alugado", "À venda", "Arquivado"],
  "Alugado": ["À venda", "Em reforma", "Arquivado"],
  "À venda": ["Vendido", "Alugado", "Arquivado"],
  "Vendido": [], // Estado final
  "Arquivado": ["Em análise"], // Pode reativar
}

// Função para verificar se uma transição é válida
export function isValidTransition(from: DealStatus, to: DealStatus): boolean {
  return validStatusTransitions[from].includes(to)
}

// Status que representam deals ativos (em carteira)
export const activeStatuses: DealStatus[] = ["Comprado", "Em reforma", "Alugado", "À venda"]

// Status que representam deals em pipeline (potenciais)
export const pipelineStatuses: DealStatus[] = ["Em análise", "Aprovado"]

// Status que representam deals finalizados
export const closedStatuses: DealStatus[] = ["Vendido", "Arquivado"]

