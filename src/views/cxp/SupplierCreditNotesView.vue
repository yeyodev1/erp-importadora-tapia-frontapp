<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import CreditNoteDialog from '@/components/purchases/CreditNoteDialog.vue'
import { useList } from '@/composables/useList'
import { useAccess } from '@/composables/useAccess'
import { purchasesService } from '@/services/purchases.service'
import { cxp } from '@/config/copy/cxp'
import type { SupplierCreditNote } from '@/types/purchases'

const { canWrite } = useAccess()
const supplierId = ref('')
const creating = ref(false)
const list = useList(
  (p) => purchasesService.listCreditNotes(p),
  () => ({ supplierId: supplierId.value || undefined }),
)

const columns: Column<SupplierCreditNote>[] = [
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'docNumber', label: 'Número', width: '11rem' },
  { key: 'reason', label: 'Motivo' },
  { key: 'base0', label: 'Base 0', format: 'money', total: true },
  { key: 'baseVat', label: 'Base 15 %', format: 'money', total: true },
  { key: 'vat', label: 'IVA', format: 'money', total: true },
  { key: 'total', label: 'Total', format: 'money', total: true },
]

function onSaved() {
  creating.value = false
  list.reload()
}
</script>

<template>
  <section>
    <PageHeader>
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="creating = true"><AppIcon name="plus" /> {{ cxp.creditNotes.add }}</button>
    </PageHeader>
    <DataTable :columns="columns" :rows="list.items" :loading="list.loading" :error="list.error" :total="list.total" @retry="list.reload">
      <template #toolbar>
        <div class="cn__party"><PartyPicker id="cn-supplier" v-model="supplierId" role="supplier" placeholder="Proveedor" clearable /></div>
      </template>
      <template #cell-docNumber="{ row }"><span class="mono">{{ row.docNumber }}</span></template>
    </DataTable>
    <CreditNoteDialog :open="creating" @close="creating = false" @saved="onSaved" />
  </section>
</template>

<style scoped lang="scss">
.cn__party {
  flex: 1 1 260px;
  max-width: 360px;
}
</style>
