export function eachDateInclusive(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime()) || cur > last) {
    return dates
  }
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function formatMoney(amount: number, currency: string, locale = 'zh-HK'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function toHkd(amount: number, hkdRate: number): number {
  return amount * (hkdRate || 0)
}

export function randomId(prefix = ''): string {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  return prefix ? `${prefix}_${id}` : id
}
