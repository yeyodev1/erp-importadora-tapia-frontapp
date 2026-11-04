<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { flattenGroups, useReport } from '@/composables/purchases/useReport'
import { purchasesService } from '@/services/purchases.service'
import { cxp } from '@/config/copy/cxp'

/** Compras por proveedor, por cuenta contable o por tipo de sustento (base 0 y base 15 separadas). */
type By = 'by-supplier' | 'by-account' | 'by-tax-support'
const t = cxp.reports
const filters = ref(defaultFilters())
const by = ref<By>('by-supplier')
const detailed = ref(false)
const report = useReport(() => purchasesService.report(by.value, { from: filters.value.from, to: filters.value.to, supplierId: filters.value.partyId || undefined }))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const label = (g: any): string =>
  by.value === 'by-supplier'
    ? g.name
    : by.value === 'by-account'
      ? `${g.accountCode} ${g.accountName}`
      : (cxp.taxSupports.find((s) => s.value === g.taxSupport)?.label ?? g.taxSupport)
const rows = computed(() => flattenGroups(report.rows, detailed.value, label))
const groupName = computed(() => t.purchasesBy.find((b) => b.value === by.value)!.label.replace('Por ', ''))

const columns = computed<Column[]>(() => {
  const amounts: Column[] = [
    { key: 'base0', label: 'Base 0 %', format: 'money', total: true, help: t.columns.base0 },
    { key: 'baseVat', label: 'Base 15 %', format: 'money', total: true, help: t.columns.baseVat },
    ...(by.value === 'by-account'
      ? []
      : ([
          { key: 'vat', label: 'IVA', format: 'money', total: true },
          { key: 'total', label: 'Total', format: 'money', total: true },
        ] as Column[])),
  ]
  const group: Column = { key: 'group', label: groupName.value[0]!.toUpperCase() + groupName.value.slice(1) }
  if (!detailed.value) return [group, { key: 'count', label: 'Documentos', format: 'int', total: true, help: t.columns.count }, ...amounts]
  return [
    group,
    { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
    { key: 'docNumber', label: 'Número', width: '11rem' },
    ...(by.value === 'by-supplier' ? [] : [{ key: 'supplierName', label: 'Proveedor' }]),
    ...(by.value === 'by-account' ? [{ key: 'costCenter', label: 'Centro de costo' }] : [{ key: 'authorization', label: 'Autorización', help: t.columns.authorization }]),
    ...amounts,
  ]
})

function run(summary: string[]) {
  report.run([t.purchasesBy.find((b) => b.value === by.value)!.label, ...summary])
}
watch(by, () => report.ran && run(report.summary.slice(1)))
</script>

<template>
  <section>
    <PageHeader :subtitle="cxp.pages.purchases" />
    <ReportFilters v-model="filters" :fields="['range', 'party']" party-role="supplier" :loading="report.loading" @apply="run">
      <FormField v-bind="t.groupField">
        <BaseSegmented v-model="by" :options="t.purchasesBy" :label="t.groupField.label" />
      </FormField>
      <BaseSwitch v-model="detailed" :label="t.detailed" />
    </ReportFilters>
    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="report.loading"
      :error="report.error"
      :totals="detailed ? undefined : { ...report.totals, count: report.data?.total as number }"
      :filters-text="report.summary"
      landscape
      :empty-message="report.ran ? t.emptyPurchases : t.prompt"
      @retry="run(report.summary.slice(1))"
    />
  </section>
</template>
