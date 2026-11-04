import { computed, reactive, ref, watch } from 'vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { salesService, type ReportType, type SalesReport } from '@/services/sales.service'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

/**
 * "Ventas Factura" del sistema actual: resumido (bodega → día → factura),
 * detallado (con líneas), por vendedor y por cliente. Las anuladas salen
 * tachadas solo si se piden y nunca suman: los totales vienen del API.
 */
export function useSalesReport() {
  const type = ref<ReportType>('summary')
  const filters = ref(defaultFilters())
  const extra = reactive({ groupId: '', sellerName: '', parish: '', customerType: '', includeVoided: false })
  const summary = ref<string[]>([])
  let lastLines: string[] = []
  const data = ref<SalesReport | null>(null)
  const loading = ref(false)
  const error = ref('')

  const c = t.cols
  const tt = t.totals
  const money = (key: string, label: string): Column => ({ key, label, format: 'money', total: true })
  const amounts = [money('subtotal0', tt.subtotal0), money('subtotalVat', tt.subtotalVat), money('discount', tt.discount), money('vat', tt.vat), money('total', tt.total)]

  const columns = computed<Column[]>(() => {
    if (type.value === 'seller' || type.value === 'customer') {
      return [{ key: 'name', label: type.value === 'seller' ? c.seller : c.customer }, { key: 'count', label: c.count, format: 'int', total: true }, ...amounts]
    }
    const head: Column[] = [
      { key: 'warehouse', label: c.warehouse, width: '8rem' },
      { key: 'date', label: c.date, format: 'date', width: '7rem' },
      { key: 'number', label: c.number, width: '10rem' },
      { key: 'customer', label: c.customer },
    ]
    if (type.value === 'detailed') {
      return [...head, { key: 'code', label: c.code }, { key: 'name', label: c.product }, { key: 'qty', label: c.qty, format: 'qty' },
        { key: 'unitPrice', label: c.price, format: 'money' }, money('discount', tt.discount), money('subtotal', c.lineTotal)]
    }
    return [...head, { key: 'hour', label: c.hour, width: '4rem' }, { key: 'sellerName', label: c.seller }, ...amounts]
  })

  const rows = computed<Row[]>(() => {
    const d = data.value
    if (!d) return []
    if (d.items) return d.items
    return (d.groups ?? []).flatMap((g) =>
      g.days.flatMap((day) =>
        day.rows.flatMap((r) => {
          const base = { ...r, warehouse: g.warehouse, date: day.date }
          return type.value === 'detailed' ? (r.lines ?? []).map((l) => ({ ...base, ...l, _id: `${r._id}-${l.code}` })) : [base]
        }),
      ),
    )
  })

  /** Del API (sin anuladas); en el detallado se suman solo las líneas vigentes. */
  const totals = computed<Record<string, number> | undefined>(() => {
    if (!data.value) return undefined
    if (type.value !== 'detailed') return data.value.totals
    const live = rows.value.filter((r) => r.status === 'vigente')
    return { discount: live.reduce((a, r) => a + r.discount, 0), subtotal: live.reduce((a, r) => a + r.subtotal, 0) }
  })

  async function run(lines: string[] = lastLines) {
    lastLines = lines
    loading.value = true
    error.value = ''
    const extras = [extra.sellerName && `${c.seller}: ${extra.sellerName}`, extra.parish && `${t.fields.parish.label}: ${extra.parish}`,
      extra.customerType && `${t.fields.customerType.label}: ${extra.customerType}`, extra.includeVoided && t.fields.includeVoided.label]
    summary.value = [t.report.types[type.value], ...lines, ...extras.filter((x): x is string => !!x)]
    try {
      data.value = await salesService.report({
        type: type.value,
        ...filterParams(filters.value),
        ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v && v !== true).map(([k, v]) => [k, String(v).trim()])),
        includeVoided: extra.includeVoided ? 'true' : undefined,
      })
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      loading.value = false
    }
  }

  // Cada tipo trae otra forma de datos: al cambiarlo se vuelve a consultar.
  watch(type, () => {
    data.value = null
    run()
  })

  return { type, filters, extra, summary, columns, rows, totals, loading, error, run, title: computed(() => t.report.titles[type.value]) }
}
