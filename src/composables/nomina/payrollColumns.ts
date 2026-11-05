import type { Column } from '@/components/table/columns'
import type { PayrollLine } from '@/types/payroll'
import { nominaRol } from '@/config/copy/nominaRol'

/** Columnas del resumen del rol (pantalla, Excel e impresión). Montos en centavos. */
const c = nominaRol.cols
const e = (l: PayrollLine) => l.employer

export const payrollColumns: Column<PayrollLine>[] = [
  { key: 'name', ...c.name },
  { key: 'days', ...c.days, format: 'int', width: '4.5rem' },
  { key: 'salaryEarned', ...c.salaryEarned, format: 'money', total: true },
  { key: 'extras', ...c.extras, format: 'money', total: true },
  { key: 'commissions', ...c.commissions, format: 'money', total: true },
  { key: 'reserveFundPaid', ...c.reserveFundPaid, format: 'money', total: true },
  { key: 'totalIncome', ...c.totalIncome, format: 'money', total: true },
  { key: 'iessPersonal', ...c.iessPersonal, format: 'money', total: true },
  { key: 'interno', ...c.interno, format: 'money', total: true, value: (l) => l.loanTotals.interno },
  { key: 'quirografario', ...c.quirografario, format: 'money', total: true, value: (l) => l.loanTotals.quirografario },
  { key: 'hipotecario', ...c.hipotecario, format: 'money', total: true, value: (l) => l.loanTotals.hipotecario },
  { key: 'otherDeductions', ...c.otherDeductions, format: 'money', total: true },
  { key: 'totalDeductions', ...c.totalDeductions, format: 'money', total: true },
  { key: 'net', ...c.net, format: 'amount-signed', total: true },
  { key: 'employerIess', ...c.employerIess, format: 'money', total: true, value: (l) => e(l).iess + e(l).secapIece },
  {
    key: 'provisions',
    ...c.provisions,
    format: 'money',
    total: true,
    value: (l) => e(l).thirteenth + e(l).fourteenth + e(l).vacation + (e(l).reserveFund - l.reserveFundPaid),
  },
  { key: 'actions', ...c.actions, screenOnly: true, width: '3rem' },
]

/** Celdas que se editan en borrador. */
export const EDITABLE = ['days', 'extras', 'commissions', 'otherDeductions'] as const
