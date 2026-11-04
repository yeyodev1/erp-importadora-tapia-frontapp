<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/purchases/useReport'
import { purchasesService } from '@/services/purchases.service'
import { formatMoney } from '@/utils/money'
import { cxp } from '@/config/copy/cxp'

const t = cxp.reports
const route = useRoute()
// Desde enero: el estado de cuenta suele pedirse del año.
const filters = ref(defaultFilters({ from: `${new Date().getFullYear()}-01-01`, partyId: String(route.query.supplierId ?? '') }))

const report = useReport(() => purchasesService.statement(filters.value.partyId, { from: filters.value.from || undefined, to: filters.value.to || undefined }))
const data = computed(() => report.data as { supplier: { name: string; identification: string }; opening: number; closing: number } | null)

const columns: Column[] = [
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'kind', label: 'Movimiento', value: (r) => cxp.kinds[r.kind] ?? r.kind, help: t.columns.kind },
  { key: 'docNumber', label: 'Factura', width: '11rem' },
  { key: 'dueDate', label: 'Vencimiento', format: 'date', width: '7rem' },
  { key: 'charge', label: 'Facturado', format: 'money', total: true, help: t.columns.charge },
  { key: 'credit', label: 'Abonado', format: 'money', total: true, help: t.columns.credit },
  { key: 'balance', label: 'Saldo', format: 'money', help: t.columns.runningBalance },
]

function run(summary: string[]) {
  if (filters.value.partyId) report.run(summary)
}
onMounted(() => filters.value.partyId && run([]))
</script>

<template>
  <section>
    <PageHeader :subtitle="cxp.pages.statement" />
    <ReportFilters v-model="filters" :fields="['range', 'party']" party-role="supplier" :loading="report.loading" @apply="run" />
    <EmptyState v-if="!filters.partyId" :message="t.pickSupplier" />
    <template v-else-if="report.ran">
      <p v-if="data" class="st__head">
        <strong>{{ data.supplier.name }}</strong> <span class="mono">{{ data.supplier.identification }}</span> · {{ t.opening }}
        <strong class="num">{{ formatMoney(data.opening) }}</strong> · {{ t.closing }} <strong class="num">{{ formatMoney(data.closing) }}</strong>
      </p>
      <DataTable
        :columns="columns"
        :rows="report.rows"
        row-key="_rk"
        :loading="report.loading"
        :error="report.error"
        :empty-message="t.emptyStatement"
        :filters-text="[...report.summary, `${t.opening}: ${formatMoney(data?.opening)}`]"
        @retry="run(report.summary)"
      >
        <template #cell-docNumber="{ row }"><span class="mono">{{ row.docNumber }}</span></template>
      </DataTable>
    </template>
  </section>
</template>

<style scoped lang="scss">
.st__head {
  margin-bottom: 0.75rem;
  color: $ink-soft;
}
</style>
