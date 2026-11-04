<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import BarChart from '@/components/sales/BarChart.vue'
import { salesService, type TopProduct } from '@/services/sales.service'
import { useCatalogStore } from '@/stores/catalog'
import { formatMoney, formatQty } from '@/utils/money'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'

/** Más vendidos por cantidad o por valor (base neta, sin anuladas), top N, con gráfico de barras. */
const catalog = useCatalogStore()
catalog.ensure('productGroups')

const filters = ref(defaultFilters())
const opts = reactive({ by: 'qty' as 'qty' | 'value', limit: 20 as number | null, groupId: '' })
const items = ref<TopProduct[]>([])
const summary = ref<string[]>([])
const loading = ref(false)
const error = ref('')
let lastLines: string[] = []

const c = t.cols
const byOptions = [
  { value: 'qty' as const, label: t.top.by.qty, help: t.top.byHelp.qty },
  { value: 'value' as const, label: t.top.by.value, help: t.top.byHelp.value },
]
const groups = computed(() => catalog.productGroups.map((g) => ({ value: g._id, label: g.name })))
const columns: Column<TopProduct>[] = [
  { key: 'rank', label: c.rank, help: t.colHelp.rank, value: (r) => items.value.indexOf(r) + 1, format: 'int', width: '3rem' },
  { key: 'code', label: c.code, width: '6rem' },
  { key: 'name', label: c.product },
  { key: 'qty', label: c.qty, format: 'qty', total: true },
  { key: 'value', label: c.value, help: t.colHelp.value, format: 'money', total: true },
  { key: 'invoices', label: c.count, help: t.colHelp.count, format: 'int' },
]
const bars = computed(() =>
  items.value.map((i) => ({
    label: `${i.code} · ${i.name}`,
    value: opts.by === 'qty' ? i.qty : i.value,
    text: opts.by === 'qty' ? formatQty(i.qty) : formatMoney(i.value),
  })),
)

async function run(lines: string[] = lastLines) {
  lastLines = lines
  const limit = Math.max(1, Math.round(Number(opts.limit) || 20))
  summary.value = [`${t.top.by[opts.by]} · ${t.fields.limit.label} ${limit}`, ...lines]
  loading.value = true
  error.value = ''
  try {
    const res = await salesService.topProducts({ ...filterParams(filters.value), by: opts.by, limit, groupId: opts.groupId || undefined })
    items.value = res.items
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}

watch(() => opts.by, () => run())
</script>

<template>
  <section>
    <PageHeader :subtitle="t.pages.topProducts.subtitle" />
    <ReportFilters v-model="filters" :fields="['range', 'warehouse', 'party']" party-role="customer" :loading="loading" @apply="run">
      <FormField v-bind="t.fields.group" for="tp-group">
        <BaseCombobox id="tp-group" v-model="opts.groupId" :options="groups" :empty-label="t.fields.all" />
      </FormField>
      <FormField v-bind="t.fields.limit" for="tp-limit" class="narrow">
        <input id="tp-limit" v-model.number="opts.limit" inputmode="numeric" class="num" :placeholder="t.placeholders.limit" />
      </FormField>
    </ReportFilters>

    <BaseSegmented v-model="opts.by" class="tp__by" :options="byOptions" :label="t.top.chart" />
    <BarChart v-if="items.length" :items="bars" :title="t.top.by[opts.by]" />

    <DataTable :columns="columns" :rows="items" row-key="productId" :loading="loading" :error="error" :filters-text="summary" :empty-message="t.pages.topProducts.empty" @retry="run()" />
  </section>
</template>

<style scoped lang="scss">
.tp__by {
  margin-bottom: 0.75rem;
}
</style>
