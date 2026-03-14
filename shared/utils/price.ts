export function centsToCurrency(cents: number): number {
  return Math.round(cents / 100)
}

export function currencyToCents(currency: number): number {
  return Math.round(currency * 100)
}

export function formatCurrency(cents: number, currencyCode: string = 'MAD'): string {
  const currency = centsToCurrency(cents)
  return `${currency} ${currencyCode}`
}
