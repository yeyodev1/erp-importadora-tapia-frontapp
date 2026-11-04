<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { inventoryService, TRANSACTION_TYPES, type InventoryTransaction } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'

/** Transacciones manuales de inventario: compras, importaciones, ajustes, transferencias, inventario inicial. */
const c = copy.common
const t = copy.transactions
const router = useRouter()
const { canWrite } = useAccess()

const typeOptions = TRANSACTION_TYPES.map((value) => ({ value, label: copy.types[value] ?? value }))
const statusOptions = [
  { value: '', label: c.allStatus },
  { value: 'contabilizado', label: c.contabilizado },
  { value: 'anulado', label: c.anulado },
]

const filters = reactive({ ...defaultFilters(), type: '', status: '' })
// La lista consulta con lo aplicado (botón Consultar), no con cada tecla.
const applied = ref({ ...filters })
const summary = ref<string[]>([])
function apply(lines: string[]) {
  applied.value = { ...filters }
  const type = filters.type ? [`${c.type}: ${copy.types[filters.type]}`] : []
  const status = filters.status ? [`${c.status}: ${statusOptions.find((s) => s.value === filters.status)?.label}`] : []
  summary.value = [...lines, ...type, ...status]
}

const list = useList(
  (p) => inventoryService.list(p),
  () => {
    const a = applied.value
    return { type: a.type || undefined, status: a.status || undefined, warehouseId: a.warehouseId || undefined, from: a.from || undefined, to: a.to || undefined }
  },
)

const party = (r: InventoryTransaction) => r.partyId?.name || r.responsible
const warehouses = (r: InventoryTransaction) => [r.warehouseId?.name, r.targetWarehouseId?.name].filter(Boolean).join(' → ')
const columns: Column<InventoryTransaction>[] = [
  { key: 'date', label: t.date, format: 'date', width: '7rem' },
  { key: 'type', label: c.type, value: (r) => copy.types[r.type] ?? r.type },
  { key: 'number', label: t.number, width: '6rem' },
  { key: 'warehouse', label: t.warehouse, value: warehouses },
  { key: 'party', label: t.party, value: party },
  { key: 'totalCost', label: t.total, format: 'money' },
  { key: 'status', label: c.status, width: '8rem' },
]
</script>

<template>
  <section>
    <PageHeader>
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="router.push({ name: 'InventoryTransactionNew' })">
        <AppIcon name="plus" /> {{ t.add }}
      </button>
    </PageHeader>

    <ReportFilters v-model="filters" :fields="['range', 'warehouse']" :loading="list.loading" @apply="apply">
      <FormField :label="c.type" for="tx-type">
        <BaseCombobox id="tx-type" v-model="filters.type" :options="typeOptions" :empty-label="c.allTypes" />
      </FormField>
      <FormField :label="c.status" for="tx-status">
        <BaseSegmented v-model="filters.status" :options="statusOptions" />
      </FormField>
    </ReportFilters>

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
      @row-click="router.push({ name: 'InventoryTransactionDetail', params: { id: $event._id } })"
      @retry="list.reload"
    >
      <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
    </DataTable>
  </section>
</template>
