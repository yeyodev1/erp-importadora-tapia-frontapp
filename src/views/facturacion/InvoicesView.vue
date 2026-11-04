<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import SriRowActions from '@/components/sales/SriRowActions.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { salesService, type SalesInvoice } from '@/services/sales.service'
import { useCatalogStore } from '@/stores/catalog'
import { facturacion as t } from '@/config/copy/facturacion'

/** Facturas: listado con filtros, estado SRI y reintento sin entrar al detalle. */
const router = useRouter()
const { canWrite } = useAccess()
const catalog = useCatalogStore()
catalog.ensure('warehouses')

const filters = ref(defaultFilters())
const applied = ref(filterParams(filters.value))
const summary = ref<string[]>([])
const view = reactive({ status: '' as '' | 'vigente' | 'anulado', pending: false })

const list = useList<SalesInvoice>(
  (p) => salesService.list<SalesInvoice>('invoices', p),
  () => ({ ...applied.value, status: view.status || undefined, pending: view.pending ? 'true' : undefined }),
)

function apply(lines: string[]) {
  applied.value = filterParams(filters.value)
  summary.value = lines
}

const statusOptions = [
  { value: '' as const, label: t.invoices.status.all },
  { value: 'vigente' as const, label: t.invoices.status.vigente },
  { value: 'anulado' as const, label: t.invoices.status.anulado },
]

const c = t.cols
const columns: Column<SalesInvoice>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'number', label: c.number, width: '10rem' },
  { key: 'customer.name', label: c.customer },
  { key: 'customer.identification', label: c.identification, width: '9rem' },
  { key: 'warehouse', label: c.warehouse, value: (r) => catalog.warehouseName(r.warehouseId), width: '8rem' },
  { key: 'sellerName', label: c.seller, width: '9rem' },
  { key: 'total', label: t.totals.total, format: 'money', total: true },
  { key: 'balance', label: t.totals.balance, format: 'money', total: true },
  { key: 'sriStatus', label: c.sri, value: (r) => (r.status === 'anulado' ? 'anulado' : r.sriStatus), width: '8rem' },
  { key: 'actions', label: c.actions, screenOnly: true, width: '5rem' },
]

</script>

<template>
  <section>
    <PageHeader>
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="router.push({ name: 'InvoiceNew' })">
        <AppIcon name="plus" /> {{ t.actions.newInvoice }}
      </button>
    </PageHeader>

    <ReportFilters v-model="filters" :fields="['range', 'warehouse', 'party']" party-role="customer" :loading="list.loading" @apply="apply" />

    <DataTable
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :fetch-all="list.fetchAll"
      :filters-text="summary"
      :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)"
      clickable
      landscape
      @update:page="list.page = $event"
      @row-click="router.push({ name: 'InvoiceDetail', params: { id: $event._id } })"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" />
        <BaseSegmented v-model="view.status" :options="statusOptions" />
        <BaseSwitch v-model="view.pending" :label="t.invoices.pending" />
      </template>
      <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
      <template #cell-sriStatus="{ row }">
        <StatusBadge :status="row.status === 'anulado' ? 'anulado' : row.sriStatus || 'pendiente'" />
      </template>
      <template #cell-actions="{ row }"><SriRowActions kind="invoices" :row="row" :can-write="canWrite" /></template>
    </DataTable>
  </section>
</template>
