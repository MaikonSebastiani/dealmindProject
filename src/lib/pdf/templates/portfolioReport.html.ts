/**
 * Template HTML para relatório de portfólio
 * Reutiliza o design system do projeto
 */

import { formatBRL, formatPercent, formatDateTimeBR, escapeHtml } from '../utils'
import type { PortfolioReportData } from '../types'

export function generatePortfolioReportHTML(data: PortfolioReportData): string {
  const { user, metrics, deals, generatedAt } = data

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Portfólio</title>
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
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 20px;
      font-weight: bold;
      color: #FFFFFF;
      margin-bottom: 4px;
    }
    
    .metric-value.highlight {
      color: #4F7DFF;
    }
    
    .metric-delta {
      font-size: 9px;
      color: #7C889E;
    }
    
    .card {
      background: #0B0F17;
      border: 1px solid #141B29;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }
    
    .card-title {
      font-size: 12px;
      font-weight: bold;
      color: #FFFFFF;
      margin-bottom: 12px;
    }
    
    .table {
      width: 100%;
      margin-top: 12px;
    }
    
    .table-row {
      display: flex;
      border-bottom: 1px solid #141B29;
      padding: 8px 0;
    }
    
    .table-header {
      background: #0B1323;
      font-weight: bold;
      padding: 10px 0;
    }
    
    .table-cell {
      font-size: 9px;
      color: #FFFFFF;
      padding: 0 8px;
      flex: 1;
    }
    
    .table-cell.flex-2 {
      flex: 2;
    }
    
    .table-cell.flex-1-5 {
      flex: 1.5;
    }
    
    .table-cell.bold {
      font-weight: bold;
    }
    
    .table-cell.muted {
      color: #7C889E;
    }
    
    .table-cell.success {
      color: #32D583;
    }
    
    .table-cell.destructive {
      color: #FF5A6A;
    }
    
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #141B29;
      font-size: 8px;
      color: #7C889E;
      text-align: center;
    }
    
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
  <div class="header">
    <h1>Relatório de Portfólio${data.status && data.status !== 'Todos os imóveis' && data.status !== 'Todos os status' ? ` (${escapeHtml(data.status)})` : ''}</h1>
    <div class="subtitle">Análise completa do seu portfólio imobiliário</div>
    <div class="meta">
      ${user.name ? `<span>Gerado para: ${escapeHtml(user.name)}</span>` : ''}
      <span>Data: ${formatDateTimeBR(generatedAt)}</span>
      ${data.period ? `<span>Período: ${escapeHtml(data.period)}</span>` : ''}
      ${data.status ? `<span>Status: ${escapeHtml(data.status)}</span>` : ''}
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Visão Geral</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Pipeline</div>
        <div class="metric-value">${metrics.pipelineCount}</div>
        <div class="metric-delta">${metrics.pipelineCount > 0 ? formatBRL(metrics.pipelineValue) : 'Nenhum Imovel'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Portfólio Ativo</div>
        <div class="metric-value highlight">${metrics.portfolioDeals}</div>
        <div class="metric-delta">${metrics.portfolioDeals > 0 ? formatBRL(metrics.portfolioValue) : 'Nenhum Imovel'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Alugados</div>
        <div class="metric-value">${metrics.rentingCount}</div>
        <div class="metric-delta">${metrics.rentingCount > 0 ? `${formatBRL(metrics.totalRentIncome)}/mês` : 'Nenhum alugado'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Vendidos</div>
        <div class="metric-value">${metrics.soldCount}</div>
        <div class="metric-delta">Imóveis vendidos</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Rentabilidade</h2>
    <div class="metrics-grid metrics-grid-3">
      <div class="metric-card">
        <div class="metric-label">Rentabilidade Anualizada</div>
        <div class="metric-value ${metrics.rentabilidadeAnual > 0.1215 ? 'highlight' : ''}">${formatPercent(metrics.rentabilidadeAnual)}</div>
        <div class="metric-delta">${metrics.mesesInvestindo > 0 ? `Baseado em ${metrics.mesesInvestindo} ${metrics.mesesInvestindo === 1 ? 'mês' : 'meses'} de investimento` : 'Sem histórico suficiente'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Rentabilidade Total</div>
        <div class="metric-value">${formatPercent(metrics.rentabilidadeTotal)}</div>
        <div class="metric-delta">${metrics.mesesInvestindo > 0 ? `Período: ${metrics.mesesInvestindo} ${metrics.mesesInvestindo === 1 ? 'mês' : 'meses'}` : ''}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total de Deals</div>
        <div class="metric-value">${metrics.totalDeals}</div>
        <div class="metric-delta">Todos os imóveis cadastrados</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Detalhamento por Imóvel</div>
    <div class="table">
      <div class="table-row table-header">
        <div class="table-cell flex-2">Imóvel</div>
        <div class="table-cell">Status</div>
        <div class="table-cell flex-1-5">Valor Compra</div>
        <div class="table-cell">ROI</div>
        <div class="table-cell">Cash Flow</div>
      </div>
      ${deals.map(deal => `
        <div class="table-row">
          <div class="table-cell flex-2">
            <div class="bold">${escapeHtml(deal.propertyName || 'Sem nome')}</div>
            ${deal.address ? `<div class="muted">${escapeHtml(deal.address)}</div>` : ''}
          </div>
          <div class="table-cell">${escapeHtml(deal.status)}</div>
          <div class="table-cell flex-1-5">${formatBRL(deal.purchasePrice + deal.acquisitionCosts)}</div>
          <div class="table-cell ${deal.roi > 0 ? 'success' : 'destructive'}">${formatPercent(deal.roi)}</div>
          <div class="table-cell ${deal.monthlyCashFlow > 0 ? 'success' : 'destructive'}">${formatBRL(deal.monthlyCashFlow)}</div>
        </div>
      `).join('')}
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

