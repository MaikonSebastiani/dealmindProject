/**
 * Utilitários para formatação e manipulação de dados em PDFs
 */

import { formatNumberToPtBRMoney } from '@/lib/money'

/**
 * Formata valor monetário para exibição em PDF
 */
export function formatBRL(value: number): string {
  return formatNumberToPtBRMoney(value)
}

/**
 * Formata percentual para exibição em PDF
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Formata data para exibição em PDF (formato brasileiro)
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formata data e hora para exibição em PDF
 */
export function formatDateTimeBR(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Escapa caracteres HTML para evitar problemas de segurança e renderização
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}


