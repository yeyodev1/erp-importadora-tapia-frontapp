<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import ReceiptDialog from '@/components/receivables/ReceiptDialog.vue'
import StepDialog from '@/components/receivables/StepDialog.vue'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { useStep } from '@/composables/receivables/useStep'
import { receivablesService, type Receipt } from '@/services/receivables.service'
import { useToastStore } from '@/stores/toast'
import { cxc } from '@/config/copy/cxc'
import { formatMoney, sumCents } from '@/utils/money'

/** Cobros a clientes: listado, nuevo cobro aplicado a facturas y anulación con doble confirmación. */
const t = cxc.receipts
const { canWrite } = useAccess()
const toast = useToastStore()
const creating = ref(false)
const method = ref('')
const partyId = ref('')
const methodTabs = [
  { value: '', label: t.all },
  ...Object.entries(cxc.methods).map(([value, label]) => ({ value, label })),
]

const list = useList(
  (p) => receivablesService.receipts(p),
  () => ({ method: method.value || undefined, partyId: partyId.value || undefined }),
)

const columns: Column<Receipt>[] = [
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'number', label: 'Cobro', width: '10rem' },
  { key: 'partyName', label: 'Cliente' },
  {
    key: 'method',
    label: 'Medio',
    value: (r) => cxc.methods[r.method] + (r.check?.number ? ` #${r.check.number}` : ''),
  },
  {
    key: 'invoices',
    label: 'Facturas',
    value: (r) => r.applications.map((a) => a.invoiceNumber).join(', '),
  },
  { key: 'amount', label: 'Valor', format: 'money', total: true },
  { key: 'status', label: 'Estado', width: '7rem' },
  { key: 'actions', label: '', screenOnly: true, width: '3rem' },
]

// Los anulados se ven tachados pero no suman.
const totals = computed(() => ({
  amount: sumCents(
    list.items.filter((r) => r.status === 'vigente'),
    (r) => r.amount,
  ),
}))

const step = useStep<Receipt, 'void'>(
  (r, _a, s) => receivablesService.voidReceipt(r._id, { reason: s.reason!, date: s.date }),
  () => t.voided,
  () => list.reload(),
)

function onSaved() {
  creating.value = false
  toast.success(t.saved)
  list.reload()
}
</script>

<template>
  <section>
    <PageHeader>
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="creating = true">
        <AppIcon name="plus" /> {{ t.add }}
      </button>
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
      :totals="totals"
      :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)"
      @update:page="list.page = $event"
      @retry="list.reload"
    >
      <template #toolbar>
        <BaseSegmented v-model="method" :options="methodTabs" :label="t.fields.method.label" />
        <div class="party">
          <PartyPicker id="cob-party" v-model="partyId" role="customer" clearable />
        </div>
        <SearchInput v-model="list.q" />
      </template>
      <template #cell-number="{ row }"
        >
<span class="mono">{{ row.number }}</span>
</template
      >
      <template #cell-status="{ row }"
        >
<StatusBadge :status="row.check?.status === 'devuelto' ? 'devuelto' : row.status"
      />
</template>
      <template #cell-actions="{ row }">
        <button
          v-if="canWrite && row.status === 'vigente' && row.check?.status !== 'devuelto'"
          type="button"
          class="btn btn--ghost btn--icon btn--sm"
          :title="t.voidTitle"
          @click.stop="step.ask(row, 'void')"
        >
          <AppIcon name="trash" :label="t.voidTitle" />
        </button>
      </template>
    </DataTable>

    <ReceiptDialog :open="creating" @close="creating = false" @saved="onSaved" />
    <StepDialog
      :open="!!step.target.value"
      danger
      reason
      :title="t.voidTitle"
      :subject="
        step.target.value
          ? `${step.target.value.row.number} · ${formatMoney(step.target.value.row.amount)}`
          : ''
      "
      :message="t.voidMessage"
      :second-message="t.voidSecond"
      :second-label="t.voidLabel"
      :loading="step.saving.value"
      :error="step.error.value"
      @confirm="step.confirm"
      @cancel="step.cancel"
    />
  </section>
</template>

<style scoped lang="scss">
.party {
  flex: 1 1 220px;
  max-width: 320px;
}
</style>
