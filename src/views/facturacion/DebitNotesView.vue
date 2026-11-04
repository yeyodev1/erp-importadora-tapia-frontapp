<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { sriRow } from '@/components/table/indicators'
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
// `?sriStatus=devuelto|sin_firma` (campana): el filtro vive en la URL para poder quitarlo.
const route = useRoute()
const router = useRouter()
const sriStatus = computed({
  get: () => (route.query.sriStatus === 'devuelto' || route.query.sriStatus === 'sin_firma' ? route.query.sriStatus : ''),
  set: (v: string) => router.replace({ query: { ...route.query, sriStatus: v || undefined } }),
})
const sriOptions = ['', 'devuelto', 'sin_firma'].map((value) => ({ value, label: t.sriFilter.options[value]!, help: t.sriFilter.help[value] }))

const list = useList<DebitNote>(
  (p) => salesService.list<DebitNote>('debit-notes', p),
  () => ({ partyId: partyId.value || undefined, sriStatus: sriStatus.value || undefined }),
)

const c = t.cols
const columns: Column<DebitNote>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'number', label: c.number, width: '10rem' },
  { key: 'invoiceNumber', label: c.invoice, width: '10rem' },
  { key: 'reason', label: c.reason },
  { key: 'vat', label: t.totals.vat, help: t.colHelp.vat, format: 'money', total: true },
  { key: 'total', label: t.totals.total, format: 'money', total: true },
  { key: 'sriStatus', label: c.sri, help: t.colHelp.sri, width: '8rem' },
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
    <PageHeader :subtitle="t.pages.debitNotes.subtitle">
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
      :empty-message="t.pages.debitNotes.empty"
      :row-class="(r) => (r.status === 'anulado' ? 'is-void' : sriRow(r.sriStatus))"
      @update:page="list.page = $event"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" />
        <BaseSegmented v-model="sriStatus" :options="sriOptions" :label="t.sriFilter.label" />
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
