<script setup lang="ts">
import RemotePicker from '@/components/pickers/RemotePicker.vue'
import { useDisplayLabel, type RemoteOption } from '@/composables/useRemoteSearch'
import { salesService, type SalesInvoice } from '@/services/sales.service'
import { formatMoney } from '@/utils/money'
import { formatDay } from '@/utils/format'
import { facturacion as t } from '@/config/copy/facturacion'

/**
 * Factura vigente y con saldo de un cliente (para notas de crédito y
 * débito). Busca por número; `pick` entrega la factura con sus líneas.
 */
const props = defineProps<{ id: string; partyId: string; disabled?: boolean }>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ pick: [invoice: SalesInvoice | null] }>()

const { display, remember } = useDisplayLabel(model, 'invoice', async (id) => (await salesService.getInvoice(id)).number)

async function search(q: string): Promise<RemoteOption<SalesInvoice>[]> {
  if (!props.partyId) return []
  const { items } = await salesService.list<SalesInvoice>('invoices', { partyId: props.partyId, status: 'vigente', pending: 'true', q, limit: 30 })
  return items.map((i) => ({ value: i._id, label: i.number, hint: `${formatDay(i.date)} · saldo ${formatMoney(i.balance)}`, data: i }))
}

function onPick(inv: SalesInvoice | null) {
  if (inv) remember(inv._id, inv.number)
  emit('pick', inv)
}
</script>

<template>
  <RemotePicker :id="id" v-model="model" :display="display" :search="search" :placeholder="t.placeholders.invoice" :disabled="disabled || !partyId" @pick="onPick" />
</template>
