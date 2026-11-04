<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import StockFilters from '@/components/inventory/StockFilters.vue'
import { defaultStockFilters, stockParams } from '@/components/inventory/stockFilters'
import { useReport } from '@/composables/inventory/useReport'
import { useAccess } from '@/composables/useAccess'
import { inventoryService, type StockRow } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'
import { roundQty } from '@/utils/money'

/** Saldos por bodega en las dos unidades; valorizado (costo promedio y total) a pedido. */
const c = copy.common
const t = copy.balances
const { role } = useAccess()
// Bodega cuenta sacos, no maneja costos (el API tampoco los expone sin `valued`).
const canValue = computed(() => role.value !== 'bodega')

const filters = reactive(defaultStockFilters())
const valued = ref(false)
const includeZero = ref(false)
const report = useReport(
  () => inventoryService.balances({ ...stockParams(filters), valued: valued.value, includeZero: includeZero.value }),
  () => (filters.warehouseId ? null : c.warehouseRequired),
)
onMounted(() => filters.warehouseId && report.run())

const shownValued = computed(() => Boolean(report.data?.items[0] && 'avgCost' in report.data.items[0]))
const columns = computed<Column<StockRow>[]>(() => [
  { key: 'code', label: c.code, width: '6rem' },
  { key: 'name', label: c.product },
  { key: 'group', label: c.group, value: (r) => [r.group, r.subgroup].filter(Boolean).join(' / ') },
  { key: 'qty', label: c.qty, format: 'qty' },
  { key: 'unit', label: c.unit },
  { key: 'purchaseQty', label: c.purchaseQty, format: 'qty', value: (r) => roundQty(r.qty / (r.purchaseUnit?.factor || 1)) },
  { key: 'purchaseUnit', label: c.purchaseUnit, value: (r) => r.purchaseUnit?.name },
  ...(shownValued.value
    ? ([
        // Costo unitario en dólares con 4 decimales (el API lo guarda con 6): no es un monto en centavos.
        { key: 'avgCost', label: t.avgCost, format: 'qty' },
        { key: 'totalValue', label: t.totalValue, format: 'money', total: true },
      ] as Column<StockRow>[])
    : []),
])
const title = computed(() => (report.data ? `Saldos ${shownValued.value ? 'valorizados ' : ''}· ${report.data.warehouse.name}` : undefined))
</script>

<template>
  <section>
    <PageHeader />
    <StockFilters v-model="filters" :loading="report.loading" @apply="report.run">
      <div class="switches">
        <BaseSwitch v-if="canValue" v-model="valued" :label="t.valued" :hint="t.valuedHint" />
        <BaseSwitch v-model="includeZero" :label="t.includeZero" />
      </div>
    </StockFilters>
    <DataTable
      :columns="columns"
      :rows="report.data?.items ?? []"
      row-key="productId"
      :loading="report.loading"
      :error="report.error"
      :title="title"
      :filters-text="report.summary"
      landscape
      @retry="report.run()"
    />
  </section>
</template>

<style scoped lang="scss">
.switches {
  @include flex(column, flex-start, center, 0.4rem);
}
</style>
