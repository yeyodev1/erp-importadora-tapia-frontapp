<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useList } from '@/composables/useList'
import { useAccess } from '@/composables/useAccess'
import { purchasesService } from '@/services/purchases.service'
import { cxp } from '@/config/copy/cxp'
import type { PurchaseInvoice } from '@/types/purchases'

const t = cxp.invoices
const router = useRouter()
const { canWrite } = useAccess()
const filters = reactive({ pending: false, showVoid: false, supplierId: '', from: '', to: '' })

const list = useList(
  (p) => purchasesService.listInvoices(p),
  () => ({
    pending: filters.pending ? 'true' : undefined,
    status: filters.showVoid ? 'anulado' : undefined,
    supplierId: filters.supplierId || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  }),
)

const columns: Column<PurchaseInvoice>[] = [
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'docNumber', label: 'Número', width: '11rem' },
  { key: 'supplierName', label: 'Proveedor' },
  { key: 'total', label: 'Total', format: 'money', total: true },
  { key: 'withholdingTotal', label: 'Retención', format: 'money', total: true },
  { key: 'payable', label: 'Neto', format: 'money', total: true },
  { key: 'balance', label: 'Saldo', format: 'money', total: true },
  { key: 'dueDate', label: 'Vence', format: 'date', width: '7rem' },
  { key: 'sri', label: 'Retención SRI', value: (r) => r.withholding?.sriStatus ?? '' },
]
</script>

<template>
  <section>
    <PageHeader>
      <template v-if="canWrite">
        <RouterLink :to="{ name: 'ImportSupplierXml' }" class="btn btn--ghost"><AppIcon name="upload" /> {{ t.importXml }}</RouterLink>
        <RouterLink :to="{ name: 'NewSupplierInvoice' }" class="btn btn--primary"><AppIcon name="plus" /> {{ t.add }}</RouterLink>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :fetch-all="list.fetchAll"
      clickable
      landscape
      :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)"
      @update:page="list.page = $event"
      @row-click="router.push({ name: 'SupplierInvoiceDetail', params: { id: $event._id } })"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" class="toolbar__search" />
        <div class="si__party"><PartyPicker id="si-supplier" v-model="filters.supplierId" role="supplier" placeholder="Proveedor" clearable /></div>
        <div class="si__date"><BaseDatePicker id="si-from" v-model="filters.from" placeholder="Desde" :range-end="filters.to" clearable /></div>
        <div class="si__date"><BaseDatePicker id="si-to" v-model="filters.to" placeholder="Hasta" :range-start="filters.from" clearable /></div>
        <BaseSwitch v-model="filters.pending" :label="t.pendingOnly" />
        <BaseSwitch v-model="filters.showVoid" :label="t.showVoid" />
      </template>
      <template #cell-docNumber="{ row }"><span class="mono">{{ row.docNumber }}</span></template>
      <template #cell-sri="{ row }"><StatusBadge v-if="row.withholding" :status="row.withholding.sriStatus" /></template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.si__party {
  flex: 1 1 240px;
  max-width: 320px;
}

.si__date {
  flex: 0 1 150px;
}
</style>
