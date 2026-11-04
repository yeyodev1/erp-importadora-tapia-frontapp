import { downloadXlsx, type XlsxValue } from './excel'
import { todayISO } from './format'
import { baseFormat, formatValue, rawValue, type Column } from '@/components/table/columns'
import { site } from '@/config/site'

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

/** Columnas + filas de una tabla → .xlsx con números reales (dólares, no centavos). */
export async function exportTable<T>(title: string, columns: Column<T>[], rows: T[], totals?: Record<string, number>) {
  const cols = columns.filter((c) => !c.screenOnly)
  const cell = (col: Column<T>, value: unknown): XlsxValue => {
    if (value == null || value === '') return null
    // Indicadores (amount-signed, qty-stock) van como su número; el color es solo de pantalla.
    const format = baseFormat(col)
    if (format === 'money') return Number(value) / 100
    if (format === 'qty' || format === 'int') return Number(value)
    return formatValue(col, value)
  }
  const formats = cols.map((c) => (baseFormat(c) === 'qty' ? '#,##0.0000' : baseFormat(c) === 'int' ? '#,##0' : '#,##0.00'))
  const body = rows.map((row) => cols.map((c) => cell(c, rawValue(c, row))))
  if (totals && Object.keys(totals).length) {
    body.push(cols.map((c, i) => (c.key in totals ? cell(c, totals[c.key]) : i === 0 ? site.table.totals : null)))
  }
  await downloadXlsx(`${slug(title) || 'reporte'}-${todayISO()}`, cols.map((c) => c.label), body, formats)
}
