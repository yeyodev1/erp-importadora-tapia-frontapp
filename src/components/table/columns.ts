import { formatMoney, formatQty } from '@/utils/money'
import { formatDay } from '@/utils/format'

/**
 * Formato de una columna. `money` espera CENTAVOS; `qty` hasta 4 decimales;
 * `date` "AAAA-MM-DD" o ISO; `int` entero con miles.
 */
export type ColumnFormat = 'text' | 'money' | 'qty' | 'date' | 'int'

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
}

const NUMERIC: ColumnFormat[] = ['money', 'qty', 'int']

export const isNumeric = (col: Column) => NUMERIC.includes(col.format ?? 'text')
export const alignOf = (col: Column) => col.align ?? (isNumeric(col) ? 'right' : 'left')

export function rawValue<T>(col: Column<T>, row: T): unknown {
  if (col.value) return col.value(row)
  return col.key.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown> | null)?.[k], row)
}

export function formatValue(col: Column, value: unknown): string {
  if (value == null || value === '') return ''
  switch (col.format) {
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
    out[col.key] = col.format === 'qty' ? Math.round(sum * 10000) / 10000 : Math.round(sum)
  }
  return out
}
