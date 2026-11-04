<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { sriRow } from '@/components/table/indicators'
import DataTable from '@/components/table/DataTable.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import StatChips from '@/components/accounting/StatChips.vue'
import { defaultFilters } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/accounting/useReport'
import { taxesService } from '@/services/taxes.service'
import { sumCents } from '@/utils/money'
import { taxes as t } from '@/config/copy/taxes'
import { cxp } from '@/config/copy/cxp'

/** Retenciones emitidas en compras y recibidas en ventas (alias /api/taxes/reports/*). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
const w = t.withholdings
const C = w.cols
const H = w.colsHelp
const supportName = (r: Row) => cxp.taxSupports.find((o) => o.value === r.taxSupport)?.label ?? r.taxSupport
const filters = ref(defaultFilters())
const side = ref<'compras' | 'ventas'>('compras')
const by = ref('code')
const summary = ref<string[]>([])
watch(side, (s) => (by.value = s === 'compras' ? 'code' : 'invoice'))

const report = useReport(() => {
  const range = { from: filters.value.from, to: filters.value.to }
  return side.value === 'compras'
    ? taxesService.report('withholdings', { ...range, by: by.value })
    : taxesService.report('sales-withholdings', { ...range, groupBy: by.value === 'type' ? 'type' : undefined })
})
const data = report.data
watch([side, by], () => report.run())
report.run()

function apply(lines: string[]) {
  summary.value = lines
  report.run()
}

const rows = computed<Row[]>(() => data.value?.items ?? data.value?.rows ?? data.value?.types ?? [])
const taxLabel = (r: Row) => (r.tax === 'iva' ? C.iva : C.renta)
const byTax = (tax: string) => (r: Row) => sumCents((r.lines ?? []) as Row[], (l) => (l.tax === tax ? l.amount : 0))

const COLUMNS: Record<string, Column<Row>[]> = {
  code: [
    { key: 'tax', label: C.tax, value: taxLabel },
    { key: 'code', label: C.code, help: H.code },
    { key: 'description', label: C.description },
    { key: 'count', label: C.count, help: H.count, format: 'int', total: true },
    { key: 'base', label: C.base, help: H.base, format: 'money', total: true },
    { key: 'amount', label: C.amount, help: H.amount, format: 'money', total: true },
  ],
  support: [
    { key: 'taxSupport', label: C.support, help: H.support, value: supportName },
    { key: 'count', label: C.count, help: H.count, format: 'int', total: true },
    { key: 'base', label: C.base, help: H.base, format: 'money', total: true },
    { key: 'amount', label: C.amount, help: H.amount, format: 'money', total: true },
  ],
  number: [
    { key: 'withholdingNumber', label: C.number },
    { key: 'date', label: C.date, format: 'date' },
    { key: 'docNumber', label: C.doc },
    { key: 'supplierName', label: C.supplier },
    { key: 'tax', label: C.tax, value: taxLabel },
    { key: 'code', label: C.code, help: H.code },
    { key: 'base', label: C.base, help: H.base, format: 'money', total: true },
    { key: 'rate', label: C.rate, help: H.rate, format: 'qty' },
    { key: 'amount', label: C.amount, help: H.amount, format: 'money', total: true },
    { key: 'sriStatus', label: C.sri, help: H.sri },
  ],
  invoice: [
    { key: 'date', label: C.date, format: 'date' },
    { key: 'invoiceNumber', label: C.doc },
    { key: 'customer', label: C.customer },
    { key: 'voucherNumber', label: C.voucher, help: H.voucher },
    { key: 'renta', label: C.renta, format: 'money', total: true, value: byTax('renta') },
    { key: 'iva', label: C.iva, format: 'money', total: true, value: byTax('iva') },
    { key: 'total', label: C.total, format: 'money', total: true },
  ],
  type: [
    { key: 'tax', label: C.tax, value: taxLabel },
    { key: 'rate', label: C.rate, help: H.rate, format: 'qty' },
    { key: 'count', label: C.count, help: H.count, format: 'int', total: true },
    { key: 'base', label: C.base, help: H.base, format: 'money', total: true },
    { key: 'amount', label: C.amount, help: H.amount, format: 'money', total: true },
  ],
}
const columns = computed(() => COLUMNS[by.value] ?? COLUMNS.code!)
const chips = computed(() => {
  const tt = data.value?.totals ?? {}
  return [
    { label: C.renta, value: tt.renta ?? 0 },
    { label: C.iva, value: tt.iva ?? 0 },
  ]
})
const title = computed(() => `Retenciones ${side.value === 'compras' ? 'en compras' : 'en ventas'} · ${[...w.byPurchase, ...w.bySale].find((o) => o.value === by.value)?.label.toLowerCase()}`)
</script>

<template>
  <section>
    <PageHeader :subtitle="w.intro" />
    <ReportFilters v-model="filters" :loading="report.loading.value" @apply="apply">
      <FormField v-bind="w.sideField">
        <BaseSegmented v-model="side" :options="w.side" :label="w.sideField.label" />
      </FormField>
      <FormField v-bind="w.byField">
        <BaseSegmented v-model="by" :options="side === 'compras' ? w.byPurchase : w.bySale" :label="w.byField.label" />
      </FormField>
    </ReportFilters>
    <StatChips v-if="data" :items="chips" />
    <DataTable :columns="columns" :rows="rows" :loading="report.loading.value" :error="report.error.value" :title="title" :filters-text="summary" :empty-message="w.empty" :row-class="(r) => sriRow(r.sriStatus)" landscape @retry="report.run">
      <template #cell-sriStatus="{ row }"><StatusBadge :status="row.sriStatus" /></template>
    </DataTable>
  </section>
</template>
