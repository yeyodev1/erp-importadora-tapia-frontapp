<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/receivables/useReport'
import { receivablesService, type StatementReport } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'
import { formatMoney } from '@/utils/money'

/** Estado de cuenta de un cliente: saldo inicial, cada factura, abono o retención con saldo corrido, y saldo final. */
const r = cxc.reports
const filters = ref(defaultFilters({ from: '' }))
const report = useReport(() => receivablesService.statement(filterParams(filters.value)))

function run(s: string[]) {
  if (filters.value.partyId) report.run(s)
}

type Row = Omit<StatementReport['rows'][number], 'debit' | 'credit'> & {
  key: string
  debit: number | null
  credit: number | null
}
const rows = computed<Row[]>(() => {
  const d = report.data.value
  if (!d) return []
  const edge = (key: string, description: string, balance: number) =>
    ({
      key,
      date: '',
      kind: '',
      invoiceNumber: '',
      docNumber: '',
      description,
      debit: null,
      credit: null,
      balance,
    }) as Row
  return [
    edge('opening', r.opening, d.opening),
    ...d.rows.map((m, i) => ({ ...m, key: String(i) })),
    edge('closing', r.closing, d.closing),
  ]
})

const columns: Column<Row>[] = [
  { key: 'date', label: 'Fecha', format: 'date', width: '6.5rem' },
  { key: 'kind', label: 'Tipo', value: (m) => r.kinds[m.kind] ?? m.kind, width: '8rem' },
  { key: 'invoiceNumber', label: 'Factura', width: '10rem' },
  { key: 'docNumber', label: 'Documento', width: '10rem' },
  { key: 'description', label: 'Detalle' },
  { key: 'debit', label: 'Debe', format: 'money', total: true },
  { key: 'credit', label: 'Haber', format: 'money', total: true },
  { key: 'balance', label: 'Saldo', format: 'money' },
]
</script>

<template>
  <section>
    <PageHeader />
    <ReportFilters
      v-model="filters"
      :fields="['range', 'party']"
      party-role="customer"
      :loading="report.loading.value"
      @apply="run"
    />

    <EmptyState v-if="!filters.partyId && !report.data.value" :message="r.pickParty" />
    <template v-else>
      <p v-if="report.data.value" class="closing panel panel--pad">
        {{ r.closing }} <strong class="num">{{ formatMoney(report.data.value.closing) }}</strong>
      </p>
      <DataTable
        :columns="columns"
        :rows="rows"
        row-key="key"
        :loading="report.loading.value"
        :error="report.error.value"
        :filters-text="report.summary.value"
        :row-class="(m) => (m.kind ? undefined : 'is-edge')"
        @retry="run(report.summary.value)"
      />
    </template>
  </section>
</template>

<style scoped lang="scss">
.closing {
  @include flex(row, baseline, flex-end, 0.5rem);
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

:deep(.is-edge) {
  font-weight: 600;
  background: $sand;
}
</style>
