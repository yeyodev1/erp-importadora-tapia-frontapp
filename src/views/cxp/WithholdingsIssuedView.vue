<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { sriRow } from '@/components/table/indicators'
import { flattenGroups, useReport } from '@/composables/purchases/useReport'
import { purchasesService } from '@/services/purchases.service'
import { formatMoney } from '@/utils/money'
import { cxp } from '@/config/copy/cxp'

/** Retenciones emitidas a proveedores: por código de retención, por sustento o por número. */
type By = 'code' | 'support' | 'number'
const t = cxp.reports
const route = useRoute()
// Enlace de la campana (?sriStatus=devuelto|sin_firma): por número y sin fecha desde, el rechazo puede ser de cualquier mes.
const sriStatus = computed(() => String(route.query.sriStatus ?? ''))
const sriFilter = computed(() => cxp.invoices.sriFiltered[sriStatus.value])
const filters = ref(defaultFilters(sriFilter.value ? { from: '' } : {}))
const by = ref<By>(sriFilter.value ? 'number' : 'code')
const detailed = ref(true)
const report = useReport(() =>
  purchasesService.report('withholdings', { by: by.value, from: filters.value.from || undefined, to: filters.value.to, supplierId: filters.value.partyId || undefined, sriStatus: sriFilter.value ? sriStatus.value : undefined }),
)

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
    return [group, { key: 'count', label: 'Documentos', format: 'int', total: true, help: t.columns.count }, { key: 'base', label: 'Base retenida', format: 'money', total: true, help: t.columns.wBase }, { key: 'amount', label: 'Valor retenido', format: 'money', total: true, help: t.columns.wAmount }]
  }
  return [
    ...(by.value === 'number' ? [] : [group]),
    { key: 'withholdingNumber', label: 'Retención', width: '10rem', help: t.columns.withholdingNumber },
    { key: 'sriStatus', label: 'Estado SRI', help: cxp.invoices.columns.sri },
    { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
    { key: 'docNumber', label: 'Factura', width: '10rem' },
    { key: 'supplierName', label: 'Proveedor' },
    { key: 'supplierRuc', label: 'Identificación' },
    { key: 'base0', label: 'Base 0 %', format: 'money', help: t.columns.base0 },
    { key: 'baseVat', label: 'Base 15 %', format: 'money', help: t.columns.baseVat },
    { key: 'vat', label: 'IVA', format: 'money' },
    { key: 'code', label: 'Código de retención', value: (r) => `${cxp.tax[r.tax]} ${r.code}` },
    { key: 'base', label: 'Base retenida', format: 'money', total: true, help: t.columns.wBase },
    { key: 'rate', label: '% retención', format: 'qty', help: t.columns.wRate },
    { key: 'amount', label: 'Valor retenido', format: 'money', total: true, help: t.columns.wAmount },
  ]
})

function run(summary: string[]) {
  report.run([t.withholdingsBy.find((b) => b.value === by.value)!.label, ...summary])
}
watch(by, () => report.ran && run(report.summary.slice(1)))
onMounted(() => sriFilter.value && run([]))
watch(sriStatus, () => {
  filters.value = defaultFilters(sriFilter.value ? { from: '' } : {})
  if (sriFilter.value) by.value = 'number'
  run([])
})
</script>

<template>
  <section>
    <PageHeader :subtitle="cxp.pages.withholdings" />
    <AlertBanner v-if="sriFilter" :level="sriStatus === 'devuelto' ? 'danger' : 'warning'" :title="sriFilter.title" :message="sriFilter.message" :action-label="cxp.invoices.clearSriFilter" :to="{ name: 'WithholdingsIssued' }" />
    <ReportFilters v-model="filters" :fields="['range', 'party']" party-role="supplier" :loading="report.loading" @apply="run">
      <FormField v-bind="t.groupField">
        <BaseSegmented v-model="by" :options="t.withholdingsBy" :label="t.groupField.label" />
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
      :row-class="(r) => sriRow(r.sriStatus)"
      :empty-message="report.ran ? t.emptyWithholdings : t.prompt"
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
