export function centsToCurrency(cents: number): number {
  return cents / 100
}

export function currencyToCents(currency: number): number {
  return Math.round(currency * 100)
}

export function formatCurrency(cents: number | null | undefined, currencyCode: string = 'Dh'): string {
  if (cents === null || cents === undefined) return '-'

  const currency = centsToCurrency(cents)
  return `${currency.toFixed(2)} ${currencyCode}`
}
