<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { useList } from '@/composables/useList'
import { accountingService } from '@/services/accounting.service'
import type { ListParams } from '@/services/catalog.service'
import { formatDay } from '@/utils/format'
import { accounting as t } from '@/config/copy/accounting'
import { accountingScreens } from '@/config/copy/accountingScreens'

/** Libro diario: cada asiento del rango con sus líneas; el haber con sangría como en el libro impreso. */
interface JournalRow {
  _id: string
  entryId: string
  first: boolean
  date: string
  number: string
  type: string
  status: string
  entryDescription: string
  accountCode: string
  accountName: string
  description: string
  debit: number
  credit: number
}

const router = useRouter()
const h = accountingScreens.columns
const ex = accountingScreens.vouchers.fields.excludeVoided
const filters = ref(defaultFilters())
const excludeVoided = ref(false)
const applied = ref<ListParams>({ from: filters.value.from, to: filters.value.to })
const summary = ref<string[]>([])
const totals = ref({ debit: 0, credit: 0 })

function apply(lines: string[]) {
  const { from, to } = filterParams(filters.value)
  applied.value = { from, to, excludeVoided: excludeVoided.value || undefined }
  summary.value = lines
}

async function fetchJournal(params: ListParams) {
  const res = await accountingService.journal(params)
  totals.value = { debit: res.totalDebit, credit: res.totalCredit }
  const items: JournalRow[] = res.items.flatMap((e) =>
    (e.lines ?? []).map((l, i) => ({
      _id: `${e._id}-${i}`,
      entryId: e._id,
      first: i === 0,
      date: e.date,
      number: e.number,
      type: t.entryTypes[e.type] ?? e.type,
      status: e.status,
      entryDescription: e.description,
      accountCode: l.accountCode,
      accountName: l.accountName,
      description: l.description,
      debit: l.debit,
      credit: l.credit,
    })),
  )
  return { ...res, items }
}

const list = useList(fetchJournal, () => applied.value)

const columns: Column<JournalRow>[] = [
  { key: 'date', label: t.common.date, format: 'date', width: '6.5rem' },
  { key: 'number', label: t.common.number, width: '8rem' },
  { key: 'type', label: h.entryType, help: h.entryTypeHelp },
  { key: 'accountCode', label: t.common.code },
  { key: 'accountName', label: t.common.account },
  { key: 'description', label: t.common.description, value: (r) => r.description || r.entryDescription },
  { key: 'debit', label: t.common.debit, help: h.debitHelp, format: 'money', total: true, value: (r) => r.debit || null },
  { key: 'credit', label: t.common.credit, help: h.creditHelp, format: 'money', total: true, value: (r) => r.credit || null },
]
</script>

<template>
  <section>
    <PageHeader :subtitle="t.journal.intro" />
    <ReportFilters v-model="filters" :loading="list.loading" @apply="apply">
      <FormField :label="ex.label" :help="ex.help">
        <BaseSwitch v-model="excludeVoided" :label="ex.label" />
      </FormField>
    </ReportFilters>

    <DataTable
      class="journal"
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :totals="totals"
      :fetch-all="list.fetchAll"
      :filters-text="summary"
      :empty-message="t.journal.empty"
      :row-class="(r) => [r.first ? 'is-first' : '', r.status === 'anulado' ? 'is-void' : ''].join(' ')"
      clickable
      landscape
      @update:page="list.page = $event"
      @row-click="(r) => router.push({ name: 'VoucherDetail', params: { id: r.entryId } })"
      @retry="list.reload"
    >
      <template #cell-date="{ row }">{{ row.first ? formatDay(row.date) : '' }}</template>
      <template #cell-number="{ row }"><span class="mono nowrap">{{ row.first ? row.number : '' }}</span></template>
      <template #cell-type="{ row }">{{ row.first ? row.type : '' }}</template>
      <template #cell-accountCode="{ row }"><span class="mono" :class="{ 'is-credit': row.credit && !row.debit }">{{ row.accountCode }}</span></template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.journal {
  :deep(tr.is-first td) {
    border-top: 2px solid $line-strong;
  }

  .nowrap {
    white-space: nowrap;
  }

  .is-credit {
    padding-left: 1.5rem;
  }
}
</style>
