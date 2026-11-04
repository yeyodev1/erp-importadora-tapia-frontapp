<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import PeriodBar from '@/components/accounting/PeriodBar.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { currentMonth, monthEndLong, monthLabel, useReport } from '@/composables/accounting/useReport'
import { indentName, treeRowClass } from '@/composables/accounting/tree'
import { accountingService, type TrialRow } from '@/services/accounting.service'
import { accounting as t } from '@/config/copy/accounting'
import { accountingScreens } from '@/config/copy/accountingScreens'

/** "Reporte de saldos" (balance de comprobación) en árbol; clic en una cuenta abre su mayor. */
const tb = t.trial
const h = accountingScreens.columns
const modes = tb.modes.map((m) => ({ ...m, help: tb.modeHelp[m.value] }))
const filters = tb.filters.map((f) => ({ ...f, help: tb.filterHelp[f.value] }))
const router = useRouter()
const period = ref(currentMonth())
const mode = ref<'acumulado' | 'mensual'>('acumulado')
const filter = ref<'todas' | 'mayor'>('todas')

const report = useReport(() => accountingService.trialBalance({ period: period.value, mode: mode.value, filter: filter.value }))
const data = report.data
report.run()

const title = computed(() => tb.printTitle.replace('{date}', monthEndLong(data.value?.period ?? period.value)))
const filtersText = computed(() => {
  const d = data.value
  if (!d) return []
  return [`${tb.modes.find((m) => m.value === d.mode)?.label} · ${monthLabel(d.period)} · ${tb.filters.find((f) => f.value === filter.value)?.label}`]
})

const columns: Column<TrialRow>[] = [
  { key: 'code', label: t.common.code, width: '10rem' },
  { key: 'name', label: t.common.name, value: indentName },
  { key: 'previous', label: t.common.previous, help: tb.previousHelp, format: 'amount-signed', total: true },
  { key: 'debit', label: t.common.debit, help: h.debitHelp, format: 'money', total: true },
  { key: 'credit', label: t.common.credit, help: h.creditHelp, format: 'money', total: true },
  { key: 'balance', label: t.common.balance, help: h.balanceHelp, format: 'amount-signed', total: true },
]

function openLedger(row: TrialRow) {
  const d = data.value
  if (d) router.push({ name: 'Ledger', query: { account: row.code, from: d.from, to: d.to } })
}
</script>

<template>
  <section>
    <PageHeader :subtitle="tb.intro" />
    <PeriodBar v-model="period" :field="tb.periodField" :loading="report.loading.value" @submit="report.run">
      <FormField v-bind="tb.modeField">
        <BaseSegmented v-model="mode" :options="modes" :label="tb.modeField.label" />
      </FormField>
      <FormField v-bind="tb.filterField">
        <BaseSegmented v-model="filter" :options="filters" :label="tb.filterField.label" />
      </FormField>
    </PeriodBar>

    <DataTable
      class="tree"
      :columns="columns"
      :rows="data?.rows ?? []"
      row-key="code"
      :loading="report.loading.value"
      :error="report.error.value"
      :totals="data?.totals"
      :title="title"
      :filters-text="filtersText"
      :row-class="treeRowClass"
      :empty-message="tb.empty"
      clickable
      landscape
      @row-click="openLedger"
      @retry="report.run"
    >
      <template #toolbar>
        <BaseBadge v-if="data" :tone="data.cuadra ? 'success' : 'danger'">
          <AppIcon :name="data.cuadra ? 'check-circle' : 'alert'" /> {{ data.cuadra ? t.common.cuadra : t.common.noCuadra }}
        </BaseBadge>
        <span v-if="data" class="tb__range">{{ title }}</span>
      </template>
      <template #cell-code="{ row }"><span class="mono">{{ row.code }}</span></template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.tb {
  &__range {
    font-size: $text-sm;
    color: $ink-muted;
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
