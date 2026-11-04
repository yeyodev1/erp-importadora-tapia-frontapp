import { formatMoney, formatQty } from '@/utils/money'
import { formatDay } from '@/utils/format'
import { overdueDays, overdueIndicator } from './indicators'

/**
 * Formato de una columna. `money` espera CENTAVOS; `qty` hasta 4 decimales;
 * `date` "AAAA-MM-DD" o ISO; `int` entero con miles.
 * Indicadores (color con significado, ver README): `amount-signed` (centavos,
 * negativos en rojo), `qty-stock` (bajo `min` ámbar, negativo rojo) y
 * `days-overdue` (días o fecha de vencimiento → chip "Al día" / "5 días" / "+90").
 */
export type ColumnFormat = 'text' | 'money' | 'qty' | 'date' | 'int' | 'amount-signed' | 'qty-stock' | 'days-overdue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: string
  label: string
  /** Qué significa la columna: sale como (?) en el encabezado, no en Excel ni impresión. */
  help?: string
  format?: ColumnFormat
  /** Por defecto: derecha para números, izquierda para el resto. */
  align?: 'left' | 'right' | 'center'
  width?: string
  /** Suma la columna al pie (solo money/qty/int). */
  total?: boolean
  /** Para valores anidados o calculados: (row) => row.party.name */
  value?: (row: T) => unknown
  /** Fuera de Excel e impresión (columna de acciones). */
  screenOnly?: boolean
  /** `qty-stock`: mínimo de la fila; bajo él la cantidad sale en ámbar. */
  min?: (row: T) => number | null | undefined
}

const NUMERIC: ColumnFormat[] = ['money', 'qty', 'int']

/** Formato de base de los indicadores: así suman, se imprimen y van a Excel como su número. */
export function baseFormat(col: Column): ColumnFormat {
  if (col.format === 'amount-signed') return 'money'
  if (col.format === 'qty-stock') return 'qty'
  return col.format ?? 'text'
}

export const isNumeric = (col: Column) => NUMERIC.includes(baseFormat(col))
export const alignOf = (col: Column) => col.align ?? (col.format === 'days-overdue' ? 'center' : isNumeric(col) ? 'right' : 'left')

export function rawValue<T>(col: Column<T>, row: T): unknown {
  if (col.value) return col.value(row)
  return col.key.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown> | null)?.[k], row)
}

export function formatValue(col: Column, value: unknown): string {
  if (value == null || value === '') return ''
  if (col.format === 'days-overdue') return overdueIndicator(overdueDays(value))?.label ?? ''
  switch (baseFormat(col)) {
    case 'money':
      return formatMoney(Number(value))
    case 'qty':
      return formatQty(Number(value))
    case 'int':
      return Number(value).toLocaleString('en-US')
    case 'date':
      return formatDay(String(value))
    default:
      return typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)
  }
}

/** Totales de las columnas con `total`, sumando enteros (centavos) sin floats en money. */
export function computeTotals<T>(columns: Column<T>[], rows: T[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const col of columns) {
    if (!col.total) continue
    let sum = 0
    for (const row of rows) sum += Number(rawValue(col, row)) || 0
    out[col.key] = baseFormat(col) === 'qty' ? Math.round(sum * 10000) / 10000 : Math.round(sum)
  }
  return out
}
