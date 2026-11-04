<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/accounting/useReport'
import { taxesService } from '@/services/taxes.service'
import { taxes as t } from '@/config/copy/taxes'
import { cxp } from '@/config/copy/cxp'

/** Compras por tipo de sustento, tarifa 0 y tarifa 15 separadas (alias /api/taxes/reports/purchases-by-tax-support). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
const C = t.support.cols
const H = t.support.colsHelp
const supportName = (r: Row) => cxp.taxSupports.find((o) => o.value === r.taxSupport)?.label ?? r.taxSupport
const filters = ref(defaultFilters())
const summary = ref<string[]>([])
const report = useReport(() => taxesService.report('purchases-by-tax-support', { from: filters.value.from, to: filters.value.to }))
report.run()

function apply(lines: string[]) {
  summary.value = lines
  report.run()
}

const columns: Column<Row>[] = [
  { key: 'taxSupport', label: C.support, help: H.support, value: supportName },
  { key: 'count', label: C.count, help: H.count, format: 'int', total: true },
  { key: 'base0', label: C.base0, help: H.base0, format: 'money', total: true },
  { key: 'baseVat', label: C.baseVat, help: H.baseVat, format: 'money', total: true },
  { key: 'vat', label: C.vat, help: H.vat, format: 'money', total: true },
  { key: 'total', label: C.total, format: 'money', total: true },
]
</script>

<template>
  <section>
    <PageHeader :subtitle="t.support.intro" />
    <ReportFilters v-model="filters" :loading="report.loading.value" @apply="apply" />
    <DataTable
      :columns="columns"
      :rows="report.data.value?.items ?? []"
      row-key="taxSupport"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="summary"
      :empty-message="t.support.empty"
      @retry="report.run"
    />
  </section>
</template>
