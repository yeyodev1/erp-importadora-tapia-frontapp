<script setup lang="ts">
import { computed, ref } from 'vue'
import StatChips from '@/components/accounting/StatChips.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import NoticeList from './NoticeList.vue'
import { migration } from '@/config/copy/migration'
import type { MacioInvoiceRow, MacioPreview, MacioProductRow } from '@/types'

/** Lo que trae el archivo de Macio, en cifras de control y tablas. Nada de esto está grabado aún. */
const props = defineProps<{ preview: MacioPreview }>()
const m = migration
const k = m.cols

type Tab = 'products' | 'invoices' | 'sellers' | 'invalid' | 'unmatched'
const tab = ref<Tab>('products')
const tabs = computed(() => [
  { value: 'invoices' as Tab, label: m.tabs.invoices, count: props.preview.counts.invoices },
  { value: 'products' as Tab, label: m.tabs.products, count: props.preview.counts.products },
  { value: 'sellers' as Tab, label: m.tabs.sellers, count: props.preview.counts.sellers },
  { value: 'invalid' as Tab, label: m.tabs.invalid, count: props.preview.counts.invalidIds },
  { value: 'unmatched' as Tab, label: m.tabs.unmatched, count: props.preview.counts.unmatchedInvoices },
])

const stats = computed(() => {
  const { counts: n, totals } = props.preview
  const s = m.stats
  return [
    { label: s.clients, value: n.clientRows, money: false },
    { label: s.newClients, value: n.newClients, money: false },
    { label: s.existingClients, value: n.existingClients, money: false },
    { label: s.invalidIds, value: n.invalidIds, money: false },
    { label: s.sellers, value: n.sellers, money: false },
    { label: s.products, value: n.products, money: false },
    { label: s.stockLines, value: n.stockLines, money: false },
    { label: s.invoices, value: n.invoices, money: false },
    { label: s.receivables, value: totals.receivables },
    { label: s.unmatched, value: n.unmatchedInvoices, money: false },
    { label: s.creditNotes, value: totals.creditNotes },
  ]
})

const col = (key: string, f: { label: string; help: string }, extra: Partial<Column> = {}): Column => ({ key, label: f.label, help: f.help, ...extra })
const productCols: Column<MacioProductRow>[] = [
  col('code', k.code, { width: '6rem' }),
  col('name', k.name),
  col('unit', k.unit),
  col('group', k.group),
  col('status', k.status, { value: (r) => (r.status === 'conflicto' ? `${r.status}: ${r.existingName}` : r.status) }),
  col('gye', k.gye, { format: 'qty', total: true }),
  col('uio', k.uio, { format: 'qty', total: true }),
]
const invoiceCols: Column<MacioInvoiceRow>[] = [
  col('number', k.number),
  col('customer', k.customer),
  col('identification', k.identification),
  col('date', k.date, { format: 'date' }),
  col('dueDate', k.dueDate, { format: 'date' }),
  col('total', k.total, { format: 'money', total: true }),
  col('paid', k.paid, { format: 'money', total: true }),
  col('balance', k.balance, { format: 'money', total: true }),
]
const sellerCols: Column[] = [col('code', k.code, { width: '6rem' }), col('name', k.name), col('customers', k.customers, { format: 'int', total: true })]
const invalidCols: Column[] = [col('identification', k.identification), col('name', k.name), col('idType', k.idType), col('problem', k.problem)]
const unmatchedCols: Column[] = [col('number', k.number), col('customer', k.customer), col('balance', k.balance, { format: 'money', total: true })]
</script>

<template>
  <section class="mp">
    <StatChips :items="stats" />
    <NoticeList level="danger" :title="m.blockersTitle" :items="preview.blockers" />
    <NoticeList level="info" :title="m.noticesTitle" :items="preview.notices" />
    <NoticeList level="warning" :title="m.warningsTitle" :items="preview.warnings" />

    <BaseSegmented v-model="tab" :options="tabs" tabs />
    <DataTable v-if="tab === 'invoices'" :columns="invoiceCols" :rows="preview.invoices" row-key="number" :title="m.tabs.invoices" :row-class="(r) => (r.ambiguous ? 'is-warning' : undefined)" />
    <DataTable v-else-if="tab === 'products'" :columns="productCols" :rows="preview.products" row-key="code" :title="m.tabs.products">
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /> <small v-if="row.existingName && row.status === 'conflicto'">{{ row.existingName }}</small></template>
    </DataTable>
    <DataTable v-else-if="tab === 'sellers'" :columns="sellerCols" :rows="preview.sellers" row-key="code" :title="m.tabs.sellers" />
    <DataTable v-else-if="tab === 'invalid'" :columns="invalidCols" :rows="preview.invalidClients" row-key="macioCode" :title="m.tabs.invalid" />
    <DataTable v-else :columns="unmatchedCols" :rows="preview.unmatchedInvoices" row-key="number" :title="m.tabs.unmatched" />
  </section>
</template>

<style scoped lang="scss">
.mp {
  @include flex(column, stretch, flex-start, 0.5rem);
}
</style>
