<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import AgingChart from '@/components/receivables/AgingChart.vue'
import { useReport } from '@/composables/receivables/useReport'
import { AGING_BUCKETS, receivablesService, type AgingReport } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'
import { formatMoney } from '@/utils/money'
import { formatDay, todayISO } from '@/utils/format'

/**
 * Cartera por edades al corte (la que piden los auditores): resumida por
 * cliente o detallada por factura; las dos y el libro deben dar el mismo total.
 */
const t = cxc.aging
const r = cxc.reports
const filters = ref(defaultFilters({ from: '', to: '' }))
const cutoff = ref(todayISO())
const mode = ref<'summary' | 'detailed'>('summary')
const detailed = computed(() => mode.value === 'detailed')
const modes = [
  { value: 'summary' as const, label: r.summary },
  { value: 'detailed' as const, label: r.detailed },
]

const report = useReport(() =>
  receivablesService.aging({
    partyId: filters.value.partyId || undefined,
    warehouseId: filterParams(filters.value).warehouseId,
    cutoff: cutoff.value,
    detailed: String(detailed.value),
  }),
)
const run = (s?: string[]) => report.run(s)
const filtersText = computed(() => [
  `${r.cutoff.label}: ${formatDay(cutoff.value)}`,
  detailed.value ? r.detailed : r.summary,
  ...report.summary.value,
])
onMounted(() => run())
watch(mode, () => run())

type Summary = NonNullable<AgingReport['summary']>[number]
type Detail = NonNullable<AgingReport['detail']>[number]
const bucketCols = AGING_BUCKETS.map((b) => ({
  key: b,
  label: t.buckets[b],
  format: 'money' as const,
  total: true,
}))
const summaryCols: Column<Summary>[] = [
  { key: 'name', label: 'Cliente' },
  { key: 'identification', label: 'RUC / cédula', width: '9rem' },
  ...bucketCols,
  { key: 'total', label: 'Total', format: 'money', total: true },
]
const detailCols: Column<Detail>[] = [
  { key: 'customer', label: 'Cliente' },
  { key: 'number', label: 'Factura', width: '10rem' },
  { key: 'date', label: 'Fecha', format: 'date', width: '6.5rem' },
  { key: 'dueDate', label: 'Vence', format: 'date', width: '6.5rem' },
  { key: 'daysOverdue', label: t.days, format: 'int', width: '4rem' },
  ...bucketCols.map((c) => ({
    ...c,
    value: (d: Detail) => (d.bucket === c.key ? d.balance : null),
  })),
  { key: 'balance', label: 'Total', format: 'money', total: true },
]

const data = computed(() => report.data.value)
// Las dos vistas tienen filas distintas: la tabla las recibe sin tipo fijo.
const rows = computed<Record<string, unknown>[]>(
  () => (detailed.value ? data.value?.detail : data.value?.summary) ?? [],
)
const columns = computed(() => (detailed.value ? detailCols : summaryCols) as Column[])
const checks = computed(() =>
  data.value
    ? [
        { label: t.summaryTotal, amount: data.value.summaryTotal },
        { label: t.detailTotal, amount: data.value.detailTotal },
        { label: t.ledgerTotal, amount: data.value.ledgerTotal },
      ]
    : [],
)
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
      <FormField v-bind="r.cutoff" for="ag-cutoff">
        <BaseDatePicker id="ag-cutoff" v-model="cutoff" />
      </FormField>
    </ReportFilters>

    <div v-if="data" class="check panel panel--pad" :class="{ 'is-off': !data.cuadra }">
      <BaseBadge :tone="data.cuadra ? 'success' : 'danger'">
        <AppIcon :name="data.cuadra ? 'check-circle' : 'alert'" />
        {{ data.cuadra ? t.cuadra : t.descuadra }}
      </BaseBadge>
      <span v-for="c in checks" :key="c.label" class="check__item">
        {{ c.label }} <strong class="num">{{ formatMoney(c.amount) }}</strong>
      </span>
      <HelpTip :text="t.checkHelp" />
    </div>

    <AgingChart v-if="data" :totals="data.totals" />

    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="detailed ? 'invoiceId' : 'partyId'"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="filtersText"
      landscape
      @retry="run()"
    >
      <template #toolbar>
        <BaseSegmented v-model="mode" :options="modes" label="Vista" />
      </template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.check {
  @include flex(row, center, flex-start, 0.5rem 1.25rem);
  flex-wrap: wrap;
  margin-bottom: 0.75rem;

  &.is-off {
    border-color: $danger;
  }

  &__item {
    color: $ink-soft;

    strong {
      color: $ink;
    }
  }
}
</style>
