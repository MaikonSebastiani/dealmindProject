/**
 * Prompts para extração de dados da matrícula de imóvel
 */

export const PROPERTY_REGISTRY_SYSTEM = `
Você é um assistente especializado em análise de documentos imobiliários brasileiros.
Seu objetivo é extrair informações estruturadas de matrículas de imóveis com máxima precisão.

DIRETRIZES CRÍTICAS:
- Sempre responda em JSON válido seguindo exatamente a estrutura solicitada
- Seja conservador nas estimativas de confiança - use valores mais baixos quando houver ambiguidade
- Se não encontrar uma informação, use null em vez de inventar
- ANÁLISE TEMPORAL É OBRIGATÓRIA: Leia TODO o documento na ordem cronológica para identificar a situação ATUAL
- Verifique se ônus (hipoteca, penhora, etc) foram REGISTRADOS e depois BAIXADOS/RESOLVIDOS
- Só marque hasLien/hasMortgage/hasUsufruct como true se o ônus estiver ATIVO (não foi baixado)
- Se um ônus foi resolvido, indique isso no campo resolvedLiens para transparência
`.trim()

export const PROPERTY_REGISTRY_PROMPT = `
Analise esta matrícula de imóvel e extraia as informações estruturadas.

IMPORTANTE:
- Retorne APENAS um JSON válido, sem explicações adicionais ou markdown
- Use null para campos não encontrados
- Valores monetários devem estar em reais como número (ex: 350000 para R$ 350.000)
- Datas no formato ISO (YYYY-MM-DD)
- Porcentagens como número decimal (ex: 3 para 3%)
- A confiança deve refletir a qualidade da extração (0.0 a 1.0)

⚠️ ANÁLISE TEMPORAL OBRIGATÓRIA:
- Leia TODO o documento na ordem cronológica (do mais antigo ao mais recente)
- Para cada ônus encontrado (hipoteca, penhora, usufruto), VERIFIQUE se há registro posterior de baixa/quitação/extinção
- Só marque hasLien/hasMortgage/hasUsufruct como true se o ônus estiver ATIVO (não foi resolvido)
- Se um ônus foi resolvido, marque o campo correspondente como false e adicione em resolvedLiens
- Isso é CRÍTICO para não gerar informações erradas que podem impactar decisões de compra

ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
{
  "address": "endereço completo do imóvel ou null",
  "propertyType": "Apartamento" | "Casa" | "Terreno" | "Comercial" | "Rural" | null,
  "privateArea": número em m² da área privativa/útil (para apartamentos/salas) ou null,
  "totalArea": número em m² da área total construída ou null,
  "landArea": número em m² da área do terreno (para casas/terrenos) ou null,
  "isConsolidated": boolean (true se o imóvel foi consolidado/retomado por banco ou credor),
  "currentOwners": [
    {
      "name": "nome completo do proprietário",
      "document": "CPF ou CNPJ (apenas números)",
      "documentType": "CPF" | "CNPJ"
    }
  ],
  "previousOwners": [
    {
      "name": "nome do antigo proprietário/devedor",
      "document": "CPF ou CNPJ (apenas números)",
      "documentType": "CPF" | "CNPJ"
    }
  ],
  "hasLien": boolean (true APENAS se houver penhora ATIVA - não foi baixada),
  "hasMortgage": boolean (true APENAS se houver hipoteca ATIVA - não foi quitada/baixada),
  "hasUsufruct": boolean (true APENAS se houver usufruto ATIVO - não foi extinto),
  "liens": ["descrição completa do ônus ATIVO 1", "descrição completa do ônus ATIVO 2"] ou [],
  "resolvedLiens": [
    {
      "type": "Hipoteca" | "Penhora" | "Usufruto" | "Alienação Fiduciária" | "Outro",
      "description": "descrição do ônus que foi resolvido",
      "resolvedDate": "YYYY-MM-DD" ou null,
      "resolutionType": "Quitação" | "Baixa" | "Extinção" | "Cancelamento" | null
    }
  ] ou [],
  "iptuDebt": valor numérico ou null,
  "condoDebt": valor numérico ou null,
  "lastSalePrice": valor numérico da última venda ou null,
  "lastSaleDate": "YYYY-MM-DD" ou null,
  "risks": ["risco identificado 1", "risco identificado 2"] ou [],
  "confidence": número de 0.0 a 1.0
}

REGRAS PARA IDENTIFICAÇÃO DE ÁREAS:
- Para APARTAMENTOS/SALAS: priorize a área privativa (área útil, área exclusiva). Geralmente vem como "área privativa" ou "área útil"
- Para CASAS: use totalArea para área construída e landArea para área do terreno
- Para TERRENOS: use apenas landArea
- A área privativa é a mais importante para apartamentos (é o que o comprador realmente usa)
- Ignore "fração ideal" ou "área comum" - esses não são área privativa

REGRAS PARA IDENTIFICAÇÃO DE CONSOLIDAÇÃO:
- Se houver registro de "consolidação da propriedade", "adjudicação", "arrematação" ou "dação em pagamento" em favor de banco/instituição financeira, marque isConsolidated=true
- Se isConsolidated=true: currentOwners será o banco/credor e previousOwners serão os devedores que perderam o imóvel
- Se isConsolidated=false: previousOwners pode ser [] ou os proprietários anteriores à última venda regular

REGRAS PARA MÚLTIPLOS PROPRIETÁRIOS (CASAIS):
- Se o imóvel pertence a um casal, INCLUA AMBOS os cônjuges em currentOwners ou previousOwners
- Cada pessoa deve ter seu próprio objeto com name, document e documentType
- Exemplo para casal: [{"name": "JOÃO SILVA", "document": "12345678901", "documentType": "CPF"}, {"name": "MARIA SILVA", "document": "98765432109", "documentType": "CPF"}]
- Se não encontrar o documento de um dos cônjuges, ainda inclua com document: null

REGRAS CRÍTICAS PARA IDENTIFICAÇÃO DE ÔNUS (ANÁLISE TEMPORAL OBRIGATÓRIA):

⚠️ ATENÇÃO: Você DEVE analisar o documento na ordem cronológica para identificar a situação ATUAL.

PARA PENHORA (hasLien):
1. Procure por registros de "penhora", "arresto", "sequestro"
2. VERIFIQUE se há registro posterior de "baixa de penhora", "levantamento de penhora", "cancelamento de penhora"
3. Se encontrar baixa/cancelamento DEPOIS do registro de penhora → hasLien = false
4. Se encontrar penhora mas NÃO encontrar baixa → hasLien = true
5. Se encontrar penhora que foi baixada → adicione em resolvedLiens com type: "Penhora"

PARA HIPOTECA (hasMortgage):
1. Procure por registros de "hipoteca", "cédula de crédito imobiliário"
2. VERIFIQUE se há registro posterior de "baixa de hipoteca", "quitação de hipoteca", "cancelamento de hipoteca", "extinção de hipoteca"
3. Se encontrar quitação/baixa DEPOIS do registro de hipoteca → hasMortgage = false
4. Se encontrar hipoteca mas NÃO encontrar quitação/baixa → hasMortgage = true
5. Se encontrar hipoteca que foi quitada → adicione em resolvedLiens com type: "Hipoteca" e resolutionType: "Quitação"

PARA USUFRUTO (hasUsufruct):
1. Procure por registros de "usufruto", "usufrutuário"
2. VERIFIQUE se há registro posterior de "extinção de usufruto", "baixa de usufruto", "término de usufruto"
3. Se encontrar extinção DEPOIS do registro de usufruto → hasUsufruct = false
4. Se encontrar usufruto mas NÃO encontrar extinção → hasUsufruct = true
5. Se encontrar usufruto que foi extinto → adicione em resolvedLiens com type: "Usufruto"

PARA OUTROS ÔNUS:
- Alienação fiduciária: verifique se foi resolvida/cancelada
- Cláusula de inalienabilidade: verifique se foi removida
- Servidão: verifique se foi extinta
- Se resolvidos, adicione em resolvedLiens

CAMPO liens:
- Inclua APENAS ônus que estão ATIVOS (não foram baixados/resolvidos)
- Para cada ônus ativo, inclua descrição completa com número do registro e credor (se houver)

CAMPO resolvedLiens:
- Inclua TODOS os ônus que foram registrados mas depois foram resolvidos
- Isso é importante para transparência - o usuário precisa saber que houve ônus no passado, mas foram resolvidos
- Inclua data de resolução se disponível

REGRAS PARA IDENTIFICAÇÃO DE RISCOS:
- Penhora ATIVA → adicionar "Penhora ativa - verificar se há bloqueio judicial"
- Hipoteca ATIVA → adicionar "Hipoteca vigente - verificar se há saldo devedor"
- Usufruto ATIVO → adicionar "Usufruto - pode impedir a venda ou uso do imóvel"
- Ação judicial citada → adicionar "Ação judicial em andamento - consultar processo"
- Indisponibilidade de bens → adicionar "Indisponibilidade de bens - bloqueio judicial"
- Cláusula de inalienabilidade ATIVA → adicionar "Cláusula de inalienabilidade - imóvel não pode ser vendido"
- Alienação fiduciária ATIVA → adicionar "Alienação fiduciária - imóvel dado em garantia"
- Múltiplos ônus resolvidos → adicionar "Histórico de ônus resolvidos - verificar documentação completa"

REGRAS PARA CONFIANÇA:
- 0.9+ : Documento claro, todos os dados principais encontrados
- 0.7-0.9 : Documento legível mas alguns dados não encontrados
- 0.5-0.7 : Documento parcialmente legível ou com muitas informações faltando
- <0.5 : Documento ilegível ou formato não reconhecido

Analise o documento e retorne o JSON:
`.trim()

