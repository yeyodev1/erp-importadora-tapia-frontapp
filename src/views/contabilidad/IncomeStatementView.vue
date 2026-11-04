<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/accounting/useReport'
import { statementColumns, totalRow, treeRowClass, type StatementRow } from '@/composables/accounting/tree'
import { accountingService, type IncomeStatement } from '@/services/accounting.service'
import { todayISO } from '@/utils/format'
import { formatMoney } from '@/utils/money'
import { accounting as t } from '@/config/copy/accounting'

/** Estado de resultados del rango (árbol de 4 y 5) y margen por grupo de producto. */
const c = t.income
const filters = ref(defaultFilters({ from: `${todayISO().slice(0, 4)}-01-01` }))
const summary = ref<string[]>([])
const report = useReport(() => accountingService.incomeStatement({ from: filters.value.from || undefined, to: filters.value.to || undefined }))
const data = report.data
report.run()

function apply(lines: string[]) {
  summary.value = lines
  report.run()
}

const rows = computed<StatementRow[]>(() => {
  const d = data.value
  if (!d) return []
  return [
    ...d.income.rows,
    totalRow(c.totalIncome, d.income.total),
    ...d.costsAndExpenses.rows,
    totalRow(c.totalCosts, d.costsAndExpenses.total),
    totalRow(c.utility, d.utility),
  ]
})

type GroupRow = IncomeStatement['byProductGroup'][number]
const groupColumns: Column<GroupRow>[] = [
  { key: 'group', label: c.group },
  { key: 'sales', label: c.sales, format: 'money', total: true },
  { key: 'cost', label: c.cost, format: 'money', total: true },
  { key: 'grossMargin', label: c.margin, format: 'money', total: true },
]
</script>

<template>
  <section class="is">
    <PageHeader :subtitle="c.intro" />
    <ReportFilters v-model="filters" :loading="report.loading.value" @apply="apply" />

    <DataTable
      class="tree"
      :columns="statementColumns(t.common.amount)"
      :rows="rows"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="summary"
      :row-class="treeRowClass"
      @retry="report.run"
    >
      <template #toolbar>
        <span v-if="data" class="is__utility" :class="{ 'is-loss': data.utility < 0 }">{{ c.utility }}: <strong class="num">{{ formatMoney(data.utility) }}</strong></span>
        <HelpTip v-if="data" :text="data.signConvention" />
      </template>
    </DataTable>

    <h2 class="is__title">{{ c.byGroup }}</h2>
    <DataTable :columns="groupColumns" :rows="data?.byProductGroup ?? []" row-key="group" :loading="report.loading.value" :title="`Estado de resultados ${c.byGroup.toLowerCase()}`" :filters-text="summary" />
  </section>
</template>

<style scoped lang="scss">
.is {
  &__title {
    margin: 1.25rem 0 0.5rem;
    font-size: $text-base;
  }

  &__utility {
    font-size: $text-sm;
  }

  .is-loss strong {
    color: $danger;
  }
}

.tree :deep(tr.is-group td) {
  font-weight: 600;
}

.tree :deep(tr.is-total td) {
  font-weight: 700;
  background: $paper;
}
</style>
