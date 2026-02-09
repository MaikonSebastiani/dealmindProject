/**
 * Módulo principal de geração de relatórios PDF
 * Exporta funções e utilitários
 */

// Função principal de geração
export { generateReport } from './generateReport'

// Utilitários
export {
  formatBRL,
  formatPercent,
  formatDateBR,
  formatDateTimeBR,
} from './utils'

// Tipos
export type {
  ReportType,
  PortfolioReportData,
  PerformanceReportData,
} from './types'

