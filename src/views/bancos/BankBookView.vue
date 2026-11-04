<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { banksService, type BankBook } from '@/services/banks.service'
import { bancos } from '@/config/copy/bancos'
import type { ApiError } from '@/types'

type Row = Partial<BankBook['items'][number]> & { _id: string; balance: number }

const t = bancos.book
const filters = ref(defaultFilters())
const summary = ref<string[]>([])
const rows = ref<Row[]>([])
const loading = ref(false)
const error = ref('')
const ran = ref(false)

async function run(lines: string[]) {
  error.value = ''
  if (!filters.value.bankAccountId || !filters.value.from || !filters.value.to) {
    error.value = t.pickBank
    return
  }
  loading.value = true
  try {
    const book = await banksService.book(filters.value.bankAccountId, filters.value.from, filters.value.to)
    // El saldo anterior va como primera fila: así sale igual en pantalla, Excel e impresión.
    rows.value = [{ _id: 'opening', description: t.opening, balance: book.opening }, ...book.items]
    summary.value = lines
    ran.value = true
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}

const sign = (r: Row, dir: 'in' | 'out') => (r.direction === dir ? r.amount : null)
const columns: Column<Row>[] = [
  { key: 'date', label: t.cols.date, format: 'date', width: '7rem' },
  { key: 'type', label: t.cols.type, value: (r) => (r.type ? bancos.movType(r.type) : '') },
  { key: 'checkNumber', label: t.cols.check, width: '5rem' },
  { key: 'doc', label: t.cols.doc, value: (r) => r.source?.docNumber ?? '' },
  { key: 'description', label: t.cols.description },
  { key: 'inflow', label: t.cols.inflow, format: 'money', total: true, value: (r) => sign(r, 'in') },
  { key: 'outflow', label: t.cols.outflow, format: 'money', total: true, value: (r) => sign(r, 'out') },
  { key: 'balance', label: t.cols.balance, format: 'money' },
]
</script>

<template>
  <section>
    <PageHeader />
    <ReportFilters v-model="filters" :fields="['range', 'bankAccount']" :loading="loading" @apply="run" />
    <EmptyState v-if="!ran && !loading" :message="error || t.pickBank" />
    <DataTable
      v-else
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      :filters-text="summary"
      landscape
      :row-class="(r) => (r._id === 'opening' ? 'is-opening' : undefined)"
    />
  </section>
</template>

<style scoped lang="scss">
:deep(tr.is-opening td) {
  font-weight: 600;
  background: $sand;
}
</style>
