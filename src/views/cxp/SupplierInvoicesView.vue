<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { overdueRow, sriRow } from '@/components/table/indicators'
import { useList } from '@/composables/useList'
import { useAccess } from '@/composables/useAccess'
import { purchasesService } from '@/services/purchases.service'
import { todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'
import { site } from '@/config/site'
import type { PurchaseInvoice } from '@/types/purchases'

const t = cxp.invoices
const router = useRouter()
const route = useRoute()
const { canWrite } = useAccess()
// Enlace de la campana (?sriStatus=devuelto|sin_firma): sin rango de fechas, el rechazo puede ser de cualquier mes.
const sriStatus = computed(() => String(route.query.sriStatus ?? ''))
const sriFilter = computed(() => t.sriFiltered[sriStatus.value])
// Desde el 1 de enero: una factura pendiente de un mes anterior no debe quedar fuera de la vista inicial.
const yearStart = () => (sriFilter.value ? '' : `${todayISO().slice(0, 4)}-01-01`)
const filters = reactive({ pending: false, showVoid: false, supplierId: '', from: yearStart(), to: todayISO() })
watch(sriFilter, () => (filters.from = yearStart()))

const list = useList(
  (p) => purchasesService.listInvoices(p),
  () => ({
    pending: filters.pending ? 'true' : undefined,
    status: filters.showVoid ? 'anulado' : undefined,
    supplierId: filters.supplierId || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    sriStatus: sriFilter.value ? sriStatus.value : undefined,
  }),
)
const openDue = (r: PurchaseInvoice) => (r.balance > 0 ? r.dueDate : null)
const rowClass = (r: PurchaseInvoice) => (r.status === 'anulado' ? 'is-void' : (sriRow(r.withholding?.sriStatus) ?? overdueRow(openDue(r))))

const columns: Column<PurchaseInvoice>[] = [
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'docNumber', label: 'Número', width: '11rem' },
  { key: 'supplierName', label: 'Proveedor' },
  { key: 'total', label: 'Total', format: 'money', total: true },
  { key: 'withholdingTotal', label: 'Retención', format: 'money', total: true, help: t.columns.withholding },
  { key: 'payable', label: 'Neto a pagar', format: 'money', total: true, help: t.columns.payable },
  { key: 'balance', label: 'Saldo', format: 'money', total: true, help: t.columns.balance },
  { key: 'dueDate', label: 'Vencimiento', format: 'date', width: '7rem' },
  { key: 'overdue', label: 'Atraso', format: 'days-overdue', value: openDue, width: '8rem', help: t.overdue },
  { key: 'sri', label: 'Retención SRI', value: (r) => r.withholding?.sriStatus ?? '', help: t.columns.sri },
]
</script>

<template>
  <section>
    <PageHeader :subtitle="cxp.pages.invoices">
      <template v-if="canWrite">
        <RouterLink :to="{ name: 'ImportSupplierXml' }" class="btn btn--ghost"><AppIcon name="upload" /> {{ t.importXml }}</RouterLink>
        <RouterLink :to="{ name: 'NewSupplierInvoice' }" class="btn btn--primary"><AppIcon name="plus" /> {{ t.add }}</RouterLink>
      </template>
    </PageHeader>
    <AlertBanner v-if="sriFilter" :level="sriStatus === 'devuelto' ? 'danger' : 'warning'" :title="sriFilter.title" :message="sriFilter.message" :action-label="t.clearSriFilter" :to="{ name: 'SupplierInvoices' }" />

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
      :empty-message="t.empty"
      :row-class="rowClass"
      @update:page="list.page = $event"
      @row-click="router.push({ name: 'SupplierInvoiceDetail', params: { id: $event._id } })"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" class="toolbar__search" :placeholder="t.placeholders.search" />
        <FormField :label="t.fields.supplier.label" :help="site.filters.help.party" for="si-supplier" class="si__party">
          <PartyPicker id="si-supplier" v-model="filters.supplierId" role="supplier" :placeholder="t.filters.supplier" clearable />
        </FormField>
        <FormField :label="site.filters.from" :help="site.filters.help.from" for="si-from" class="si__date">
          <BaseDatePicker id="si-from" v-model="filters.from" :placeholder="t.filters.from" :range-end="filters.to" clearable />
        </FormField>
        <FormField :label="site.filters.to" :help="site.filters.help.to" for="si-to" class="si__date">
          <BaseDatePicker id="si-to" v-model="filters.to" :placeholder="t.filters.to" :range-start="filters.from" clearable />
        </FormField>
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
  flex: 0 1 160px;
}
</style>
