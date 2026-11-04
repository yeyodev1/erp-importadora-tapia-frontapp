<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import CreditNoteForm from '@/components/sales/CreditNoteForm.vue'
import SriRowActions from '@/components/sales/SriRowActions.vue'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { salesService, type CreditNote } from '@/services/sales.service'
import { useToastStore } from '@/stores/toast'
import { facturacion as t } from '@/config/copy/facturacion'

/** Notas de crédito: aplicadas a una factura, con devolución de mercadería o solo valor. */
const { canWrite } = useAccess()
const toast = useToastStore()
const creating = ref(false)
const partyId = ref('')

const list = useList<CreditNote>(
  (p) => salesService.list<CreditNote>('credit-notes', p),
  () => ({ partyId: partyId.value || undefined }),
)

const c = t.cols
const columns: Column<CreditNote>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'number', label: c.number, width: '10rem' },
  { key: 'partyName', label: c.customer },
  { key: 'invoiceNumber', label: c.appliesTo, help: t.colHelp.appliesTo, width: '10rem' },
  { key: 'reason', label: c.reason },
  { key: 'returnsStock', label: c.kind, help: t.colHelp.kindNote, value: (r) => (r.returnsStock ? t.creditNotes.returns : t.creditNotes.valueOnly), width: '7rem' },
  { key: 'total', label: t.totals.total, format: 'money', total: true },
  { key: 'sriStatus', label: c.sri, help: t.colHelp.sri, width: '8rem' },
  { key: 'actions', label: c.actions, screenOnly: true, width: '5rem' },
]

function onSaved(note: CreditNote) {
  creating.value = false
  toast.success(`${t.creditNotes.created}: ${note.number}`)
  list.reload()
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.pages.creditNotes.subtitle">
      <button v-if="canWrite && !creating" type="button" class="btn btn--primary" @click="creating = true">
        <AppIcon name="plus" /> {{ t.actions.newCreditNote }}
      </button>
    </PageHeader>

    <CreditNoteForm v-if="creating" @saved="onSaved" @cancel="creating = false" />

    <DataTable
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :fetch-all="list.fetchAll"
      :empty-message="t.pages.creditNotes.empty"
      :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)"
      @update:page="list.page = $event"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" />
        <div class="cn__party"><PartyPicker id="cn-filter-party" v-model="partyId" role="customer" clearable /></div>
      </template>
      <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
      <template #cell-sriStatus="{ row }"><StatusBadge :status="row.sriStatus || 'pendiente'" /></template>
      <template #cell-actions="{ row }"><SriRowActions kind="credit-notes" :row="row" :can-write="canWrite" /></template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.cn__party {
  flex: 1 1 240px;
  max-width: 360px;
}
</style>
