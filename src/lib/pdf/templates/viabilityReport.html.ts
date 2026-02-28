/**
 * Template HTML para relatório de viabilidade
 * Reutiliza o design system do projeto
 */

import { formatBRL, formatPercent, formatDateTimeBR, escapeHtml } from '../utils'
import type { ViabilityReportData } from '../types'

export function generateViabilityReportHTML(data: ViabilityReportData): string {
  const { user, deal, viability, dealDetails, costsBreakdown, generatedAt } = data

  const statusColor = 
    viability.status === 'Viável' ? '#32D583' :
    viability.status === 'Margem apertada' ? '#F59E0B' : '#FF5A6A'
  
  const statusBg = 
    viability.status === 'Viável' ? '#06221B' :
    viability.status === 'Margem apertada' ? '#0B1323' : '#2A0B12'

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Viabilidade</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, sans-serif;
      background: #05060B;
      color: #FFFFFF;
      padding: 0;
      margin: 0;
      font-size: 10px;
      line-height: 1.5;
      width: 100%;
      height: 100vh;
    }
    
    .container {
      padding: 40px;
      min-height: 100vh;
      background: #05060B;
    }
    
    .header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #141B29;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 12px;
      color: #7C889E;
      margin-bottom: 12px;
    }
    
    .header .meta {
      display: flex;
      gap: 16px;
      font-size: 9px;
      color: #7C889E;
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #FFFFFF;
      margin-bottom: 12px;
    }
    
    .status-card {
      background: ${statusBg};
      border: 1px solid ${statusColor}40;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      text-align: center;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      background: ${statusColor}20;
      color: ${statusColor};
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .status-title {
      font-size: 28px;
      font-weight: bold;
      color: ${statusColor};
      margin-bottom: 8px;
    }
    
    .status-detail {
      font-size: 11px;
      color: #9AA6BC;
      line-height: 1.6;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .metrics-grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .metric-card {
      background: #0B0F17;
      border: 1px solid #141B29;
      border-radius: 12px;
      padding: 16px;
      min-height: 80px;
    }
    
    .metric-label {
      font-size: 9px;
      color: #7C889E;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 20px;
      font-weight: bold;
      color: #FFFFFF;
    }
    
    .metric-value.highlight {
      color: #4F7DFF;
    }
    
    .metric-value.success {
      color: #32D583;
    }
    
    .metric-value.destructive {
      color: #FF5A6A;
    }
    
    .metric-delta {
      font-size: 9px;
      color: #7C889E;
      margin-top: 4px;
    }
    
    .card {
      background: #0B0F17;
      border: 1px solid #141B29;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #141B29;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #141B29;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 10px;
      color: #7C889E;
    }
    
    .info-value {
      font-size: 11px;
      color: #FFFFFF;
      font-weight: 500;
      text-align: right;
    }
    
    .info-value.success {
      color: #32D583;
    }
    
    .info-value.destructive {
      color: #FF5A6A;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #141B29;
      text-align: center;
      font-size: 9px;
      color: #7C889E;
    }
    
    .bold {
      font-weight: 600;
    }
    
    .muted {
      color: #7C889E;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="container">
  <div class="header">
    <h1>Relatório de Viabilidade</h1>
    <div class="subtitle">Análise detalhada de viabilidade do imóvel</div>
    <div class="meta">
      ${user.name ? `<span>Gerado para: ${escapeHtml(user.name)}</span>` : ''}
      <span>Data: ${formatDateTimeBR(generatedAt)}</span>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Informações do Imóvel</h2>
    <div class="card">
      <div class="info-row">
        <span class="info-label">Nome do Imóvel</span>
        <span class="info-value">${escapeHtml(deal.propertyName || 'Sem nome')}</span>
      </div>
      ${deal.propertyType ? `
      <div class="info-row">
        <span class="info-label">Tipo</span>
        <span class="info-value">${escapeHtml(deal.propertyType)}</span>
      </div>
      ` : ''}
      ${deal.address ? `
      <div class="info-row">
        <span class="info-label">Endereço</span>
        <span class="info-value">${escapeHtml(deal.address)}</span>
      </div>
      ` : ''}
      ${deal.propertyLink ? `
      <div class="info-row">
        <span class="info-label">Link do imóvel</span>
        <span class="info-value"><a href="${escapeHtml(deal.propertyLink)}" target="_blank" rel="noopener noreferrer" style="color: #4F7DFF; text-decoration: underline;">Abrir link</a></span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value">${escapeHtml(deal.status)}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="status-card">
      <div class="status-badge">Diagnóstico de Viabilidade</div>
      <div class="status-title">${escapeHtml(viability.status)}</div>
      <div class="status-detail">${escapeHtml(viability.detail)}</div>
      <div class="status-detail" style="margin-top: 12px; font-size: 10px; color: #7C889E;">
        Critério: ROI esperado sobre investimento ≥ ${dealDetails.expectedRoiPercent}%.
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Rentabilidade</h2>
    <div class="metrics-grid metrics-grid-3">
      <div class="metric-card">
        <div class="metric-label">ROI esperado (mínimo)</div>
        <div class="metric-value highlight">${dealDetails.expectedRoiPercent}%</div>
        <div class="metric-delta">Meta de retorno sobre investimento definida para este imóvel</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">ROI projetado (após IR)</div>
        <div class="metric-value ${viability.roiOnInitialInvestmentAfterTax >= (dealDetails.expectedRoiPercent / 100) ? 'success' : viability.roiOnInitialInvestmentAfterTax > 0 ? 'highlight' : 'destructive'}">${formatPercent(viability.roiOnInitialInvestmentAfterTax)}</div>
        <div class="metric-delta">Retorno sobre o capital necessário (entrada + custos de aquisição), já líquido de IR</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Análise Financeira Detalhada</h2>
    
    <!-- Custos de Entrada -->
    <div class="card">
      <div class="card-title">Custos de Entrada</div>
      <div class="info-row">
        <span class="info-label">Valor de Compra</span>
        <span class="info-value">${formatBRL(dealDetails.purchasePrice)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Entrada (${formatPercent(dealDetails.downPaymentPercent)})</span>
        <span class="info-value">${formatBRL(dealDetails.downPaymentValue)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">ITBI</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.itbi)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Registro</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.registryCost)}</span>
      </div>
      ${data.costsBreakdown.auctioneerFee > 0 ? `
      <div class="info-row">
        <span class="info-label">Comissão do Leiloeiro</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.auctioneerFee)}</span>
      </div>
      ` : ''}
      ${data.costsBreakdown.advisoryFee > 0 ? `
      <div class="info-row">
        <span class="info-label">Assessoria</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.advisoryFee)}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Dívida IPTU</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.iptuDebt)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Dívida Condomínio</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.condoDebt)}</span>
      </div>
      ${data.costsBreakdown.renovationCosts > 0 ? `
      <div class="info-row">
        <span class="info-label">Custo de Reforma</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.renovationCosts)}</span>
      </div>
      ` : ''}
      ${data.costsBreakdown.evacuationCosts > 0 ? `
      <div class="info-row">
        <span class="info-label">Custo de Desocupação</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.evacuationCosts)}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Total Custos de Aquisição</span>
        <span class="info-value bold">${formatBRL(viability.acquisitionCosts)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Investimento Inicial</span>
        <span class="info-value bold">${formatBRL(viability.initialInvestment)}</span>
      </div>
    </div>

    <!-- Custos Operacionais -->
    <div class="card">
      <div class="card-title">Custos Operacionais (${dealDetails.expectedSaleMonths} ${dealDetails.expectedSaleMonths === 1 ? 'mês' : 'meses'})</div>
      <div class="info-row">
        <span class="info-label">Condomínio Mensal</span>
        <span class="info-value">${formatBRL(dealDetails.monthlyCondoFee)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">IPTU Mensal</span>
        <span class="info-value">${formatBRL(dealDetails.monthlyIptu)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Condomínio Total</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.operatingCosts.condoTotal)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">IPTU Total</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.operatingCosts.iptuTotal)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Custos Operacionais</span>
        <span class="info-value bold">${formatBRL(viability.operatingCosts)}</span>
      </div>
    </div>

    <!-- Financiamento/Parcelamento -->
    ${data.costsBreakdown.financing ? `
    <div class="card">
      <div class="card-title">Financiamento</div>
      <div class="info-row">
        <span class="info-label">Principal Pago até Venda</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.financing.principalPaid)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Juros Pagos até Venda</span>
        <span class="info-value">${formatBRL(data.costsBreakdown.financing.interestPaid)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Pago (Principal + Juros)</span>
        <span class="info-value bold">${formatBRL(viability.totalPaidUntilSale)}</span>
      </div>
    </div>
    ` : ''}
    ${data.costsBreakdown.installment ? `
    <div class="card">
      <div class="card-title">Parcelamento</div>
      <div class="info-row">
        <span class="info-label">Total Pago até Venda</span>
        <span class="info-value bold">${formatBRL(data.costsBreakdown.installment.totalPaid)}</span>
      </div>
    </div>
    ` : ''}

    <!-- Custos de Saída -->
    <div class="card">
      <div class="card-title">Custos de Saída</div>
      <div class="info-row">
        <span class="info-label">Preço de Venda</span>
        <span class="info-value">${formatBRL(dealDetails.resalePrice)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Deságio sobre Venda</span>
        <span class="info-value">- ${formatBRL(data.costsBreakdown.saleCosts.discount)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Comissão do Corretor</span>
        <span class="info-value">- ${formatBRL(data.costsBreakdown.saleCosts.brokerFee)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Venda Líquida</span>
        <span class="info-value success bold">${formatBRL(viability.saleNet)}</span>
      </div>
      ${(viability.financing || viability.installment) ? `
      <div class="info-row">
        <span class="info-label">Saldo Devedor a Quitar</span>
        <span class="info-value">- ${formatBRL((viability.financing?.remainingBalanceAtSale ?? viability.installment?.remainingBalanceAtSale) ?? 0)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Venda Líquida (após quitar saldo)</span>
        <span class="info-value success bold">${formatBRL(viability.saleNetAfterLoan)}</span>
      </div>
      ` : ''}
    </div>

    <!-- Resumo Final -->
    <div class="card">
      <div class="card-title">Resumo Final</div>
      <div class="info-row">
        <span class="info-label">Total de Saídas</span>
        <span class="info-value">${formatBRL(viability.initialInvestment + viability.operatingCosts + viability.totalPaidUntilSale)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Venda Líquida</span>
        <span class="info-value success">${formatBRL(viability.saleNetAfterLoan)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Lucro Bruto</span>
        <span class="info-value ${viability.profit > 0 ? 'success' : 'destructive'}">${formatBRL(viability.profit)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Imposto de Renda (${formatPercent(viability.incomeTaxRate)})</span>
        <span class="info-value">- ${formatBRL(viability.incomeTax)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Lucro Líquido</span>
        <span class="info-value ${viability.profitAfterTax > 0 ? 'success' : 'destructive'} bold">${formatBRL(viability.profitAfterTax)}</span>
      </div>
    </div>
  </div>


  ${viability.financing ? `
  <div class="section">
    <h2 class="section-title">Detalhes do Financiamento</h2>
    <div class="card">
      <div class="card-title">Informações do Financiamento</div>
      <div class="info-row">
        <span class="info-label">Tipo de Amortização</span>
        <span class="info-value">${escapeHtml(viability.financing.amortizationType)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Taxa de Juros Anual</span>
        <span class="info-value">${formatPercent(viability.financing.interestRateAnnual)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Prazo Total</span>
        <span class="info-value">${viability.financing.termMonths} ${viability.financing.termMonths === 1 ? 'mês' : 'meses'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Valor Financiado</span>
        <span class="info-value">${formatBRL(viability.financing.financedPrincipal)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Parcela Inicial</span>
        <span class="info-value">${formatBRL(viability.financing.initialInstallmentEstimate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Juros Pagos até Venda</span>
        <span class="info-value">${formatBRL(viability.financing.interestPaidUntilSale)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Principal Pago até Venda</span>
        <span class="info-value">${formatBRL(viability.financing.principalPaidUntilSale)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Saldo Devedor na Venda</span>
        <span class="info-value">${formatBRL(viability.financing.remainingBalanceAtSale)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Meses Considerados</span>
        <span class="info-value">${viability.financing.monthsConsidered} ${viability.financing.monthsConsidered === 1 ? 'mês' : 'meses'}</span>
      </div>
    </div>
  </div>
  ` : ''}

  ${viability.installment ? `
  <div class="section">
    <h2 class="section-title">Detalhes do Parcelamento</h2>
    <div class="card">
      <div class="card-title">Informações do Parcelamento</div>
      <div class="info-row">
        <span class="info-label">Número de Parcelas</span>
        <span class="info-value">${viability.installment.installmentsCount} ${viability.installment.installmentsCount === 1 ? 'parcela' : 'parcelas'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Valor da Parcela</span>
        <span class="info-value">${formatBRL(viability.installment.monthlyInstallment)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Pago até Venda</span>
        <span class="info-value">${formatBRL(viability.installment.totalPaidUntilSale)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Saldo Restante na Venda</span>
        <span class="info-value">${formatBRL(viability.installment.remainingBalanceAtSale)}</span>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">Análise de Riscos</h2>
    <div class="card">
      <div class="card-title">Indicadores de Risco</div>
      <div class="info-row">
        <span class="info-label">Lucro Negativo</span>
        <span class="info-value ${viability.risk.negativeProfit ? 'destructive' : 'success'}">${viability.risk.negativeProfit ? 'Sim' : 'Não'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">ROI Baixo (&lt; 10%)</span>
        <span class="info-value ${viability.risk.lowROI ? 'destructive' : 'success'}">${viability.risk.lowROI ? 'Sim' : 'Não'}</span>
      </div>
      ${viability.financing ? `
      <div class="info-row">
        <span class="info-label">Alavancagem Alta (&gt; 80%)</span>
        <span class="info-value ${viability.risk.highLeverage ? 'destructive' : 'success'}">${viability.risk.highLeverage ? 'Sim' : 'Não'}</span>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="footer">
    Relatório gerado automaticamente pelo FlipInvest •
  </div>
  </div>
</body>
</html>
  `.trim()
}


