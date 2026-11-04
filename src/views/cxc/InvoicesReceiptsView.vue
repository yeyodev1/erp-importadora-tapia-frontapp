<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { overdueDays, overdueRow } from '@/components/table/indicators'
import { useReport } from '@/composables/receivables/useReport'
import { receivablesService } from '@/services/receivables.service'
import CustomerFilters from '@/components/receivables/CustomerFilters.vue'
import { blankCustomerFilters, customerParams, customerSummary } from '@/components/receivables/customerFilters'
import { splitNumber } from '@/composables/sales/docNumber'
import { cxc } from '@/config/copy/cxc'
import { formatDay, todayISO } from '@/utils/format'

/** Facturas y cobros al corte, por cliente: resumido (total, abono, saldo) o detallado (cada abono y su medio). */
const r = cxc.reports
const filters = ref(defaultFilters({ from: '', to: '' }))
const cutoff = ref(todayISO())
const status = ref<'pending' | 'paid' | 'all'>('pending')
const mode = ref<'summary' | 'detailed'>('summary')
const due = ref<'' | 'overdue' | 'notDue'>('')
const customer = ref(blankCustomerFilters())
const dueTabs = [
  { value: '' as const, label: r.statusAll, help: r.dueHelp.all },
  { value: 'overdue' as const, label: r.overdue, help: r.dueHelp.overdue },
  { value: 'notDue' as const, label: r.notDue, help: r.dueHelp.notDue },
]
const detailed = computed(() => mode.value === 'detailed')
const statusTabs = [
  { value: 'pending' as const, label: r.statusPending, help: r.statusHelp.pending },
  { value: 'paid' as const, label: r.statusPaid, help: r.statusHelp.paid },
  { value: 'all' as const, label: r.statusAll, help: r.statusHelp.all },
]
const modes = [
  { value: 'summary' as const, label: r.summary, help: r.modeHelp.summary },
  { value: 'detailed' as const, label: r.detailed, help: r.modeHelp.detailed },
]

const report = useReport(() =>
  receivablesService.invoicesReport({
    ...filterParams(filters.value),
    cutoff: cutoff.value,
    status: status.value,
    due: due.value || undefined,
    ...customerParams(customer.value),
    detailed: String(detailed.value),
  }),
)
const run = (s?: string[]) => report.run(s)
const filtersText = computed(() => [
  `${r.cutoff.label}: ${formatDay(cutoff.value)}`,
  statusTabs.find((s) => s.value === status.value)!.label,
  dueTabs.find((s) => s.value === due.value)!.label,
  detailed.value ? r.detailed : r.summary,
  ...report.summary.value,
  ...customerSummary(customer.value),
])
onMounted(() => run())
watch([status, due, mode], () => run())

interface Row {
  key: string
  kind: 'header' | 'invoice' | 'movement' | 'subtotal'
  customer?: string
  doc?: string
  series?: string
  number?: string
  date?: string
  dueDate?: string
  detail?: string
  movement?: number
  total?: number
  paid?: number
  balance?: number
}

/**
 * Como el impreso de hoy: el cliente como título (con su parroquia), debajo
 * sus facturas (Fecha | Comprobante | Serie | Número), los abonos en el
 * detallado y el subtotal del cliente.
 */
const rows = computed<Row[]>(() =>
  (report.data.value?.customers ?? []).flatMap((c) => [
    { key: `${c.partyId}-h`, kind: 'header' as const, customer: [c.name, c.identification, c.parish].filter(Boolean).join(' · ') },
    ...c.invoices.flatMap((inv) => [
      { key: inv.invoiceId, kind: 'invoice' as const, doc: r.invoiceDoc, ...splitParts(inv.number), date: inv.date, dueDate: inv.dueDate, total: inv.total, paid: inv.paid, balance: inv.balance },
      ...(inv.movements ?? [])
        .filter((m) => m.kind !== 'FACTURA')
        .map((m, i) => ({ key: `${inv.invoiceId}-${i}`, kind: 'movement' as const, number: m.docNumber ?? '', date: m.date, detail: `${r.kinds[m.kind] ?? m.kind}: ${m.description}`, movement: -m.amount })),
    ]),
    { key: `${c.partyId}-sub`, kind: 'subtotal' as const, customer: `Total ${c.name}`, total: c.total, paid: c.paid, balance: c.balance },
  ]),
)
function splitParts(n: string) {
  const { series, seq } = splitNumber(n)
  return { series, number: seq }
}

// Días vencidos al corte, solo de facturas con saldo (una pagada no está vencida).
const daysOf = (row: Row) => (row.kind === 'invoice' && row.balance ? overdueDays(row.dueDate, cutoff.value) : null)

const columns = computed<Column<Row>[]>(() => [
  { key: 'customer', label: 'Cliente' },
  { key: 'date', label: 'Fecha', format: 'date', width: '6.5rem' },
  { key: 'doc', label: 'Comprobante', width: '7.5rem' },
  { key: 'series', label: 'Serie', width: '5.5rem' },
  { key: 'number', label: 'Número', width: '7rem' },
  { key: 'dueDate', ...r.cols.dueDate, format: 'date', width: '6.5rem' },
  { key: 'days', label: cxc.aging.days, help: cxc.aging.daysHelp, format: 'days-overdue', width: '7rem', value: daysOf },
  ...(detailed.value
    ? [
        { key: 'detail', label: 'Detalle del abono' },
        { key: 'movement', ...r.cols.movement, format: 'money' as const },
      ]
    : []),
  { key: 'total', label: 'Total', format: 'money', total: true },
  { key: 'paid', ...r.cols.paid, format: 'money', total: true },
  { key: 'balance', ...r.cols.balance, format: 'money', total: true },
])
const totals = computed(() => {
  const d = report.data.value
  return d ? { total: d.total, paid: d.paid, balance: d.balance } : undefined
})
</script>

<template>
  <section>
    <PageHeader :subtitle="r.invoicesSubtitle" />
    <ReportFilters
      v-model="filters"
      :fields="['warehouse', 'party']"
      party-role="customer"
      :loading="report.loading.value"
      @apply="run"
    >
      <FormField v-bind="r.cutoff" for="ic-cutoff">
        <BaseDatePicker id="ic-cutoff" v-model="cutoff" />
      </FormField>
      <CustomerFilters v-model="customer" id-prefix="ic" />
    </ReportFilters>

    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="key"
      :totals="totals"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="filtersText"
      :empty-message="r.invoicesEmpty"
      :row-class="(row) => (row.kind === 'invoice' ? overdueRow(daysOf(row)) : `is-${row.kind}`)"
      landscape
      @retry="run()"
    >
      <template #toolbar>
        <BaseSegmented v-model="status" :options="statusTabs" :label="r.statusLabel" />
        <BaseSegmented v-model="due" :options="dueTabs" :label="r.dueLabel" />
        <BaseSegmented v-model="mode" :options="modes" :label="r.modeLabel" />
      </template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
:deep(.is-header) {
  font-weight: 700;
}

:deep(.is-subtotal) {
  font-weight: 600;
  background: $sand;
}

:deep(.is-movement) {
  color: $ink-soft;
  font-size: 0.9em;
}
</style>
