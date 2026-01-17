/**
 * Prompts para análise de Due Diligence por IA
 */

export const DUE_DILIGENCE_SYSTEM = `
Você é um advogado especialista em direito imobiliário e leilões de imóveis no Brasil.
Sua função é analisar processos judiciais de um devedor e identificar riscos para quem pretende comprar um imóvel em leilão.

Você deve ser CONSERVADOR na análise - é melhor alertar sobre um risco que não existe do que ignorar um risco real.

Sempre responda em JSON válido seguindo exatamente a estrutura solicitada.
`.trim()

export const DUE_DILIGENCE_PROMPT = `
Analise os processos judiciais abaixo e avalie o risco para compra de um imóvel em leilão.

DADOS DO DEVEDOR:
Nome: {debtorName}
CPF/CNPJ: {debtorDocument}
Endereço do imóvel: {propertyAddress}

PROCESSOS ENCONTRADOS:
{lawsuitsJson}

CLASSIFIQUE cada processo como:
- CRITICAL: Impede ou dificulta muito a compra (execução com penhora do imóvel, indisponibilidade de bens, ação de usucapião)
- HIGH: Pode gerar problemas sérios (execuções fiscais, trabalhistas, recuperação judicial)
- MEDIUM: Merece atenção mas não impede (cobranças comuns, ações cíveis)
- LOW: Irrelevante para a transação (autor em ações, processos antigos arquivados)

IMPORTANTE:
- Execuções fiscais (IPTU, ITR) podem gerar penhora do imóvel - SEMPRE classificar como HIGH ou CRITICAL
- Ações trabalhistas podem ter penhora de bens - classificar como HIGH
- Se o devedor tem muitos processos como réu, é sinal de má gestão financeira
- Processos antigos (>5 anos) e arquivados são menos preocupantes

RESPONDA APENAS com o JSON abaixo, sem explicações adicionais:
{
  "riskScore": "low" | "medium" | "high" | "critical",
  "riskPercentage": número de 0 a 100,
  "summary": "Resumo de 2-3 frases da situação jurídica do devedor",
  "mainRisks": ["risco principal 1", "risco principal 2", ...],
  "blockingRisks": ["risco que impede a compra 1", ...],
  "recommendation": "proceed" | "caution" | "investigate" | "avoid",
  "recommendationText": "Texto explicativo da recomendação em 1-2 frases",
  "processAnalysis": [
    {
      "number": "número do processo",
      "relevance": "critical" | "high" | "medium" | "low",
      "reason": "por que tem essa relevância em 1 frase"
    }
  ],
  "confidence": número de 0.0 a 1.0
}

REGRAS PARA RECOMENDAÇÃO:
- "proceed": Sem riscos significativos, pode prosseguir com a compra
- "caution": Alguns riscos identificados, prosseguir com atenção
- "investigate": Riscos importantes, recomenda-se consultar advogado antes
- "avoid": Riscos críticos identificados, recomenda-se não comprar

REGRAS PARA PORCENTAGEM DE RISCO:
- 0-25%: Baixo risco (poucos processos, nenhum crítico)
- 26-50%: Risco moderado (alguns processos, nenhum crítico)
- 51-75%: Alto risco (processos importantes ou muitos processos)
- 76-100%: Risco crítico (processos que podem impedir a compra)
`.trim()

export function buildDueDiligencePrompt(params: {
  debtorName: string
  debtorDocument?: string
  propertyAddress?: string
  lawsuitsJson: string
}): string {
  return DUE_DILIGENCE_PROMPT
    .replace("{debtorName}", params.debtorName || "Não informado")
    .replace("{debtorDocument}", params.debtorDocument || "Não informado")
    .replace("{propertyAddress}", params.propertyAddress || "Não informado")
    .replace("{lawsuitsJson}", params.lawsuitsJson)
}

