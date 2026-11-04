<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/receivables/useReport'
import { receivablesService, type CommissionsReport } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'

/** Comisiones por vendedor sobre lo cobrado en el rango, al % que se escriba. */
const t = cxc.commissions
const filters = ref(defaultFilters())
const rateText = ref('1')
const rate = () => Number(rateText.value.replace(',', '.'))

const report = useReport(() =>
  receivablesService.commissions({
    from: filterParams(filters.value).from,
    to: filterParams(filters.value).to,
    rate: rate(),
  }),
)
const run = (s?: string[]) => report.run(s && [...s, `${t.rate.label}: ${rateText.value} %`])
onMounted(() => run([]))

const columns: Column<CommissionsReport['items'][number]>[] = [
  { key: 'sellerName', label: 'Vendedor' },
  { key: 'collected', label: 'Cobrado', format: 'money', total: true },
  {
    key: 'rate',
    label: '%',
    value: (i) => `${String(i.rate).replace('.', ',')} %`,
    align: 'right',
    width: '5rem',
  },
  { key: 'commission', label: 'Comisión', format: 'money', total: true },
]
</script>

<template>
  <section>
    <PageHeader />
    <p class="note panel panel--pad"><AppIcon name="info" /> {{ t.note }}</p>
    <ReportFilters v-model="filters" :loading="report.loading.value" @apply="run">
      <FormField v-bind="t.rate" for="com-rate" class="narrow">
        <input
          id="com-rate"
          v-model="rateText"
          inputmode="decimal"
          class="num"
          :aria-invalid="!(rate() >= 0 && rate() <= 100)"
        />
      </FormField>
    </ReportFilters>
    <DataTable
      :columns="columns"
      :rows="report.data.value?.items ?? []"
      row-key="sellerName"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="report.summary.value"
      @retry="run()"
    />
  </section>
</template>

<style scoped lang="scss">
.note {
  @include flex(row, center, flex-start, 0.5rem);
  margin-bottom: 0.75rem;
  color: $ink-soft;
}
</style>
