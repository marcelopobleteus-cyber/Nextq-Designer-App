/**
 * Periodos de facturacion compartidos (Payroll y Expenses).
 *
 * Ciclo de 14 dias, lunes a domingo; NGT paga los viernes. Se ancla en un lunes
 * conocido (9-nov-2026, inicio del periodo 11/09-11/22) y de ahi se cuentan
 * periodos hacia atras y hacia adelante. Si el ciclo cambia, se edita solo
 * CYCLE_ANCHOR.
 */
export const CYCLE_ANCHOR = new Date(2026, 10, 9)
export const CYCLE_DAYS = 14

export interface PayPeriod {
  from: string
  to: string
  label: string
  kind: 'current' | 'toInvoice' | 'past'
}

export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function plusDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

const shortDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** Periodo numero `idx` (0 = el que arranca en el ancla). */
export function periodAt(idx: number): { start: Date; end: Date } {
  const start = plusDays(CYCLE_ANCHOR, idx * CYCLE_DAYS)
  return { start, end: plusDays(start, CYCLE_DAYS - 1) }
}

/** Indice del periodo que contiene `d`. */
export function periodIndexOf(d: Date): number {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((day.getTime() - CYCLE_ANCHOR.getTime()) / 86400000)
  return Math.floor(diff / CYCLE_DAYS)
}

/** El ultimo periodo ya cerrado: el que toca facturar. */
export function periodToInvoice(now: Date = new Date()): { from: string; to: string } {
  const { start, end } = periodAt(periodIndexOf(now) - 1)
  return { from: isoDay(start), to: isoDay(end) }
}

/** El periodo vigente y los 5 anteriores, el mas reciente primero. */
export function recentPayPeriods(now: Date = new Date()): PayPeriod[] {
  const cur = periodIndexOf(now)
  const out: PayPeriod[] = []
  for (let i = cur; i >= cur - 5; i--) {
    const { start, end } = periodAt(i)
    out.push({
      from: isoDay(start),
      to: isoDay(end),
      label: `${shortDay(start)} – ${shortDay(end)}`,
      kind: i === cur ? 'current' : i === cur - 1 ? 'toInvoice' : 'past',
    })
  }
  return out
}
