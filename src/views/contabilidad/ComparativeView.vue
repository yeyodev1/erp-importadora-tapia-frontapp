<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import DataTable from '@/components/table/DataTable.vue'
import PeriodBar from '@/components/accounting/PeriodBar.vue'
import type { Column } from '@/components/table/columns'
import { currentMonth, monthLabel, monthOptions, useReport } from '@/composables/accounting/useReport'
import { indentName, treeRowClass } from '@/composables/accounting/tree'
import { accountingService, type ComparativeRow } from '@/services/accounting.service'
import { shiftMonth } from '@/utils/format'
import { accounting as t } from '@/config/copy/accounting'

/** Comparativo de saldos acumulados al cierre de dos meses (B − A). */
const c = t.comparative
const periodB = ref(currentMonth())
const periodA = ref(shiftMonth(periodB.value, -12))
const filter = ref<'todas' | 'mayor'>('mayor')
const months = monthOptions(60)

const report = useReport(() => accountingService.comparative({ periodA: periodA.value, periodB: periodB.value, filter: filter.value }))
const data = report.data
report.run()

const columns = computed<Column<ComparativeRow>[]>(() => [
  { key: 'code', label: t.common.code, width: '10rem' },
  { key: 'name', label: t.common.name, value: indentName },
  { key: 'balanceA', label: monthLabel(data.value?.periodA ?? periodA.value), format: 'money' },
  { key: 'balanceB', label: monthLabel(data.value?.periodB ?? periodB.value), format: 'money' },
  { key: 'difference', label: c.difference, format: 'money' },
])
const filtersText = computed(() => (data.value ? [`${monthLabel(data.value.periodA)} vs. ${monthLabel(data.value.periodB)}`] : []))
</script>

<template>
  <section>
    <PageHeader :subtitle="c.intro" />
    <PeriodBar id="cmp-b" v-model="periodB" :field="c.periodB" :loading="report.loading.value" @submit="report.run">
      <FormField v-bind="c.periodA" for="cmp-a">
        <BaseCombobox id="cmp-a" v-model="periodA" :options="months" />
      </FormField>
      <FormField v-bind="t.trial.filter">
        <BaseSegmented v-model="filter" :options="t.trial.filters" :label="t.trial.filter.label" />
      </FormField>
    </PeriodBar>

    <DataTable
      class="tree"
      :columns="columns"
      :rows="data?.rows ?? []"
      row-key="code"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="filtersText"
      :row-class="treeRowClass"
      landscape
      @retry="report.run"
    />
  </section>
</template>

<style scoped lang="scss">
.tree :deep(tr.is-group td) {
  font-weight: 600;
}
</style>
