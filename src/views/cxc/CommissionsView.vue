<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/receivables/useReport'
import { receivablesService, type CommissionsReport } from '@/services/receivables.service'
import type { CommissionCreditNote } from '@/services/receivables.service'
import HelpTip from '@/components/ui/HelpTip.vue'
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
  { key: 'collected', ...t.cols.collected, format: 'money', total: true },
  { key: 'credited', ...t.cols.credited, format: 'money', total: true },
  { key: 'base', ...t.cols.base, format: 'money', total: true },
  {
    key: 'rate',
    ...t.cols.rate,
    value: (i) => `${String(i.rate).replace('.', ',')} %`,
    align: 'right',
    width: '5rem',
  },
  { key: 'commission', ...t.cols.commission, format: 'money', total: true },
]

type NoteRow = CommissionCreditNote & { sellerName: string }
const notes = computed<NoteRow[]>(() => (report.data.value?.items ?? []).flatMap((i) => i.creditNotes.map((n) => ({ ...n, sellerName: i.sellerName }))))
const noteColumns: Column<NoteRow>[] = [
  { key: 'sellerName', ...t.cols.seller },
  { key: 'number', ...t.cols.number, width: '10rem' },
  { key: 'date', ...t.cols.date, format: 'date', width: '7rem' },
  { key: 'customerName', ...t.cols.customer },
  { key: 'invoiceNumber', ...t.cols.invoice, width: '10rem' },
  { key: 'reason', ...t.cols.reason },
  { key: 'amount', ...t.cols.amount, format: 'money', total: true },
]
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle" />
    <p class="note panel panel--pad"><AppIcon name="info" /> {{ t.note }}</p>
    <ReportFilters v-model="filters" :loading="report.loading.value" @apply="run">
      <FormField v-bind="t.rate" for="com-rate" class="narrow">
        <input
          id="com-rate"
          v-model="rateText"
          inputmode="decimal"
          :placeholder="t.ratePlaceholder"
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
      :empty-message="t.empty"
      @retry="run()"
    />
    <h3 class="title">{{ t.notesTitle }} <HelpTip :text="t.notesHelp" /></h3>
    <DataTable
      :columns="noteColumns"
      :rows="notes"
      row-key="number"
      :loading="report.loading.value"
      :filters-text="report.summary.value"
      :title="t.notesTitle"
      :empty-message="t.notesEmpty"
    />
  </section>
</template>

<style scoped lang="scss">
.title {
  @include flex(row, center, flex-start, 0.35rem);
  margin: 1rem 0 0.5rem;
  font-size: $text-base;
}

.note {
  @include flex(row, center, flex-start, 0.5rem);
  margin-bottom: 0.75rem;
  color: $ink-soft;
}
</style>
