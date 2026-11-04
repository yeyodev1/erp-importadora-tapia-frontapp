import type { Level } from '../ui/levels'

/**
 * Indicadores de celda (formatos `days-overdue`, `qty-stock`, `amount-signed`
 * de DataTable). Lógica pura, sin Vue, para probarla con node:test.
 */
export interface Indicator {
  level: Level
  label: string
}

const DAY = 86_400_000

/** Fecha de hoy "AAAA-MM-DD" en la hora local (Ecuador), no en UTC. */
export const localToday = () => new Date().toLocaleDateString('en-CA')

/** Días de atraso: el número tal cual, o desde una fecha de vencimiento "AAAA-MM-DD"/ISO hasta hoy. */
export function overdueDays(value: unknown, today = localToday()): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : null
  const due = Date.parse(String(value).slice(0, 10))
  if (Number.isNaN(due)) return null
  return Math.round((Date.parse(today) - due) / DAY)
}

/**
 * Chip de vencimiento: al día (verde), vence en la próxima semana (azul),
 * vence hoy (ámbar), 1–90 días vencido (ámbar), más de 90 (rojo).
 */
export function overdueIndicator(days: number | null): Indicator | null {
  if (days == null) return null
  if (days < -7) return { level: 'success', label: 'Al día' }
  if (days < 0) return { level: 'info', label: `Vence en ${-days} ${days === -1 ? 'día' : 'días'}` }
  if (days === 0) return { level: 'warning', label: 'Vence hoy' }
  return { level: days > 90 ? 'danger' : 'warning', label: `${days > 90 ? '+90 · ' : ''}${days} ${days === 1 ? 'día' : 'días'}` }
}

/** Existencia: negativa en rojo, bajo el mínimo en ámbar; normal sin marca. */
export function stockLevel(qty: unknown, min?: number | null): Level | null {
  const n = Number(qty)
  if (qty == null || qty === '' || Number.isNaN(n)) return null
  if (n < 0) return 'danger'
  if (min && n < min) return 'warning'
  return null
}

/** Monto con signo: los negativos se pintan en rojo. */
export const signedLevel = (value: unknown): Level | null => (Number(value) < 0 ? 'danger' : null)

/** Fila de DataTable por atraso: +90 días rojo, +30 ámbar (lo mismo que avisa la campana). */
export function overdueRow(value: unknown): 'is-danger' | 'is-warning' | undefined {
  const days = overdueDays(value)
  if (days == null) return undefined
  return days > 90 ? 'is-danger' : days > 30 ? 'is-warning' : undefined
}

/** Fila de DataTable por existencia: negativa rojo, bajo el mínimo ámbar. */
export function stockRow(qty: unknown, min?: number | null): 'is-danger' | 'is-warning' | undefined {
  const level = stockLevel(qty, min)
  return level === 'danger' ? 'is-danger' : level === 'warning' ? 'is-warning' : undefined
}

/** Fila de un comprobante electrónico: devuelto/no autorizado/error rojo, sin firma ámbar. */
export function sriRow(status: unknown): 'is-danger' | 'is-warning' | undefined {
  if (status === 'sin_firma') return 'is-warning'
  return status === 'devuelto' || status === 'no_autorizado' || status === 'error' ? 'is-danger' : undefined
}
