<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/purchases/useReport'
import { purchasesService } from '@/services/purchases.service'
import { formatDay, todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'

const t = cxp.reports
const router = useRouter()
const filters = ref(defaultFilters())
const mode = ref('por_pagar')
const cutoff = ref(todayISO())
const includeAdvances = ref(false)

const report = useReport(() =>
  purchasesService.report('balances', {
    mode: mode.value,
    cutoff: cutoff.value,
    supplierId: filters.value.partyId || undefined,
    includeAdvances: includeAdvances.value ? 'true' : undefined,
  }),
)

const columns = [
  { key: 'identification', label: 'Identificación', width: '9rem' },
  { key: 'name', label: 'Proveedor' },
  { key: 'invoices', label: 'Facturas', format: 'int' },
  { key: 'billed', label: 'Total facturado', format: 'money', total: true },
  { key: 'paid', label: 'Total abonado', format: 'money', total: true },
  { key: 'balance', label: 'Saldo', format: 'money', total: true },
  { key: 'advances', label: 'Anticipos', format: 'money', total: true },
] satisfies Column[]

function run(summary: string[]) {
  const m = t.modes.find((x) => x.value === mode.value)?.label
  report.run([`Corte al ${formatDay(cutoff.value)}`, `Facturas: ${m}`, ...summary, ...(includeAdvances.value ? [t.includeAdvances] : [])])
}
</script>

<template>
  <section>
    <PageHeader />
    <ReportFilters v-model="filters" :fields="['party']" party-role="supplier" :loading="report.loading" @apply="run">
      <FormField v-bind="t.cutoff" for="sb-cutoff" class="narrow">
        <BaseDatePicker id="sb-cutoff" v-model="cutoff" />
      </FormField>
      <FormField label="Facturas">
        <BaseSegmented v-model="mode" :options="t.modes" label="Facturas" />
      </FormField>
      <BaseSwitch v-model="includeAdvances" :label="t.includeAdvances" />
    </ReportFilters>
    <DataTable
      :columns="columns"
      :rows="report.rows"
      row-key="supplierId"
      :loading="report.loading"
      :error="report.error"
      :totals="report.totals"
      :filters-text="report.summary"
      clickable
      @row-click="router.push({ name: 'SupplierStatement', query: { supplierId: $event.supplierId } })"
      @retry="report.run(report.summary)"
    />
  </section>
</template>
