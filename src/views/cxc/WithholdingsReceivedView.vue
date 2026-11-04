<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import WithholdingDialog from '@/components/receivables/WithholdingDialog.vue'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { receivablesService, type Withholding } from '@/services/receivables.service'
import { useToastStore } from '@/stores/toast'
import { cxc } from '@/config/copy/cxc'
import { sumCents } from '@/utils/money'

/** Retenciones que nos hacen los clientes (renta 1/1,75/2 %, IVA 10–100 %), cada una sobre una factura. */
const t = cxc.withholdings
const { canWrite } = useAccess()
const toast = useToastStore()
const creating = ref(false)
const filters = ref(defaultFilters())
const applied = ref(defaultFilters())
const summary = ref<string[]>([])

const list = useList(
  (p) => receivablesService.withholdings(p),
  () => filterParams(applied.value),
)

function apply(s: string[]) {
  summary.value = s
  applied.value = { ...filters.value }
}

const byTax = (w: Withholding, tax: 'renta' | 'iva') =>
  sumCents(
    w.lines.filter((l) => l.tax === tax),
    (l) => l.amount,
  )
const rates = (w: Withholding) =>
  w.lines.map((l) => `${t[l.tax]} ${String(l.rate).replace('.', ',')} %`).join(' · ')
const columns: Column<Withholding>[] = [
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'voucherNumber', ...t.cols.voucher, width: '11rem' },
  { key: 'invoiceNumber', label: 'Factura', width: '11rem' },
  { key: 'partyName', label: 'Cliente' },
  { key: 'rates', ...t.cols.rates, value: rates },
  { key: 'renta', ...t.cols.renta, format: 'money', total: true, value: (w) => byTax(w, 'renta') },
  { key: 'iva', ...t.cols.iva, format: 'money', total: true, value: (w) => byTax(w, 'iva') },
  { key: 'total', label: 'Total', format: 'money', total: true },
]

function onSaved() {
  creating.value = false
  toast.success(t.saved)
  list.reload()
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle">
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="creating = true">
        <AppIcon name="plus" /> {{ t.add }}
      </button>
    </PageHeader>
    <ReportFilters
      v-model="filters"
      :fields="['range', 'party']"
      party-role="customer"
      :loading="list.loading"
      @apply="apply"
    />

    <DataTable
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :fetch-all="list.fetchAll"
      :filters-text="summary"
      :empty-title="t.emptyTitle"
      :empty-message="t.empty"
      @update:page="list.page = $event"
      @retry="list.reload"
    >
      <template #toolbar><SearchInput v-model="list.q" /></template>
      <template #cell-voucherNumber="{ row }"
        >
<span class="mono">{{ row.voucherNumber }}</span>
</template
      >
      <template #cell-invoiceNumber="{ row }"
        >
<span class="mono">{{ row.invoiceNumber }}</span>
</template
      >
    </DataTable>

    <WithholdingDialog :open="creating" @close="creating = false" @saved="onSaved" />
  </section>
</template>
