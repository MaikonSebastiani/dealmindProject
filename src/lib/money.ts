export function parsePtBRMoneyToNumber(value: string): number {
  const raw = value.trim()
  if (!raw) return 0

  // aceita "1.234,56", "1234,56", "1234.56", "R$ 1.234,56"
  const normalized = raw
    .replace(/\s/g, "")
    .replace(/^R\$/i, "")
    .replace(/\./g, "")
    .replace(",", ".")

  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

export function formatNumberToPtBRMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}


