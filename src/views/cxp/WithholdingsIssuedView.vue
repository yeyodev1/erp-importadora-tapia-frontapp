<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { flattenGroups, useReport } from '@/composables/purchases/useReport'
import { purchasesService } from '@/services/purchases.service'
import { formatMoney } from '@/utils/money'
import { cxp } from '@/config/copy/cxp'

/** Retenciones emitidas a proveedores: por código de retención, por sustento o por número. */
type By = 'code' | 'support' | 'number'
const t = cxp.reports
const filters = ref(defaultFilters())
const by = ref<By>('code')
const detailed = ref(true)
const report = useReport(() => purchasesService.report('withholdings', { by: by.value, from: filters.value.from, to: filters.value.to, supplierId: filters.value.partyId || undefined }))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const label = (g: any): string =>
  by.value === 'code'
    ? `${cxp.tax[g.tax]} ${g.code} ${g.description}`
    : by.value === 'support'
      ? (cxp.taxSupports.find((s) => s.value === g.taxSupport)?.label ?? g.taxSupport)
      : g.withholdingNumber
const isDetailed = computed(() => detailed.value || by.value === 'number')
const rows = computed(() => flattenGroups(report.rows, isDetailed.value, label))
const totals = computed(() => report.totals as { renta: number; iva: number } | undefined)

const columns = computed<Column[]>(() => {
  const group: Column = { key: 'group', label: t.withholdingsBy.find((b) => b.value === by.value)!.label.replace('Por ', '') }
  if (!isDetailed.value) {
    return [group, { key: 'count', label: 'Registros', format: 'int', total: true }, { key: 'base', label: 'Base ret.', format: 'money', total: true }, { key: 'amount', label: 'Valor ret.', format: 'money', total: true }]
  }
  return [
    ...(by.value === 'number' ? [] : [group]),
    { key: 'withholdingNumber', label: 'Retención', width: '10rem' },
    { key: 'sriStatus', label: 'SRI' },
    { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
    { key: 'docNumber', label: 'Factura', width: '10rem' },
    { key: 'supplierName', label: 'Proveedor' },
    { key: 'supplierRuc', label: 'Identificación' },
    { key: 'base0', label: 'Base 0', format: 'money' },
    { key: 'baseVat', label: 'Base IVA', format: 'money' },
    { key: 'vat', label: 'IVA', format: 'money' },
    { key: 'code', label: 'Código', value: (r) => `${cxp.tax[r.tax]} ${r.code}` },
    { key: 'base', label: 'Base ret.', format: 'money', total: true },
    { key: 'rate', label: '% ret.', format: 'qty' },
    { key: 'amount', label: 'Valor ret.', format: 'money', total: true },
  ]
})

function run(summary: string[]) {
  report.run([t.withholdingsBy.find((b) => b.value === by.value)!.label, ...summary])
}
watch(by, () => report.ran && run(report.summary.slice(1)))
</script>

<template>
  <section>
    <PageHeader />
    <ReportFilters v-model="filters" :fields="['range', 'party']" party-role="supplier" :loading="report.loading" @apply="run">
      <FormField label="Agrupar">
        <BaseSegmented v-model="by" :options="t.withholdingsBy" label="Agrupar" />
      </FormField>
      <BaseSwitch v-model="detailed" :label="t.detailed" :disabled="by === 'number'" />
    </ReportFilters>
    <p v-if="totals" class="wi__totals">
      Renta <strong class="num">{{ formatMoney(totals.renta) }}</strong> · IVA <strong class="num">{{ formatMoney(totals.iva) }}</strong>
    </p>
    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="report.loading"
      :error="report.error"
      :filters-text="[...report.summary, ...(totals ? [`Renta ${formatMoney(totals.renta)} · IVA ${formatMoney(totals.iva)}`] : [])]"
      landscape
      @retry="run(report.summary.slice(1))"
    >
      <template #cell-withholdingNumber="{ row }"><span class="mono">{{ row.withholdingNumber }}</span></template>
      <template #cell-sriStatus="{ row }"><StatusBadge :status="row.sriStatus" /></template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.wi__totals {
  margin-bottom: 0.5rem;
  text-align: right;
  color: $ink-soft;
}
</style>
