/**
 * Prompts para extração de dados do edital de leilão
 * NOTA: Simplificado porque editais podem ter múltiplos imóveis.
 * Foco em: condições de pagamento e ocupação.
 */

export const AUCTION_NOTICE_SYSTEM = `
Você é um assistente especializado em análise de editais de leilão imobiliário brasileiro.
Seu objetivo é extrair informações sobre CONDIÇÕES DE PAGAMENTO e OCUPAÇÃO do imóvel.
Sempre responda em JSON válido seguindo exatamente a estrutura solicitada.
Se não encontrar uma informação, use null em vez de inventar.
IMPORTANTE: Editais podem conter múltiplos imóveis. Extraia apenas informações GERAIS que se aplicam a todos.
`.trim()

export const AUCTION_NOTICE_PROMPT = `
Analise este edital de leilão imobiliário e extraia APENAS informações sobre CONDIÇÕES DE PAGAMENTO e OCUPAÇÃO.

IMPORTANTE:
- Retorne APENAS um JSON válido, sem explicações adicionais ou markdown
- Use null para campos não encontrados
- Porcentagens como número (ex: 5 para 5%)
- NÃO extraia valores específicos de imóveis (lance mínimo, avaliação, etc) pois o edital pode ter vários imóveis
- Foque em informações GERAIS que se aplicam a todos os lotes

ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
{
  "auctionType": "1ª Praça" | "2ª Praça" | "Extrajudicial" | "Judicial" | null,
  "auctioneerFeePercent": porcentagem da comissão do leiloeiro ou null,
  "downPaymentPercent": porcentagem de entrada exigida ou null,
  "paymentConditions": "descrição completa das condições de pagamento" ou null,
  "acceptsFinancing": boolean (true se aceita financiamento bancário),
  "acceptsFGTS": boolean (true se aceita uso de FGTS),
  "isOccupied": boolean ou null (true=ocupado, false=desocupado confirmado, null=não informado),
  "occupationType": "Proprietário" | "Inquilino" | "Invasor" | "Não informado" | null,
  "evictionDeadline": "descrição do prazo/responsabilidade de desocupação" ou null,
  "risks": ["risco identificado 1", "risco identificado 2"] ou [],
  "confidence": número de 0.0 a 1.0
}

REGRAS PARA CONDIÇÕES DE PAGAMENTO:
- Extraia a comissão do leiloeiro (geralmente 5%)
- Extraia o percentual de entrada/sinal exigido
- Descreva as formas de pagamento aceitas (à vista, parcelado, financiamento, FGTS)
- Se aceita financiamento bancário, marque acceptsFinancing=true
- Se aceita FGTS, marque acceptsFGTS=true

REGRAS PARA OCUPAÇÃO (MUITO IMPORTANTE):
- SOMENTE marcar isOccupied=false se o edital AFIRMAR EXPLICITAMENTE que o imóvel está "desocupado", "livre" ou "vago"
- Se o edital diz "desocupação por conta/responsabilidade do arrematante" → isOccupied=null, occupationType="Não informado"
- Se o edital diz "imóvel ocupado" → isOccupied=true
- Se o edital não menciona ocupação → isOccupied=null
- SEMPRE copiar a informação sobre responsabilidade de desocupação para evictionDeadline

REGRAS PARA IDENTIFICAÇÃO DE RISCOS:
- Desocupação por conta do arrematante → adicionar "Desocupação por conta do arrematante"
- Imóvel ocupado por invasor → adicionar "Ocupação por invasor - pode exigir ação de despejo"
- Imóvel ocupado pelo antigo proprietário → adicionar "Ocupação pelo ex-proprietário"
- Não aceita financiamento → adicionar "Não aceita financiamento bancário"
- Prazo curto para pagamento → adicionar "Verificar prazo de pagamento"

Analise o documento e retorne o JSON:
`.trim()
