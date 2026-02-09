/**
 * Função principal para gerar relatórios PDF usando Puppeteer
 * Converte HTML em PDF mantendo o design system
 */

import puppeteer from 'puppeteer'
import { generatePortfolioReportHTML } from './templates/portfolioReport.html'
import type { PortfolioReportData, PerformanceReportData, ReportType } from './types'

export async function generateReport(
  type: 'portfolio',
  data: PortfolioReportData
): Promise<Buffer>
export async function generateReport(
  type: 'performance',
  data: PerformanceReportData
): Promise<Buffer>
export async function generateReport(
  type: ReportType,
  data: PortfolioReportData | PerformanceReportData
): Promise<Buffer> {
  let html: string

  if (type === 'portfolio') {
    html = generatePortfolioReportHTML(data as PortfolioReportData)
  } else {
    throw new Error(`Tipo de relatório não implementado: ${type}`)
  }

  // Iniciar Puppeteer com configurações otimizadas
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  })

  try {
    const page = await browser.newPage()
    
    // Configurar viewport
    await page.setViewport({
      width: 1200,
      height: 1600,
    })
    
    // Configurar conteúdo HTML
    await page.setContent(html, {
      waitUntil: 'load',
    })

    // Gerar PDF sem margens (bordas brancas)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    })

    return Buffer.from(pdfBuffer)
  } catch (error) {
    throw new Error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  } finally {
    await browser.close()
  }
}
