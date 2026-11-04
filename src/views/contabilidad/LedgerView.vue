<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import LedgerAccountPicker from '@/components/accounting/LedgerAccountPicker.vue'
import { defaultFilters } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/accounting/useReport'
import { accountingService, type LedgerMovement } from '@/services/accounting.service'
import { accounting as t } from '@/config/copy/accounting'

/**
 * Libro mayor. Acepta ?account=&from=&to= para abrirlo desde el Reporte de
 * saldos. La primera fila es el saldo anterior; clic en un movimiento abre su comprobante.
 */
type Row = Partial<LedgerMovement> & { _id: string; balance: number }

const route = useRoute()
const router = useRouter()
const q = route.query
const filters = ref(defaultFilters({ ...(q.from ? { from: String(q.from) } : {}), ...(q.to ? { to: String(q.to) } : {}) }))
const account = ref(String(q.account ?? ''))
const excludeVoided = ref(false)
const summary = ref<string[]>([])
const tried = ref(false)

const report = useReport(() =>
  accountingService.ledger({ account: account.value, from: filters.value.from || undefined, to: filters.value.to || undefined, excludeVoided: excludeVoided.value || undefined }),
)
const data = report.data

function apply(lines: string[]) {
  tried.value = true
  if (!account.value) return
  summary.value = lines
  report.run().then(() => {
    const a = data.value?.account
    if (a) summary.value = [`${t.common.account}: ${a.code} ${a.name}`, ...lines]
  })
}
onMounted(() => account.value && apply([]))

const isMayor = computed(() => data.value?.account.kind === 'mayor')
const rows = computed<Row[]>(() => {
  const d = data.value
  if (!d) return []
  return [{ _id: 'prev', description: t.ledger.previousRow, balance: d.previousBalance }, ...d.movements.map((m, i) => ({ ...m, _id: `${m.entryId}-${i}` }))]
})
const totals = computed(() => (data.value ? { debit: data.value.totalDebit, credit: data.value.totalCredit, balance: data.value.balance } : undefined))

const columns = computed<Column<Row>[]>(() => [
  { key: 'type', label: t.common.type, value: (r) => (r.type ? (t.entryTypes[r.type] ?? r.type) : '') },
  { key: 'number', label: t.common.number },
  { key: 'date', label: t.common.date, format: 'date' },
  ...(isMayor.value ? [{ key: 'accountCode', label: t.common.code } as Column<Row>] : []),
  { key: 'party', label: t.common.party },
  { key: 'debit', label: t.common.debit, format: 'money', total: true, value: (r) => r.debit || null },
  { key: 'credit', label: t.common.credit, format: 'money', total: true, value: (r) => r.credit || null },
  { key: 'balance', label: t.common.balance, format: 'money', total: true },
  { key: 'description', label: t.common.description },
])

function open(row: Row) {
  if (row.entryId) router.push({ name: 'VoucherDetail', params: { id: row.entryId } })
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.ledger.intro" />
    <ReportFilters v-model="filters" :loading="report.loading.value" @apply="apply">
      <FormField v-bind="t.ledger.account" for="lg-account" required>
        <LedgerAccountPicker id="lg-account" v-model="account" :invalid="tried && !account" />
      </FormField>
      <FormField :label="t.vouchers.fields.excludeVoided.label" :help="t.vouchers.fields.excludeVoided.help">
        <BaseSwitch v-model="excludeVoided" :label="t.vouchers.fields.excludeVoided.label" />
      </FormField>
    </ReportFilters>

    <EmptyState v-if="!data && !report.loading.value && !report.error.value" :message="t.ledger.pick" />
    <DataTable
      v-else
      :columns="columns"
      :rows="rows"
      :loading="report.loading.value"
      :error="report.error.value"
      :totals="totals"
      :title="data ? `Libro mayor · ${data.account.code} ${data.account.name}` : undefined"
      :filters-text="summary"
      :row-class="(r) => (r._id === 'prev' ? 'is-prev' : r.status === 'anulado' ? 'is-void' : undefined)"
      clickable
      landscape
      @row-click="open"
      @retry="report.run"
    >
      <template #cell-number="{ row }"><span class="mono nowrap">{{ row.number }}</span></template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.nowrap {
  white-space: nowrap;
}

:deep(tr.is-prev td) {
  font-weight: 600;
  background: $paper;
}
</style>
