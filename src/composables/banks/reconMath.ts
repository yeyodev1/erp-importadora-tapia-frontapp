import type { BankMovement, Reconciliation, ReconSummary, SummaryType } from '@/types/banks'

// Mismo orden que SUMMARY_TYPES del API (acá sin imports de valor: se prueba con node --test).
const TYPES: SummaryType[] = ['DEPOSITO', 'NOTA_CREDITO', 'NOTA_DEBITO', 'CHEQUE']

/** Transferencias entrantes las muestra el banco como nota de crédito y las salientes como débito. */
const bucket = (m: BankMovement): SummaryType =>
  (TYPES as string[]).includes(m.type) ? (m.type as SummaryType) : m.direction === 'in' ? 'NOTA_CREDITO' : 'NOTA_DEBITO'

const total = (list: BankMovement[]) => list.reduce((a, m) => a + m.amount, 0)

/**
 * Mismo cálculo que `summarize` del API, en vivo mientras se marcan filas.
 * El saldo del libro de bancos viene del API (depende solo de la fecha hasta).
 */
export function liveSummary(rec: Reconciliation, statementBalance: number): Omit<ReconSummary, 'message'> {
  const from = rec.from.slice(0, 10)
  const rows = TYPES.map((type) => {
    const mine = rec.movements.filter((m) => bucket(m) === type)
    const pending = mine.filter((m) => !m.cleared)
    return {
      type,
      previousMonths: total(pending.filter((m) => m.date.slice(0, 10) < from)),
      pendingInPeriod: total(pending.filter((m) => m.date.slice(0, 10) >= from)),
      bookInPeriod: total(mine.filter((m) => m.date.slice(0, 10) >= from)),
      records: { pending: pending.length, cleared: mine.length - pending.length },
    }
  })
  const pendingOf = (dir: 'in' | 'out') => total(rec.movements.filter((m) => !m.cleared && m.direction === dir))
  const bookBalance = rec.summary.bookBalance
  const adjustedBalance = statementBalance + pendingOf('in') - pendingOf('out')
  const difference = adjustedBalance - bookBalance
  return {
    statementBalance,
    bookBalance,
    rows,
    adjustedBalance,
    difference,
    balanced: difference === 0,
    totalRecords: rec.movements.length,
  }
}
