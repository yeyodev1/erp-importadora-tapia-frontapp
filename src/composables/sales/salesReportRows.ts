import type { SalesReport, Totals } from '@/services/sales.service'
import { formatDay } from '@/utils/format'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>

/** %IVA de la factura como lo imprime el sistema de hoy: IVA sobre la base imponible (15) o 0. */
export const vatRateOf = (t: Totals) => (t.subtotalVat ? Math.round((t.vat * 100) / t.subtotalVat) : 0)

/** Subtotal de día o de bodega con las columnas de montos del resumido y del detallado. */
const subtotal = (key: string, label: string, t: Totals & { count: number }): Row => ({
  _id: key,
  kind: 'subtotal',
  customer: `${label} (${t.count})`,
  ...t,
  subtotal: t.subtotal0 + t.subtotalVat,
})

/**
 * "Ventas Factura" de hoy: por bodega y por día, con el título del grupo y
 * su subtotal. El detallado pone una fila por producto de cada factura.
 * Las filas de título y subtotal no suman: los totales del pie vienen del API.
 */
export function dayRows(d: SalesReport, detailed: boolean, labels: { day: string; total: string }): Row[] {
  return (d.groups ?? []).flatMap((g) => [
    { _id: `g-${g.warehouse}`, kind: 'group', customer: g.warehouse },
    ...g.days.flatMap((day) => {
      const date = formatDay(day.date)
      const invoices = day.rows.flatMap((r) => {
        const base = { ...r, kind: 'row', date: day.date, vatRate: vatRateOf(r) }
        return detailed ? (r.lines ?? []).map((l, i) => ({ ...base, ...l, _id: `${r._id}-${i}` })) : [base]
      })
      return [
        { _id: `d-${g.warehouse}-${day.date}`, kind: 'day', customer: `${labels.day} ${date}` },
        ...invoices,
        subtotal(`s-${g.warehouse}-${day.date}`, `${labels.total} ${date}`, day.totals),
      ]
    }),
    subtotal(`s-${g.warehouse}`, `${labels.total} ${g.warehouse}`, g.totals),
  ])
}
