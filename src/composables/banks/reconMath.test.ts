// Correr con: pnpm test. Mismos números que el ejemplo probado contra el API (Banco de Guayaquil, oct-2026).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { liveSummary } from './reconMath.ts'

const mov = (type: string, direction: 'in' | 'out', amount: number, date: string, cleared: boolean) =>
  ({ _id: `${type}${amount}`, type, direction, amount, date: `${date}T12:00:00.000Z`, cleared }) as never

test('liveSummary cuadra con el estado de cuenta', () => {
  const rec = {
    from: '2026-10-01T12:00:00.000Z',
    summary: { bookBalance: 446850 }, // incluye la transferencia de $1.00,
    movements: [
      mov('CHEQUE', 'out', 8000, '2026-07-15', false),
      mov('DEPOSITO', 'in', 500000, '2026-10-28', true),
      mov('CHEQUE', 'out', 30000, '2026-10-30', true),
      mov('CHEQUE', 'out', 15000, '2026-10-31', false),
      mov('NOTA_DEBITO', 'out', 250, '2026-10-31', true),
      mov('TRANSFERENCIA', 'in', 100, '2026-10-31', true),
    ],
  } as never
  const s = liveSummary(rec, 469850)
  assert.equal(s.adjustedBalance, 469850 - 23000)
  assert.equal(s.difference, 0)
  assert.equal(s.balanced, true)
  const cheque = s.rows.find((r) => r.type === 'CHEQUE')!
  assert.deepEqual([cheque.previousMonths, cheque.pendingInPeriod, cheque.bookInPeriod], [8000, 15000, 45000])
  // Una transferencia entrante cae en nota de crédito, como en el API.
  assert.equal(s.rows.find((r) => r.type === 'NOTA_CREDITO')!.records.cleared, 1)
})
