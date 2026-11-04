<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/inventory/useReport'
import { inventoryService, type NegativeRow } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'

/** Momentos en que el kardex quedó con saldo negativo (ajustes forzados, datos migrados). */
const c = copy.common
const t = copy.negatives
// Sin fecha de inicio por defecto: un negativo viejo sigue siendo un problema.
const filters = ref(defaultFilters({ from: '' }))
const report = useReport(() => inventoryService.negatives(filterParams(filters.value)))
onMounted(() => report.run())

const columns: Column<NegativeRow>[] = [
  { key: 'date', label: copy.transactions.date, format: 'date', width: '7rem' },
  { key: 'warehouse', label: t.warehouse, value: (r) => r.warehouseId?.name },
  { key: 'code', label: c.code, value: (r) => r.productId?.code, width: '6rem' },
  { key: 'product', label: c.product, value: (r) => r.productId?.name },
  { key: 'type', label: t.movement, value: (r) => copy.movements[r.type] ?? r.type },
  { key: 'number', label: t.number, value: (r) => r.source?.docNumber },
  { key: 'qty', label: c.qty, format: 'qty' },
  { key: 'balanceQty', label: t.balance, format: 'qty' },
  { key: 'unit', label: c.unit, value: (r) => r.productId?.unit },
]
</script>

<template>
  <section>
    <PageHeader />
    <ReportFilters v-model="filters" :fields="['range', 'warehouse']" :loading="report.loading" @apply="report.run" />
    <DataTable
      :columns="columns"
      :rows="report.data?.items ?? []"
      :loading="report.loading"
      :error="report.error"
      :filters-text="report.summary"
      landscape
      @retry="report.run()"
    />
  </section>
</template>
