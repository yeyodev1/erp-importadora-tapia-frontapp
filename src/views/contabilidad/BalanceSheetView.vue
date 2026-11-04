<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import DataTable from '@/components/table/DataTable.vue'
import { useReport } from '@/composables/accounting/useReport'
import { statementColumns, totalRow, treeRowClass, type StatementRow } from '@/composables/accounting/tree'
import { accountingService } from '@/services/accounting.service'
import { formatDay, todayISO } from '@/utils/format'
import { site } from '@/config/site'
import { accounting as t } from '@/config/copy/accounting'

/** Balance general a una fecha, con el resultado no cerrado dentro del patrimonio. */
const c = t.balance
const date = ref(todayISO())
const report = useReport(() => accountingService.balanceSheet({ date: date.value }))
const data = report.data
report.run()

const rows = computed<StatementRow[]>(() => {
  const d = data.value
  if (!d) return []
  return [
    ...d.assets.rows,
    totalRow(c.totalAssets, d.assets.total),
    ...d.liabilities.rows,
    totalRow(c.totalLiabilities, d.liabilities.total),
    ...d.equity.rows,
    { ...totalRow(c.currentResult, d.equity.currentYearResult), kind: 'mayor' },
    totalRow(c.totalEquity, d.equity.total),
    totalRow(c.totalLe, d.liabilitiesAndEquity),
  ]
})
const filtersText = computed(() => (data.value ? [`${c.date.label} ${formatDay(data.value.date)}`] : []))
</script>

<template>
  <section>
    <PageHeader :subtitle="c.intro" />
    <form class="panel panel--pad bs" @submit.prevent="report.run">
      <div class="form-grid">
        <FormField v-bind="c.date" for="bs-date" class="narrow">
          <BaseDatePicker id="bs-date" v-model="date" />
        </FormField>
        <div class="bs__submit">
          <button type="submit" class="btn btn--primary" :disabled="report.loading.value || !date">
            <AppIcon :name="report.loading.value ? 'spinner' : 'search'" :spin="report.loading.value" /> {{ site.filters.apply }}
          </button>
        </div>
      </div>
    </form>

    <DataTable
      class="tree"
      :columns="statementColumns(t.common.amount)"
      :rows="rows"
      :loading="report.loading.value"
      :error="report.error.value"
      :title="data ? `Balance general al ${formatDay(data.date)}` : undefined"
      :filters-text="filtersText"
      :row-class="treeRowClass"
      @retry="report.run"
    >
      <template #toolbar>
        <BaseBadge v-if="data" :tone="data.cuadra ? 'success' : 'danger'">
          <AppIcon :name="data.cuadra ? 'check-circle' : 'alert'" /> {{ data.cuadra ? t.common.cuadra : t.common.noCuadra }}
        </BaseBadge>
        <HelpTip v-if="data" :text="data.signConvention" />
      </template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.bs {
  margin-bottom: 0.75rem;

  &__submit {
    @include flex(row, flex-end, flex-start);
    flex: 0 0 auto !important;
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
