import type { ProjectInput } from "@/lib/domain/deals/projectInput"

function toMonthlyRate(interestRateAnnual: number) {
  return interestRateAnnual / 100 / 12
}

function estimatePriceMonthlyPayment(principal: number, monthlyRate: number, termMonths: number) {
  if (termMonths <= 0) return 0
  if (monthlyRate <= 0) return principal / termMonths
  const pow = Math.pow(1 + monthlyRate, -termMonths)
  return (principal * monthlyRate) / (1 - pow)
}

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.floor(value)))
}

function priceBalanceAfterK(principal: number, monthlyRate: number, termMonths: number, k: number, payment: number) {
  if (k <= 0) return principal
  if (monthlyRate <= 0) {
    const amort = principal / termMonths
    return Math.max(0, principal - amort * k)
  }
  const pow = Math.pow(1 + monthlyRate, k)
  return principal * pow - payment * ((pow - 1) / monthlyRate)
}

export function calculateProjectViability(input: ProjectInput) {
  const purchasePrice = input.acquisition.purchasePrice
  const paymentType = input.paymentType || "cash"
  
  // Quando é cash (à vista), o downPayment é o preço total de compra
  // Quando é financiamento ou parcelamento, usa a porcentagem informada
  const downPayment = paymentType === "cash"
    ? purchasePrice
    : (purchasePrice * input.acquisition.downPaymentPercent) / 100

  const itbi = (purchasePrice * input.acquisition.itbiPercent) / 100
  const auctioneerFee = input.acquisition.auctioneerFeePercent
    ? (purchasePrice * input.acquisition.auctioneerFeePercent) / 100
    : 0
  const advisoryFee = input.acquisition.advisoryFeePercent
    ? (purchasePrice * input.acquisition.advisoryFeePercent) / 100
    : 0

  const renovationCosts = input.renovation?.costs ?? 0
  const evacuationCosts = input.evacuation?.costs ?? 0

  const acquisitionCosts =
    itbi +
    input.acquisition.registryCost +
    auctioneerFee +
    advisoryFee +
    input.liabilities.iptuDebt +
    input.liabilities.condoDebt +
    renovationCosts +
    evacuationCosts

  const initialInvestment = downPayment + acquisitionCosts

  const saleGross = input.operationAndExit.resalePrice
  const saleDiscount = (saleGross * input.operationAndExit.resaleDiscountPercent) / 100
  const saleAfterDiscount = saleGross - saleDiscount
  const brokerFee = (saleAfterDiscount * input.operationAndExit.brokerFeePercent) / 100
  const saleNet = saleAfterDiscount - brokerFee

  const expectedSaleMonths = input.operationAndExit.expectedSaleMonths
  const remainingAmount = Math.max(0, purchasePrice - downPayment)
  const financingEnabled = paymentType === "financing" && Boolean(input.financing?.enabled)
  // Verificar se é parcelamento: paymentType deve ser "installment" E ter installment configurado
  const installmentEnabled = paymentType === "installment" && Boolean(input.installment) && Boolean(input.installment?.installmentsCount)
  
  // Prazo total do parcelamento/financiamento
  const termMonths = financingEnabled 
    ? input.financing!.termMonths 
    : (installmentEnabled ? input.installment!.installmentsCount : 0)
  
  // Número de meses até a venda (limitado ao prazo total)
  // k = quantas parcelas serão pagas até a venda do imóvel
  const k = (financingEnabled || installmentEnabled) 
    ? clampInt(expectedSaleMonths, 0, termMonths) 
    : 0
  
  const monthlyRate = financingEnabled ? toMonthlyRate(input.financing!.interestRateAnnual) : 0

  // Custos operacionais mensais (condomínio + IPTU) multiplicados pelos meses até a venda
  const operatingCosts =
    (input.operationAndExit.monthlyCondoFee + input.operationAndExit.monthlyIptu) * expectedSaleMonths

  let interestPaidUntilSale = 0
  let principalPaidUntilSale = 0
  let totalPaidUntilSale = 0
  let remainingBalanceAtSale = 0
  let initialInstallmentEstimate = 0

  // PARCELAMENTO (sem juros)
  // Divide o valor restante em parcelas iguais
  if (installmentEnabled && remainingAmount > 0 && termMonths > 0) {
    // Valor de cada parcela mensal (divisão exata)
    const monthlyInstallment = remainingAmount / termMonths
    initialInstallmentEstimate = monthlyInstallment
    
    // Total de principal pago até a venda (k parcelas)
    // k é o número de meses até a venda, limitado ao prazo total do parcelamento
    principalPaidUntilSale = monthlyInstallment * k
    
    // Total pago até a venda (sem juros no parcelamento)
    totalPaidUntilSale = principalPaidUntilSale
    interestPaidUntilSale = 0
    
    // Saldo devedor restante na data da venda
    // Garante que não fique negativo (caso k > termMonths, que não deveria acontecer devido ao clampInt)
    remainingBalanceAtSale = Math.max(0, remainingAmount - principalPaidUntilSale)
    
    // Validação: se todas as parcelas foram pagas, o saldo deve ser zero
    if (k >= termMonths) {
      remainingBalanceAtSale = 0
      principalPaidUntilSale = remainingAmount
      totalPaidUntilSale = remainingAmount
    }
  }
  // Financiamento (com juros)
  else if (financingEnabled && remainingAmount > 0 && termMonths > 0) {
    if (input.financing!.amortizationType === "SAC") {
      const amort = remainingAmount / termMonths
      initialInstallmentEstimate = amort + remainingAmount * monthlyRate

      remainingBalanceAtSale = Math.max(0, remainingAmount - amort * k)
      principalPaidUntilSale = remainingAmount - remainingBalanceAtSale

      // Σ balance_i for i=0..k-1 where balance_i = P*(1 - i/n)
      // = P * (k - (k-1)k/(2n))
      const sumBalancesFactor = k - (k - 1) * k / (2 * termMonths)
      interestPaidUntilSale = remainingAmount * monthlyRate * sumBalancesFactor

      totalPaidUntilSale = principalPaidUntilSale + interestPaidUntilSale
    } else {
      // PRICE
      initialInstallmentEstimate = estimatePriceMonthlyPayment(remainingAmount, monthlyRate, termMonths)
      remainingBalanceAtSale = Math.max(
        0,
        priceBalanceAfterK(remainingAmount, monthlyRate, termMonths, k, initialInstallmentEstimate),
      )
      principalPaidUntilSale = remainingAmount - remainingBalanceAtSale
      totalPaidUntilSale = initialInstallmentEstimate * k
      interestPaidUntilSale = Math.max(0, totalPaidUntilSale - principalPaidUntilSale)
    }
  }

  // ============================================
  // CÁLCULO DO ROI
  // ============================================
  
  // TOTAL DE SAÍDA (cash outflow):
  // - Investimento inicial (entrada + custos de aquisição)
  // - Custos operacionais (condomínio + IPTU durante o período)
  // - Parcelas/financiamento pagas até a venda
  const totalOutflow = initialInvestment + operatingCosts + totalPaidUntilSale

  // ENTRADA NA VENDA (cash inflow):
  // - Venda líquida (após desconto e comissão do corretor)
  // - MENOS o saldo devedor que precisa ser quitado na venda (se houver parcelamento/financiamento)
  const saleNetAfterLoan = (financingEnabled || installmentEnabled) 
    ? Math.max(0, saleNet - remainingBalanceAtSale) 
    : saleNet

  // LUCRO BRUTO = Entrada na venda - Total de saída
  const profit = saleNetAfterLoan - totalOutflow

  // Imposto de Renda (estimativa simples): 15% sobre lucro positivo (ganho de capital),
  // sem considerar isenções, abatimentos ou diferenças PF/PJ.
  const incomeTaxRate = 0.15
  const incomeTax = profit > 0 ? profit * incomeTaxRate : 0
  const profitAfterTax = profit - incomeTax

  // ROI APÓS IMPOSTOS sobre o total desembolsado (mantido para compatibilidade)
  const roiAfterTax = totalOutflow > 0 ? profitAfterTax / totalOutflow : 0

  // ROI sobre o investimento necessário (entrada + custos de aquisição), já líquido de IR
  // Única métrica de retorno usada: cada transação é independente, sem anualização
  const roiOnInitialInvestmentAfterTax = initialInvestment > 0 ? profitAfterTax / initialInvestment : 0

  const leverageHigh = financingEnabled && input.acquisition.downPaymentPercent < 30

  // Limiar de ROI esperado pelo usuário (%); default 10%
  const expectedRoiPercent = input.expectedRoiPercent ?? 10
  const expectedRoiThreshold = expectedRoiPercent / 100
  const lowROI = roiOnInitialInvestmentAfterTax < expectedRoiThreshold

  // Diagnóstico: abaixo = Inviável, pouca coisa abaixo = Margem apertada, acima ou igual = Viável
  // Baseado no ROI sobre o capital investido (após IR), sem anualização
  const MARGEM_APERTADA_TOLERANCE_PP = 3 // pontos percentuais "pouco abaixo"
  const lowThreshold = Math.max(0, (expectedRoiPercent - MARGEM_APERTADA_TOLERANCE_PP) / 100)
  const viabilityStatus: "Viável" | "Margem apertada" | "Inviável" =
    profit < 0
      ? "Inviável"
      : roiOnInitialInvestmentAfterTax >= expectedRoiThreshold
        ? "Viável"
        : roiOnInitialInvestmentAfterTax >= lowThreshold
          ? "Margem apertada"
          : "Inviável"
  const viabilityDetail =
    viabilityStatus === "Inviável"
      ? "O projeto não atinge o ROI esperado ou não se paga no cenário atual. Ajuste preço, custos ou prazo para reavaliar."
      : viabilityStatus === "Margem apertada"
        ? "A rentabilidade está um pouco abaixo do ROI esperado para o imóvel. Reavalie premissas e margem."
        : "O projeto atinge ou supera o ROI esperado. Boa relação risco/retorno no cenário atual."

  return {
    initialInvestment,
    acquisitionCosts,
    renovationCosts,
    evacuationCosts,
    operatingCosts,
    saleNet,
    saleNetAfterLoan,
    totalPaidUntilSale,
    profit,
    roiAfterTax,
    roiOnInitialInvestmentAfterTax,
    incomeTaxRate,
    incomeTax,
    profitAfterTax,
    financing: financingEnabled
      ? {
          amortizationType: input.financing!.amortizationType,
          interestRateAnnual: input.financing!.interestRateAnnual,
          termMonths: input.financing!.termMonths,
          financedPrincipal: remainingAmount,
          monthlyRate,
          initialInstallmentEstimate,
          interestPaidUntilSale,
          principalPaidUntilSale,
          remainingBalanceAtSale,
          monthsConsidered: k,
        }
      : null,
    risk: {
      negativeProfit: profit < 0,
      lowROI,
      highLeverage: leverageHigh,
    },
    viabilityStatus,
    viabilityDetail,
    paymentType,
    installment: installmentEnabled
      ? {
          installmentsCount: input.installment!.installmentsCount,
          monthlyInstallment: initialInstallmentEstimate,
          totalPaidUntilSale,
          remainingBalanceAtSale,
        }
      : null,
  }
}


