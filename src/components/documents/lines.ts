import type { ColumnFormat } from '@/components/table/columns'

/**
 * Columna de DocumentLines. `type` decide el control de la celda:
 * text · money (MoneyInput, centavos) · qty (QtyInput) · product
 * (ProductPicker) · account (AccountPicker) · readonly (solo muestra,
 * con `format` y opcionalmente `value` calculado).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface LineColumn<L = any> {
  key: string
  label: string
  type?: 'text' | 'money' | 'qty' | 'product' | 'account' | 'readonly'
  /** Ancho en escritorio (flex-basis): '8rem', '30%'. */
  width?: string
  /** Suma al pie (money/qty o readonly con format money/qty). */
  total?: boolean
  format?: ColumnFormat
  value?: (line: L) => unknown
  placeholder?: string
  /** Ayuda del encabezado (HelpTip): qué va en esta columna, con un ejemplo. */
  help?: string
}

let seq = 0
const ids = new WeakMap<object, number>()

/** Clave estable para v-for aunque la línea no tenga _id. */
export function lineKey(line: object): number {
  if (!ids.has(line)) ids.set(line, ++seq)
  return ids.get(line)!
}

/** Línea de asiento para EntryPreview. Debe y haber en CENTAVOS. */
export interface EntryLine {
  accountCode: string
  accountName?: string
  description?: string
  debit: number
  credit: number
}
