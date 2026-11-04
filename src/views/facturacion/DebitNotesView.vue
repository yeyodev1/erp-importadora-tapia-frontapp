<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import DebitNoteForm from '@/components/sales/DebitNoteForm.vue'
import SriRowActions from '@/components/sales/SriRowActions.vue'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { salesService, type DebitNote } from '@/services/sales.service'
import { useToastStore } from '@/stores/toast'
import { facturacion as t } from '@/config/copy/facturacion'

/** Notas de débito: cargos adicionales sobre una factura. */
const { canWrite } = useAccess()
const toast = useToastStore()
const creating = ref(false)
const partyId = ref('')

const list = useList<DebitNote>(
  (p) => salesService.list<DebitNote>('debit-notes', p),
  () => ({ partyId: partyId.value || undefined }),
)

const c = t.cols
const columns: Column<DebitNote>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'number', label: c.number, width: '10rem' },
  { key: 'invoiceNumber', label: c.invoice, width: '10rem' },
  { key: 'reason', label: c.reason },
  { key: 'vat', label: t.totals.vat, format: 'money', total: true },
  { key: 'total', label: t.totals.total, format: 'money', total: true },
  { key: 'sriStatus', label: c.sri, width: '8rem' },
  { key: 'actions', label: c.actions, screenOnly: true, width: '5rem' },
]

function onSaved(note: DebitNote) {
  creating.value = false
  toast.success(`${t.debitNotes.created}: ${note.number}`)
  list.reload()
}
</script>

<template>
  <section>
    <PageHeader>
      <button v-if="canWrite && !creating" type="button" class="btn btn--primary" @click="creating = true">
        <AppIcon name="plus" /> {{ t.actions.newDebitNote }}
      </button>
    </PageHeader>

    <DebitNoteForm v-if="creating" @saved="onSaved" @cancel="creating = false" />

    <DataTable
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :fetch-all="list.fetchAll"
      :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)"
      @update:page="list.page = $event"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" />
        <div class="dn__party"><PartyPicker id="dn-filter-party" v-model="partyId" role="customer" clearable /></div>
      </template>
      <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
      <template #cell-sriStatus="{ row }"><StatusBadge :status="row.sriStatus || 'pendiente'" /></template>
      <template #cell-actions="{ row }"><SriRowActions kind="debit-notes" :row="row" :can-write="canWrite" /></template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.dn__party {
  flex: 1 1 240px;
  max-width: 360px;
}
</style>
