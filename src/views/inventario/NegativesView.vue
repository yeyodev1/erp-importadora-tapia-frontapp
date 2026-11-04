<script setup lang="ts">
import { onMounted, ref } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/inventory/useReport'
import { inventoryService, type NegativeRow } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'
import { formatDay } from '@/utils/format'

/** Momentos en que el kardex quedó con saldo negativo (ajustes forzados, datos migrados). */
const c = copy.common
const t = copy.negatives
// Sin "Desde": un negativo viejo sigue siendo un problema. Solo se elige hasta cuándo.
const filters = ref(defaultFilters({ from: '' }))
const report = useReport(() => inventoryService.negatives(filterParams(filters.value)))
const run = (summary: string[] = []) => report.run([`${t.to.label} ${formatDay(filters.value.to)}`, ...summary])
onMounted(() => run())

const columns: Column<NegativeRow>[] = [
  { key: 'date', label: copy.transactions.date, format: 'date', width: '7rem' },
  { key: 'warehouse', label: t.warehouse, value: (r) => r.warehouseId?.name },
  { key: 'code', label: c.code, value: (r) => r.productId?.code, width: '6rem' },
  { key: 'product', label: c.product, value: (r) => r.productId?.name },
  { key: 'type', label: t.movement, value: (r) => copy.movements[r.type] ?? r.type },
  { key: 'number', label: t.number, value: (r) => r.source?.docNumber },
  { key: 'qty', label: c.qty, format: 'qty', help: t.qtyHelp },
  { key: 'balanceQty', label: t.balance, format: 'qty-stock', help: t.balanceHelp },
  { key: 'unit', label: c.unit, value: (r) => r.productId?.unit },
]
</script>

<template>
  <section>
    <PageHeader :subtitle="copy.pages.negatives" />
    <ReportFilters v-model="filters" :fields="['warehouse']" :loading="report.loading" @apply="run">
      <FormField v-bind="t.to" for="neg-to" class="narrow">
        <BaseDatePicker id="neg-to" v-model="filters.to" />
      </FormField>
    </ReportFilters>
    <DataTable
      :columns="columns"
      :rows="report.data?.items ?? []"
      :loading="report.loading"
      :error="report.error"
      :row-class="() => 'is-danger'"
      :filters-text="report.summary"
      :empty-message="t.empty"
      landscape
      @retry="report.run()"
    />
  </section>
</template>
