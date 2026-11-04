<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import { overdueRow } from '@/components/table/indicators'
import AgingChart from '@/components/receivables/AgingChart.vue'
import CustomerFilters from '@/components/receivables/CustomerFilters.vue'
import { blankCustomerFilters, customerParams, customerSummary } from '@/components/receivables/customerFilters'
import { splitNumber } from '@/composables/sales/docNumber'
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
const customer = ref(blankCustomerFilters())
const route = useRoute()
const router = useRouter()
// `?bucket=d30|d90` (campana): 31–90 días vencidos o más de 90; el filtro vive en la URL.
type Due = '' | 'd30' | 'd90'
const due = computed<Due>({
  get: () => (route.query.bucket === 'd30' || route.query.bucket === 'd90' ? route.query.bucket : ''),
  set: (v) => router.replace({ query: { ...route.query, bucket: v || undefined } }),
})
const dueOptions = (['', 'd30', 'd90'] as const).map((value) => ({ value, label: t.due[value || 'all'], help: t.dueHelp[value || 'all'] }))
const mode = ref<'summary' | 'detailed'>(due.value ? 'detailed' : 'summary')
const detailed = computed(() => mode.value === 'detailed')
const modes = [
  { value: 'summary' as const, label: r.summary, help: t.modeHelp.summary },
  { value: 'detailed' as const, label: r.detailed, help: t.modeHelp.detailed },
]

const report = useReport(() =>
  receivablesService.aging({
    partyId: filters.value.partyId || undefined,
    warehouseId: filterParams(filters.value).warehouseId,
    ...customerParams(customer.value),
    cutoff: cutoff.value,
    detailed: String(detailed.value),
  }),
)
const run = (s?: string[]) => report.run(s)
const filtersText = computed(() => [
  `${r.cutoff.label}: ${formatDay(cutoff.value)}`,
  detailed.value ? r.detailed : r.summary,
  ...(due.value ? [t.due[due.value]] : []),
  ...report.summary.value,
  ...customerSummary(customer.value),
  `${t.records}: ${rows.value.length}`,
])
// Título de la hoja como el impreso de hoy: "Cartera por edades resumida · Corte 30/10/2026".
const title = computed(() => `${detailed.value ? t.titleDetailed : t.titleSummary} · ${t.cut} ${formatDay(cutoff.value)}`)
onMounted(() => run())
watch(mode, () => run())

type Summary = NonNullable<AgingReport['summary']>[number]
type Detail = NonNullable<AgingReport['detail']>[number]
const bucketCols = AGING_BUCKETS.map((b) => ({
  key: b,
  label: t.buckets[b],
  help: t.bucketHelp[b],
  format: 'money' as const,
  total: true,
}))
const summaryCols: Column<Summary>[] = [
  { key: 'name', label: 'Cliente' },
  ...bucketCols,
  { key: 'total', label: 'Total', help: t.totalHelp, format: 'money', total: true },
]
const detailCols: Column<Detail>[] = [
  { key: 'customer', label: 'Cliente' },
  { key: 'date', label: 'Fecha', format: 'date', width: '6.5rem' },
  { key: 'series', label: 'Serie', width: '5.5rem', value: (d) => splitNumber(d.number).series },
  { key: 'number', label: 'Número', width: '6.5rem', value: (d) => splitNumber(d.number).seq },
  { key: 'dueDate', ...r.cols.dueDate, format: 'date', width: '6.5rem' },
  { key: 'daysOverdue', label: t.days, help: t.daysHelp, format: 'days-overdue', width: '7rem' },
  ...bucketCols.map((c) => ({
    ...c,
    value: (d: Detail) => (d.bucket === c.key ? d.balance : null),
  })),
  { key: 'balance', label: 'Total', help: t.totalHelp, format: 'money', total: true },
]

const data = computed(() => report.data.value)
// Las dos vistas tienen filas distintas: la tabla las recibe sin tipo fijo.
const inDue = (days: number) => (due.value === 'd90' ? days > 90 : due.value === 'd30' ? days > 30 && days <= 90 : true)
const dueBalance = (s: Summary) => (due.value === 'd90' ? s.d91_120 + s.over120 : s.d31_60 + s.d61_90)
const rows = computed<Record<string, unknown>[]>(() =>
  detailed.value
    ? (data.value?.detail ?? []).filter((d) => inDue(d.daysOverdue))
    : (data.value?.summary ?? []).filter((s) => !due.value || dueBalance(s) > 0),
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
    <PageHeader :subtitle="t.subtitle" />
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
      <CustomerFilters v-model="customer" id-prefix="ag" />
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

    <DataTable
      :columns="columns"
      :rows="rows"
      :row-key="detailed ? 'invoiceId' : 'partyId'"
      :loading="report.loading.value"
      :error="report.error.value"
      :title="title"
      :filters-text="filtersText"
      :empty-message="t.empty"
      :row-class="detailed ? (d) => overdueRow(d.daysOverdue) : undefined"
      landscape
      @retry="run()"
    >
      <template #toolbar>
        <BaseSegmented v-model="mode" :options="modes" :label="r.modeLabel" />
        <BaseSegmented v-model="due" :options="dueOptions" :label="t.dueLabel" />
      </template>
    </DataTable>

    <!-- Como el impreso de hoy: el gráfico por tramo va al final, debajo de la cartera. -->
    <AgingChart v-if="data" class="aging-chart" :totals="data.totals" />
  </section>
</template>

<style scoped lang="scss">
.aging-chart {
  margin-top: 0.75rem;
}

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
