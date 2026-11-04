<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { salesService, type DocKind, type SriFields } from '@/services/sales.service'
import { useRide } from '@/composables/sales/useRide'
import { useToastStore } from '@/stores/toast'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'

/** Acciones de fila de un comprobante: reintentar SRI (si no está autorizado) e imprimir RIDE. */
const props = defineProps<{ kind: DocKind; row: SriFields & { _id: string; status?: string }; canWrite: boolean }>()

const toast = useToastStore()
const { printRide, printing } = useRide()
const retrying = ref(false)

async function retry() {
  retrying.value = true
  try {
    // La fila es el objeto reactivo del listado: se actualiza en su lugar.
    Object.assign(props.row, await salesService.retrySri(props.kind, props.row._id))
    toast.info(t.sri.retried)
  } catch (e) {
    toast.error((e as ApiError).message)
  } finally {
    retrying.value = false
  }
}
</script>

<template>
  <span class="sra" @click.stop>
    <button
      v-if="canWrite && row.status !== 'anulado' && row.sriStatus !== 'autorizado'"
      type="button"
      class="btn btn--ghost btn--sm btn--icon"
      :title="t.actions.retrySri"
      :aria-label="t.actions.retrySri"
      :disabled="retrying"
      @click="retry"
    >
      <AppIcon name="refresh" :spin="retrying" />
    </button>
    <button type="button" class="btn btn--ghost btn--sm btn--icon" :title="t.actions.rideA4" :aria-label="t.actions.rideA4" :disabled="!!printing" @click="printRide(kind, row._id, 'a4')">
      <AppIcon name="print" />
    </button>
  </span>
</template>

<style scoped lang="scss">
.sra {
  @include flex(row, center, flex-end, 0.25rem);
}
</style>
