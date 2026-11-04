<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import VoidDialog from './VoidDialog.vue'
import { useList } from '@/composables/useList'
import { purchasesService } from '@/services/purchases.service'
import { useCatalogStore } from '@/stores/catalog'
import { useToastStore } from '@/stores/toast'
import { formatMoney } from '@/utils/money'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { PayableTransaction } from '@/types/purchases'

/**
 * Movimientos de CxP de un tipo (pagos, anticipos, cruces, devoluciones)
 * con su anulación (motivo + doble confirmación). Slot `actions` por fila.
 */
const props = defineProps<{ kind: PayableTransaction['kind']; canWrite: boolean; withOpen?: boolean; emptyMessage?: string }>()

const catalog = useCatalogStore()
const toast = useToastStore()
const showVoid = ref(false)
const list = useList(
  (p) => purchasesService.listTransactions(p),
  () => ({ kind: props.kind, status: showVoid.value ? 'anulado' : 'vigente' }),
)
catalog.ensure('bankAccounts')

const columns = computed<Column<PayableTransaction>[]>(() => [
  { key: 'number', label: 'Número', width: '9rem' },
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'party', label: 'Beneficiario', value: (r) => r.partyId?.name },
  { key: 'bank', label: 'Banco', value: (r) => catalog.bankAccounts.find((b) => b._id === r.bankAccountId)?.name ?? '' },
  { key: 'method', label: 'Medio de pago', value: (r) => (r.checkNumber ? `${r.method} # ${r.checkNumber}` : r.method) },
  { key: 'description', label: 'Descripción' },
  { key: 'amount', label: 'Valor', format: 'money', total: true },
  ...(props.withOpen ? [{ key: 'open', label: cxp.advances.open, format: 'money' as const, total: true, help: cxp.advances.openHelp, value: (r: PayableTransaction) => r.amount - r.applied }] : []),
  { key: 'actions', label: '', screenOnly: true },
])

const voiding = ref<PayableTransaction | null>(null)
const busy = ref(false)
const error = ref('')
async function doVoid(reason: string) {
  busy.value = true
  error.value = ''
  try {
    await purchasesService.voidTransaction(voiding.value!._id, { reason })
    toast.success(`${voiding.value!.number} anulado`)
    voiding.value = null
    list.reload()
    catalog.invalidate('bankAccounts')
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    busy.value = false
  }
}

defineExpose({ reload: list.reload })
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="list.items"
    :loading="list.loading"
    :error="list.error"
    :page="list.page"
    :pages="list.pages"
    :total="list.total"
    :fetch-all="list.fetchAll"
    landscape
    :empty-message="emptyMessage"
    :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)"
    @update:page="list.page = $event"
    @retry="list.reload"
  >
    <template #toolbar>
      <BaseSwitch v-model="showVoid" label="Ver anulados" />
    </template>
    <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
    <template #cell-actions="{ row }">
      <div v-if="canWrite && row.status === 'vigente'" class="tt__actions">
        <slot name="actions" :row="row" />
        <button type="button" class="btn btn--ghost btn--sm" @click="voiding = row"><AppIcon name="x" /> {{ cxp.advances.void }}</button>
      </div>
      <StatusBadge v-else-if="row.status === 'anulado'" status="anulado" />
    </template>
  </DataTable>

  <VoidDialog
    :open="!!voiding"
    :title="`${cxp.advances.void} ${cxp.kinds[kind]?.toLowerCase()}`"
    :subject="voiding ? `${voiding.number} · ${voiding.partyId?.name} · ${formatMoney(voiding.amount)}` : ''"
    :message="kind === 'pago' ? cxp.payments.voidMessage : cxp.advances.voidMessage"
    :second-message="kind === 'pago' ? cxp.payments.voidSecond : cxp.advances.voidSecond"
    :loading="busy"
    :error="error"
    @confirm="doVoid"
    @cancel="voiding = null"
  />
</template>

<style scoped lang="scss">
.tt__actions {
  @include flex(row, center, flex-end, 0.35rem);
  flex-wrap: wrap;
}
</style>
