import type { Column } from '@/components/table/columns'
import type { AmountRow } from '@/services/accounting.service'

/**
 * Reportes en árbol (saldos, estados financieros). La sangría va como
 * espacios duros en el nombre para que también salga en Excel y en la hoja
 * impresa, que no conocen los estilos de la pantalla.
 */
const NBSP = ' '

export const indentName = (r: { name: string; level?: number }) => NBSP.repeat(Math.max(0, (r.level ?? 1) - 1) * 3) + r.name

/** Fila de total que se intercala en un estado financiero. */
export type StatementRow = Omit<AmountRow, 'kind'> & { kind: AmountRow['kind'] | 'total'; _id?: string }

export const totalRow = (name: string, amount: number): StatementRow => ({ _id: `total-${name}`, code: '', name, level: 1, kind: 'total', amount })

export const treeRowClass = (r: { kind: string }) => (r.kind === 'total' ? 'is-total' : r.kind === 'mayor' ? 'is-group' : undefined)

export const statementColumns = (amountLabel: string): Column<StatementRow>[] => [
  { key: 'code', label: 'Código', width: '10rem' },
  { key: 'name', label: 'Nombre', value: indentName },
  { key: 'amount', label: amountLabel, format: 'amount-signed' },
]
