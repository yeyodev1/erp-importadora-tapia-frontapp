<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import { overdueRow, sriRow } from '@/components/table/indicators'
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
// `?sriStatus=devuelto|sin_firma` (campana): el filtro vive en la URL para poder quitarlo.
const route = useRoute()
const sriStatus = computed({
  get: () => (route.query.sriStatus === 'devuelto' || route.query.sriStatus === 'sin_firma' ? route.query.sriStatus : ''),
  set: (v: string) => router.replace({ query: { ...route.query, sriStatus: v || undefined } }),
})
const sriOptions = ['', 'devuelto', 'sin_firma'].map((value) => ({ value, label: t.sriFilter.options[value]!, help: t.sriFilter.help[value] }))

const list = useList<SalesInvoice>(
  (p) => salesService.list<SalesInvoice>('invoices', p),
  // Con filtro SRI se ven todas las fechas: la campana cuenta los pendientes de cualquier mes.
  () => ({ ...applied.value, ...(sriStatus.value ? { from: undefined, to: undefined } : {}), status: view.status || undefined, pending: view.pending ? 'true' : undefined, sriStatus: sriStatus.value || undefined }),
)

function apply(lines: string[]) {
  applied.value = filterParams(filters.value)
  summary.value = lines
}

const statusOptions = [
  { value: '' as const, label: t.invoices.status.all, help: t.invoices.statusHelp.all },
  { value: 'vigente' as const, label: t.invoices.status.vigente, help: t.invoices.statusHelp.vigente },
  { value: 'anulado' as const, label: t.invoices.status.anulado, help: t.invoices.statusHelp.anulado },
]

// Atraso solo de lo que aún se debe: una factura pagada o anulada no está vencida.
const openDue = (r: SalesInvoice) => (r.status === 'vigente' && r.balance > 0 ? r.dueDate : null)
const rowClass = (r: SalesInvoice) => (r.status === 'anulado' ? 'is-void' : (sriRow(r.sriStatus) ?? overdueRow(openDue(r))))

const c = t.cols
const columns: Column<SalesInvoice>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'number', label: c.number, width: '10rem' },
  { key: 'customer.name', label: c.customer },
  { key: 'customer.identification', label: c.identification, width: '9rem' },
  { key: 'warehouse', label: c.warehouse, value: (r) => catalog.warehouseName(r.warehouseId), width: '8rem' },
  { key: 'sellerName', label: c.seller, width: '9rem' },
  { key: 'total', label: t.totals.total, format: 'money', total: true },
  { key: 'balance', label: t.totals.balance, help: t.colHelp.balance, format: 'money', total: true },
  { key: 'overdue', label: t.invoices.overdue, help: t.invoices.overdueHelp, format: 'days-overdue', width: '7rem', value: openDue },
  { key: 'sriStatus', label: c.sri, help: t.colHelp.sri, value: (r) => (r.status === 'anulado' ? 'anulado' : r.sriStatus), width: '8rem' },
  { key: 'actions', label: c.actions, screenOnly: true, width: '5rem' },
]

</script>

<template>
  <section>
    <PageHeader :subtitle="t.pages.invoices.subtitle">
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
      :empty-message="t.pages.invoices.empty"
      :row-class="rowClass"
      clickable
      landscape
      @update:page="list.page = $event"
      @row-click="router.push({ name: 'InvoiceDetail', params: { id: $event._id } })"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" />
        <BaseSegmented v-model="view.status" :options="statusOptions" :label="t.cols.status" />
        <BaseSegmented v-model="sriStatus" :options="sriOptions" :label="t.sriFilter.label" />
        <BaseSwitch v-model="view.pending" :label="t.invoices.pending" :help="t.invoices.pendingHelp" />
      </template>
      <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
      <template #cell-sriStatus="{ row }">
        <StatusBadge :status="row.status === 'anulado' ? 'anulado' : row.sriStatus || 'pendiente'" />
      </template>
      <template #cell-actions="{ row }"><SriRowActions kind="invoices" :row="row" :can-write="canWrite" /></template>
    </DataTable>
  </section>
</template>
