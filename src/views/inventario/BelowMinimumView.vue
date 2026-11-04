<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { stockRow } from '@/components/table/indicators'
import StockFilters from '@/components/inventory/StockFilters.vue'
import { defaultStockFilters, stockParams } from '@/components/inventory/stockFilters'
import { useReport } from '@/composables/inventory/useReport'
import { inventoryService, type StockRow } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'
import { roundQty } from '@/utils/money'
import { useCatalogStore } from '@/stores/catalog'

/** Productos con mínimo configurado cuyo saldo en la bodega está por debajo: lo que hay que pedir. */
const c = copy.common
const t = copy.belowMinimum
const filters = reactive(defaultStockFilters())
const report = useReport(
  () => inventoryService.belowMinimum(stockParams(filters)),
  () => (filters.warehouseId ? null : c.warehouseRequired),
)
// Sin bodega en la sesión (gerencia) abre en la primera: el aviso de la campana no debe llegar a una tabla vacía.
const catalog = useCatalogStore()
onMounted(async () => {
  if (!filters.warehouseId) await catalog.ensure('warehouses').catch(() => {})
  filters.warehouseId ||= catalog.warehouses.find((w) => w.isActive)?._id ?? ''
  if (filters.warehouseId) report.run()
})

const columns: Column<StockRow>[] = [
  { key: 'code', label: c.code, width: '6rem', help: c.codeHelp },
  { key: 'name', label: c.product },
  { key: 'group', label: c.group, value: (r) => [r.group, r.subgroup].filter(Boolean).join(' / ') },
  { key: 'unit', label: c.unit },
  { key: 'minQty', label: t.minQty, format: 'qty', help: t.minQtyHelp },
  { key: 'qty', label: c.qty, format: 'qty-stock', min: (r) => r.minQty, help: c.qtyHelp },
  { key: 'missing', label: t.missing, format: 'qty', help: t.missingHelp },
  { key: 'missingPurchase', label: t.missingPurchase, format: 'qty', help: t.missingPurchaseHelp, value: (r) => roundQty((r.missing ?? 0) / (r.purchaseUnit?.factor || 1)) },
  { key: 'purchaseUnit', label: c.purchaseUnit, value: (r) => r.purchaseUnit?.name },
]
const title = computed(() => (report.data ? `Stock bajo el mínimo · ${report.data.warehouse.name}` : undefined))
</script>

<template>
  <section>
    <PageHeader :subtitle="copy.pages.belowMinimum" />
    <StockFilters v-model="filters" :loading="report.loading" @apply="report.run" />
    <DataTable
      :columns="columns"
      :rows="report.data?.items ?? []"
      row-key="productId"
      :row-class="(r) => stockRow(r.qty, r.minQty)"
      :loading="report.loading"
      :error="report.error"
      :title="title"
      :filters-text="report.summary"
      :empty-message="t.empty"
      landscape
      @retry="report.run()"
    />
  </section>
</template>
