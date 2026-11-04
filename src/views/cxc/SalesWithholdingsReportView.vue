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
  { value: '' as const, label: t.taxAll },
  { value: 'renta' as const, label: w.renta },
  { value: 'iva' as const, label: w.iva },
]
const modes = [
  { value: 'invoice' as const, label: t.byInvoice },
  { value: 'type' as const, label: t.byType },
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
        { key: 'rate', label: '%', value: (x) => rate(x.rate), align: 'right' },
        { key: 'count', label: 'Líneas', format: 'int', total: true },
        { key: 'base', label: 'Base', format: 'money', total: true },
        { key: 'amount', label: 'Valor', format: 'money', total: true },
      ]
    : [
        { key: 'date', label: 'Fecha', format: 'date', width: '6.5rem' },
        { key: 'invoiceNumber', label: 'Factura', width: '10rem' },
        { key: 'customer', label: 'Cliente' },
        { key: 'identification', label: 'Identificación', width: '9rem' },
        { key: 'sellerName', label: 'Vendedor' },
        { key: 'voucherNumber', label: 'Comprobante', width: '10rem' },
        { key: 'tax', label: 'Impuesto', value: (x) => taxName(x.tax), width: '5rem' },
        { key: 'rate', label: '%', value: (x) => rate(x.rate), align: 'right', width: '4rem' },
        { key: 'base', label: 'Base', format: 'money', total: true },
        { key: 'amount', label: 'Valor', format: 'money', total: true },
      ],
)
</script>

<template>
  <section>
    <PageHeader />
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
      landscape
      @retry="report.run()"
    >
      <template #toolbar>
        <BaseSegmented v-model="mode" :options="modes" label="Vista" />
        <BaseSegmented v-model="tax" :options="taxTabs" label="Impuesto" />
      </template>
    </DataTable>
  </section>
</template>
