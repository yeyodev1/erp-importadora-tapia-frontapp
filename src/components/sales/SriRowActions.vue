<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import { salesService, type DocKind, type SriFields } from '@/services/sales.service'
import { useRide } from '@/composables/sales/useRide'
import { useToastStore } from '@/stores/toast'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'

/** Acciones de fila de un comprobante: reintentar SRI (si no está autorizado) e imprimir RIDE. */
const props = defineProps<{ kind: DocKind; row: SriFields & { _id: string; status?: string }; canWrite: boolean }>()

const toast = useToastStore()
const { printRide, printing } = useRide()
async function retry() {
  try {
    // La fila es el objeto reactivo del listado: se actualiza en su lugar.
    Object.assign(props.row, await salesService.retrySri(props.kind, props.row._id))
    toast.info(t.sri.retried)
  } catch (e) {
    toast.error((e as ApiError).message)
  }
}
</script>

<template>
  <span class="sra" @click.stop>
    <BaseButton
      v-if="canWrite && row.status !== 'anulado' && row.sriStatus !== 'autorizado'"
      size="sm"
      class="btn--icon"
      icon="send"
      :title="t.actions.retrySri"
      :aria-label="t.actions.retrySri"
      :action="retry"
    />
    <BaseButton size="sm" class="btn--icon" icon="print" :title="t.actions.rideA4" :aria-label="t.actions.rideA4" :disabled="!!printing" :action="() => printRide(kind, row._id, 'a4')" />
  </span>
</template>

<style scoped lang="scss">
.sra {
  @include flex(row, center, flex-end, 0.25rem);
}
</style>
