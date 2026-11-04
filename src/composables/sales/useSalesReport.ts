import { computed, reactive, ref, watch } from 'vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { blankCustomerFilters, customerParams, customerSummary } from '@/components/receivables/customerFilters'
import { salesService, type ReportType, type SalesReport } from '@/services/sales.service'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'
import { dayRows, type Row } from './salesReportRows'

/**
 * "Ventas Factura" del sistema actual: resumido (bodega → día → factura),
 * detallado (con líneas), resumido por vendedor y por cliente. Columnas en
 * el orden de hoy: Hora | Serie | Número | Cliente | Vendedor | Base cero |
 * Base imp. | %IVA | IVA | Total. Las anuladas salen tachadas solo si se
 * piden y nunca suman: los totales vienen del API.
 */
export function useSalesReport() {
  const type = ref<ReportType>('summary')
  const filters = ref(defaultFilters())
  const extra = reactive({ groupId: '', subgroup: '', includeVoided: false })
  const customer = ref(blankCustomerFilters())
  const summary = ref<string[]>([])
  let lastLines: string[] = []
  const data = ref<SalesReport | null>(null)
  const loading = ref(false)
  const error = ref('')

  const c = t.cols
  const tt = t.totals
  const h = t.colHelp
  const money = (key: string, label: string, help?: string): Column => ({ key, label, help, format: 'money', total: true })
  const vatRate: Column = { key: 'vatRate', label: c.vatPct, help: h.vatRate, align: 'right', width: '4rem', value: (r) => (r.kind === 'row' ? `${r.vatRate}` : '') }
  const amounts = [money('subtotal0', c.base0, h.subtotal0), money('subtotalVat', c.baseVat, h.subtotalVat), vatRate, money('vat', tt.vat, h.vat), money('total', tt.total)]

  const columns = computed<Column[]>(() => {
    if (type.value === 'seller' || type.value === 'customer') {
      return [{ key: 'name', label: type.value === 'seller' ? c.seller : c.customer }, { key: 'count', label: c.count, help: h.count, format: 'int', total: true }, ...amounts.filter((a) => a !== vatRate)]
    }
    const head: Column[] = [
      { key: 'hour', label: c.hour, help: h.hour, width: '4rem' },
      { key: 'series', label: c.series, help: h.series, width: '5.5rem' },
      { key: 'sequential', label: c.number, width: '6.5rem' },
      { key: 'customer', label: c.customer },
    ]
    if (type.value === 'detailed') {
      return [...head, { key: 'code', label: c.code, width: '5.5rem' }, { key: 'name', label: c.product }, { key: 'qty', label: c.qty, format: 'qty' },
        { key: 'unitPrice', label: c.pvp, help: h.pvp, format: 'money' }, vatRate, money('discount', tt.discount), money('subtotal', c.lineTotal)]
    }
    return [...head, { key: 'sellerName', label: c.seller }, ...amounts]
  })

  const rows = computed<Row[]>(() => {
    const d = data.value
    if (!d) return []
    return d.items ?? dayRows(d, type.value === 'detailed', { day: c.dayLabel, total: c.totalLabel })
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
    const f = t.fields
    const extras = [extra.subgroup && `${f.subgroup.label}: ${extra.subgroup}`, ...customerSummary(customer.value), extra.includeVoided && f.includeVoided.label]
    summary.value = [t.report.types[type.value], ...lines, ...extras.filter((x): x is string => !!x)]
    try {
      data.value = await salesService.report({
        type: type.value,
        ...filterParams(filters.value),
        ...customerParams(customer.value),
        groupId: extra.groupId || undefined,
        subgroup: extra.subgroup || undefined,
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

  return { type, filters, extra, customer, summary, columns, rows, totals, loading, error, run, title: computed(() => t.report.titles[type.value]) }
}
