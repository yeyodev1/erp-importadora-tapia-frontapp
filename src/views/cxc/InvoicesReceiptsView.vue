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
import { useReport } from '@/composables/receivables/useReport'
import { receivablesService } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'
import { formatDay, todayISO } from '@/utils/format'

/** Facturas y cobros al corte, por cliente: resumido (total, abono, saldo) o detallado (cada abono y su medio). */
const r = cxc.reports
const filters = ref(defaultFilters({ from: '', to: '' }))
const cutoff = ref(todayISO())
const status = ref<'pending' | 'paid' | 'all'>('pending')
const mode = ref<'summary' | 'detailed'>('summary')
const detailed = computed(() => mode.value === 'detailed')
const statusTabs = [
  { value: 'pending' as const, label: r.statusPending },
  { value: 'paid' as const, label: r.statusPaid },
  { value: 'all' as const, label: r.statusAll },
]
const modes = [
  { value: 'summary' as const, label: r.summary },
  { value: 'detailed' as const, label: r.detailed },
]

const report = useReport(() =>
  receivablesService.invoicesReport({
    ...filterParams(filters.value),
    cutoff: cutoff.value,
    status: status.value,
    detailed: String(detailed.value),
  }),
)
const run = (s?: string[]) => report.run(s)
const filtersText = computed(() => [
  `${r.cutoff.label}: ${formatDay(cutoff.value)}`,
  statusTabs.find((s) => s.value === status.value)!.label,
  detailed.value ? r.detailed : r.summary,
  ...report.summary.value,
])
onMounted(() => run())
watch([status, mode], () => run())

interface Row {
  key: string
  kind: 'invoice' | 'movement' | 'subtotal'
  customer: string
  number: string
  date: string
  dueDate: string
  detail: string
  movement: number | null
  total: number | null
  paid: number | null
  balance: number | null
}

/** Una fila por factura, sus abonos debajo (detallado) y el subtotal del cliente. */
const rows = computed<Row[]>(() =>
  (report.data.value?.customers ?? []).flatMap((c) => [
    ...c.invoices.flatMap((inv) => [
      {
        key: inv.invoiceId,
        kind: 'invoice' as const,
        customer: c.name,
        number: inv.number,
        date: inv.date,
        dueDate: inv.dueDate,
        detail: '',
        movement: null,
        total: inv.total,
        paid: inv.paid,
        balance: inv.balance,
      },
      ...(inv.movements ?? [])
        .filter((m) => m.kind !== 'FACTURA')
        .map((m, i) => ({
          key: `${inv.invoiceId}-${i}`,
          kind: 'movement' as const,
          customer: '',
          number: m.docNumber ?? '',
          date: m.date,
          dueDate: '',
          detail: `${r.kinds[m.kind] ?? m.kind}: ${m.description}`,
          movement: -m.amount,
          total: null,
          paid: null,
          balance: null,
        })),
    ]),
    {
      key: `${c.partyId}-sub`,
      kind: 'subtotal' as const,
      customer: `Total ${c.name}`,
      number: '',
      date: '',
      dueDate: '',
      detail: '',
      movement: null,
      total: c.total,
      paid: c.paid,
      balance: c.balance,
    },
  ]),
)

const columns = computed<Column<Row>[]>(() => [
  { key: 'customer', label: 'Cliente' },
  { key: 'number', label: 'Comprobante', width: '10rem' },
  { key: 'date', label: 'Fecha', format: 'date', width: '6.5rem' },
  { key: 'dueDate', label: 'Vence', format: 'date', width: '6.5rem' },
  ...(detailed.value
    ? [
        { key: 'detail', label: 'Detalle del abono' },
        { key: 'movement', label: 'Abono', format: 'money' as const },
      ]
    : []),
  { key: 'total', label: 'Total', format: 'money', total: true },
  { key: 'paid', label: 'Abonos', format: 'money', total: true },
  { key: 'balance', label: 'Saldo', format: 'money', total: true },
])
const totals = computed(() => {
  const d = report.data.value
  return d ? { total: d.total, paid: d.paid, balance: d.balance } : undefined
})
</script>

<template>
  <section>
    <PageHeader />
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
    </ReportFilters>

    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="key"
      :totals="totals"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="filtersText"
      :row-class="(row) => (row.kind === 'invoice' ? undefined : `is-${row.kind}`)"
      landscape
      @retry="run()"
    >
      <template #toolbar>
        <BaseSegmented v-model="status" :options="statusTabs" label="Estado" />
        <BaseSegmented v-model="mode" :options="modes" label="Vista" />
      </template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
:deep(.is-subtotal) {
  font-weight: 600;
  background: $sand;
}

:deep(.is-movement) {
  color: $ink-soft;
  font-size: 0.9em;
}
</style>
