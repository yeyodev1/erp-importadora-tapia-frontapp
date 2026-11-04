<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/receivables/useReport'
import { receivablesService } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'

/** Retenciones en venta del rango: por factura (cada línea con su comprobante) o por tipo y porcentaje. */
const t = cxc.withholdingsReport
const w = cxc.withholdings
const filters = ref(defaultFilters())
const tax = ref<'' | 'renta' | 'iva'>('')
const mode = ref<'invoice' | 'type'>('invoice')
const byType = computed(() => mode.value === 'type')
const taxTabs = [
  { value: '' as const, label: t.taxAll, help: t.taxHelp[''] },
  { value: 'renta' as const, label: w.renta, help: t.taxHelp.renta },
  { value: 'iva' as const, label: w.iva, help: t.taxHelp.iva },
]
const modes = [
  { value: 'invoice' as const, label: t.byInvoice, help: t.modeHelp.invoice },
  { value: 'type' as const, label: t.byType, help: t.modeHelp.type },
]

const report = useReport(() =>
  receivablesService.withholdingsReport({
    ...filterParams(filters.value),
    tax: tax.value || undefined,
    groupBy: byType.value ? 'type' : undefined,
  }),
)
onMounted(() => report.run())
watch([tax, mode], () => report.run())

const rate = (n: number) => `${String(n).replace('.', ',')} %`
const taxName = (k: string) => (k === 'renta' ? w.renta : w.iva)

const rows = computed(() => {
  const d = report.data.value
  if (!d) return []
  if (byType.value) return (d.types ?? []).map((x) => ({ ...x, key: `${x.tax}-${x.rate}` }))
  return (d.rows ?? []).flatMap((row, i) =>
    row.lines.map((l, j) => ({ ...row, ...l, key: `${i}-${j}` })),
  )
})

const columns = computed<Column[]>(() =>
  byType.value
    ? [
        { key: 'tax', label: 'Impuesto', value: (x) => taxName(x.tax) },
        { key: 'rate', ...w.rate, value: (x) => rate(x.rate), align: 'right' },
        { key: 'count', ...t.cols.count, format: 'int', total: true },
        { key: 'base', ...t.cols.base, format: 'money', total: true },
        { key: 'amount', ...t.cols.amount, format: 'money', total: true },
      ]
    : [
        { key: 'date', label: 'Fecha', format: 'date', width: '6.5rem' },
        { key: 'invoiceNumber', label: 'Factura', width: '10rem' },
        { key: 'customer', label: 'Cliente' },
        { key: 'identification', label: 'Identificación', width: '9rem' },
        { key: 'sellerName', label: 'Vendedor' },
        { key: 'voucherNumber', ...w.cols.voucher, width: '10rem' },
        { key: 'tax', label: 'Impuesto', value: (x) => taxName(x.tax), width: '5rem' },
        { key: 'rate', ...w.rate, value: (x) => rate(x.rate), align: 'right', width: '4rem' },
        { key: 'base', ...t.cols.base, format: 'money', total: true },
        { key: 'amount', ...t.cols.amount, format: 'money', total: true },
      ],
)
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle" />
    <ReportFilters
      v-model="filters"
      :fields="['range', 'party']"
      party-role="customer"
      :loading="report.loading.value"
      @apply="report.run"
    />
    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="key"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="[...report.summary.value, taxTabs.find((x) => x.value === tax)!.label]"
      :empty-message="t.empty"
      landscape
      @retry="report.run()"
    >
      <template #toolbar>
        <BaseSegmented v-model="mode" :options="modes" :label="cxc.reports.modeLabel" />
        <BaseSegmented v-model="tax" :options="taxTabs" :label="t.taxLabel" />
      </template>
    </DataTable>
  </section>
</template>
