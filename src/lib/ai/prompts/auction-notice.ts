/**
 * Prompts para extração de dados do edital de leilão
 * Extrai informações completas do edital incluindo: leilão, imóvel, pagamento, ocupação, jurídico
 */

export const AUCTION_NOTICE_SYSTEM = `
Você é um assistente especializado em análise de editais de leilão imobiliário brasileiro.
Seu objetivo é extrair TODAS as informações relevantes do edital de forma estruturada e precisa.
Sempre responda em JSON válido seguindo exatamente a estrutura solicitada.
Se não encontrar uma informação, use null em vez de inventar.
Leia TODO o documento cuidadosamente - informações importantes podem estar em qualquer parte do edital.
`.trim()

export const AUCTION_NOTICE_PROMPT = `
Analise este edital de leilão imobiliário e extraia TODAS as informações relevantes de forma estruturada.

IMPORTANTE:
- Retorne APENAS um JSON válido, sem explicações adicionais ou markdown
- Use null para campos não encontrados
- Valores monetários em reais como número (ex: 350000 para R$ 350.000)
- Datas no formato ISO (YYYY-MM-DD)
- Horários no formato HH:MM (24h)
- Porcentagens como número (ex: 5 para 5%)
- Se o edital tiver múltiplos imóveis, extraia informações GERAIS que se aplicam a todos
- Se houver informações específicas de um imóvel único, extraia também

ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
{
  "auctionInfo": {
    "auctionType": "1ª Praça" | "2ª Praça" | "Extrajudicial" | "Judicial" | null,
    "auctionNumber": "número do edital/leilão" ou null,
    "auctionDate": "YYYY-MM-DD" ou null,
    "auctionTime": "HH:MM" ou null,
    "auctionLocation": "local do leilão (endereço completo)" ou null,
    "auctioneerName": "nome do leiloeiro" ou null,
    "auctioneerRegistration": "número de registro do leiloeiro" ou null
  },
  "legalInfo": {
    "processNumber": "número do processo judicial (apenas números)" ou null,
    "court": "vara/foro responsável" ou null,
    "judgeName": "nome do juiz responsável" ou null,
    "creditor": "nome do credor/exequente" ou null,
    "debtor": "nome do devedor" ou null
  },
  "propertyInfo": {
    "address": "endereço completo do imóvel" ou null,
    "propertyType": "Apartamento" | "Casa" | "Terreno" | "Comercial" | "Rural" | null,
    "area": número em m² ou null,
    "description": "descrição detalhada do imóvel" ou null,
    "characteristics": ["característica 1", "característica 2"] ou []
  },
  "values": {
    "minimumBid": valor numérico do lance mínimo ou null,
    "appraisalValue": valor numérico de avaliação ou null,
    "openingBid": valor numérico do lance inicial ou null,
    "incrementPercent": porcentagem de incremento entre lances ou null
  },
  "payment": {
    "auctioneerFeePercent": porcentagem da comissão do leiloeiro ou null,
    "downPaymentPercent": porcentagem de entrada exigida ou null,
    "downPaymentAmount": valor numérico da entrada (se valor fixo) ou null,
    "paymentDeadline": "prazo para pagamento (em dias ou descrição)" ou null,
    "paymentDeadlineDays": número de dias para pagamento ou null,
    "paymentMethod": "à vista" | "parcelado" | "ambos" | null,
    "installmentCount": número de parcelas ou null,
    "installmentInterval": "mensal" | "trimestral" | null,
    "paymentConditions": "descrição completa das condições de pagamento" ou null,
    "acceptsFinancing": boolean (true se aceita financiamento bancário),
    "acceptsFGTS": boolean (true se aceita uso de FGTS),
    "requiresGuarantee": boolean ou null,
    "guaranteeType": "tipo de garantia exigida" ou null,
    "additionalCosts": "outros custos mencionados (ITBI, registro, etc)" ou null
  },
  "occupation": {
    "isOccupied": boolean ou null (true=ocupado, false=desocupado confirmado, null=não informado),
    "occupationType": "Proprietário" | "Inquilino" | "Invasor" | "Terceiro" | "Não informado" | null,
    "occupantName": "nome do ocupante" ou null,
    "evictionResponsibility": "arrematante" | "leiloeiro" | "judiciário" | null,
    "evictionDeadline": "descrição do prazo/responsabilidade de desocupação" ou null,
    "evictionDeadlineDays": número de dias ou null,
    "evictionCost": "custo estimado de desocupação" ou null
  },
  "requirements": {
    "documentsForBidding": ["documento 1", "documento 2"] ou [],
    "documentsForPurchase": ["documento 1", "documento 2"] ou [],
    "participationRequirements": "requisitos para participar do leilão" ou null
  },
  "importantNotes": [
    "observação importante 1",
    "observação importante 2"
  ] ou [],
  "risks": ["risco identificado 1", "risco identificado 2"] ou [],
  "confidence": número de 0.0 a 1.0
}

REGRAS PARA INFORMAÇÕES DO LEILÃO:
- Busque por: "edital", "leilão", "pregão", "arrematação"
- Extraia número do edital/leilão se disponível
- Extraia data e horário do leilão
- Extraia local (endereço completo onde será realizado)
- Extraia nome e registro do leiloeiro

REGRAS PARA INFORMAÇÕES JURÍDICAS:
- Busque por: "processo", "autos", "vara", "foro", "juiz", "exequente", "credor", "devedor"
- Extraia número do processo (apenas números, sem pontos/traços)
- Extraia vara/foro responsável
- Extraia nome do juiz se mencionado
- Extraia credor e devedor se mencionados

REGRAS PARA INFORMAÇÕES DO IMÓVEL:
- Se o edital tiver apenas um imóvel, extraia endereço completo
- Extraia tipo de imóvel (apartamento, casa, terreno, etc)
- Extraia área em m² se mencionada
- Extraia descrição detalhada do imóvel
- Extraia características (quartos, banheiros, vagas, etc) em characteristics[]

REGRAS PARA VALORES:
- Lance mínimo: valor mínimo para participar
- Avaliação: valor de avaliação do imóvel
- Lance inicial: valor do primeiro lance (pode ser igual ao mínimo)
- Incremento: percentual de aumento entre lances
- Se houver múltiplos imóveis, extraia valores gerais ou do primeiro mencionado

REGRAS PARA CONDIÇÕES DE PAGAMENTO:
- Comissão do leiloeiro: geralmente 5%, mas pode variar
- Entrada: pode ser percentual ou valor fixo
- Prazo de pagamento: extraia em dias se possível, senão descrição completa
- Formas de pagamento: à vista, parcelado, financiamento, FGTS
- Se aceita financiamento → acceptsFinancing=true
- Se aceita FGTS → acceptsFGTS=true
- Garantias: verifique se exige garantia e qual tipo
- Custos adicionais: ITBI, registro, escritura, etc

REGRAS PARA OCUPAÇÃO (MUITO IMPORTANTE):
- isOccupied = true SE:
  * Edital menciona explicitamente "ocupado", "habitado", "possuído"
  * Há menção a "ocupante", "possuidor", "morador"
  * Há informação sobre desocupação sendo responsabilidade do arrematante
  
- isOccupied = false SE:
  * Edital afirma explicitamente "desocupado", "livre", "vago", "sem ocupação"
  * Há declaração formal de que o imóvel está disponível
  
- isOccupied = null SE:
  * Não há menção à ocupação
  * Há menção genérica sem confirmação
  * Informação ambígua

- Tipo de ocupante:
  * "Proprietário": se mencionar que antigo proprietário ocupa
  * "Inquilino": se mencionar locação ou inquilino
  * "Invasor": se mencionar ocupação irregular ou invasão
  * "Terceiro": se mencionar terceiro de boa-fé
  * "Não informado": se não houver informação específica

- Responsabilidade de desocupação:
  * "arrematante": se diz "por conta do arrematante"
  * "leiloeiro": se diz "por conta do leiloeiro"
  * "judiciário": se diz "pelo Poder Judiciário"
  * Sempre copiar texto completo para evictionDeadline

REGRAS PARA DOCUMENTAÇÃO:
- Documentos para participar: geralmente RG, CPF, comprovante de residência
- Documentos para arrematação: geralmente documentos adicionais
- Requisitos: condições para participar (maioria, capacidade civil, etc)

REGRAS PARA OBSERVAÇÕES IMPORTANTES:
- Extraia todas as observações, avisos, condições especiais
- Inclua restrições, limitações, condições de uso
- Inclua informações sobre estado de conservação
- Inclua informações sobre documentação pendente

REGRAS PARA IDENTIFICAÇÃO DE RISCOS:
RISCOS IMPEDITIVOS:
- Ocupação por invasor → "Ocupação por invasor - pode exigir ação de despejo complexa"
- Ocupação pelo ex-proprietário → "Ocupação pelo ex-proprietário - risco de resistência à desocupação"
- Desocupação por conta do arrematante → "Desocupação por conta do arrematante - custos e riscos adicionais"
- Prazo de pagamento muito curto (< 5 dias) → "Prazo de pagamento muito curto - risco de não conseguir financiamento"

RISCOS ALTOS:
- Não aceita financiamento → "Não aceita financiamento bancário - requer capital próprio"
- Não aceita FGTS → "Não aceita FGTS - limita opções de pagamento"
- Ocupação não informada → "Ocupação não informada - verificar situação antes do leilão"
- Múltiplos imóveis no edital → "Múltiplos imóveis no edital - verificar qual é o imóvel correto"
- Garantia exigida → "Garantia exigida - verificar tipo e valor"

PONTOS A AVALIAR:
- Prazo curto para pagamento (5-10 dias) → "Verificar prazo de pagamento - pode ser apertado"
- Comissão do leiloeiro alta (> 7%) → "Comissão do leiloeiro acima da média - impacta custo total"
- Condições de pagamento restritivas → "Condições de pagamento restritivas - verificar viabilidade"
- Imóvel em área de risco → "Verificar localização e condições do imóvel"
- Documentação pendente → "Documentação pendente - verificar regularização"

REGRAS PARA CONFIANÇA:
- 0.9+ : Documento claro, todas as informações principais encontradas
- 0.7-0.9 : Documento legível mas algumas informações não encontradas
- 0.5-0.7 : Documento parcialmente legível ou com muitas informações faltando
- <0.5 : Documento ilegível ou formato não reconhecido

Analise o documento cuidadosamente e retorne o JSON:
`.trim()
