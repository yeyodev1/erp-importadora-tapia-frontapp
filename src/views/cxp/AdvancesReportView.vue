<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/purchases/useReport'
import { purchasesService } from '@/services/purchases.service'
import { formatDay, todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'

/** Anticipos con saldo por cruzar o devolver a una fecha de corte (proveedores y empleados). */
const t = cxp.reports
const filters = ref(defaultFilters())
const cutoff = ref(todayISO())
const report = useReport(() => purchasesService.report('advances', { cutoff: cutoff.value, partyId: filters.value.partyId || undefined }))

const columns: Column[] = [
  { key: 'number', label: 'Número', width: '9rem' },
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'party', label: 'Beneficiario', value: (r) => r.party?.name, help: t.columns.party },
  { key: 'identification', label: 'Identificación', value: (r) => r.party?.identification },
  { key: 'type', label: 'Proveedor o empleado', value: (r) => (r.party?.isEmployee ? cxp.advances.employee : cxp.advances.supplier) },
  { key: 'method', label: 'Medio de pago', value: (r) => (r.checkNumber ? `${r.method} # ${r.checkNumber}` : r.method) },
  { key: 'amount', label: 'Valor', format: 'money', total: true },
  { key: 'open', label: 'Saldo', format: 'money', total: true, help: t.columns.open },
]

const run = (summary: string[]) => report.run([`Corte al ${formatDay(cutoff.value)}`, ...summary])
onMounted(() => run([]))
</script>

<template>
  <section>
    <PageHeader :subtitle="cxp.pages.advancesReport" />
    <ReportFilters v-model="filters" :fields="['party']" :loading="report.loading" @apply="run">
      <FormField v-bind="t.cutoff" for="ar-cutoff" class="narrow">
        <BaseDatePicker id="ar-cutoff" v-model="cutoff" />
      </FormField>
    </ReportFilters>
    <DataTable :columns="columns" :rows="report.rows" :loading="report.loading" :error="report.error" :filters-text="report.summary" :empty-message="t.emptyAdvances" @retry="run(report.summary)">
      <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
    </DataTable>
  </section>
</template>
