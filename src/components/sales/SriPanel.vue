<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import { salesService, type DocKind, type SriFields } from '@/services/sales.service'
import { useRide } from '@/composables/sales/useRide'
import { useToastStore } from '@/stores/toast'
import { formatDateTime } from '@/utils/format'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'

/**
 * Resultado SRI de un comprobante: estado, mensajes, clave de acceso,
 * reintento y RIDE A4/ticket. Emite `updated` con el documento tras reintentar.
 */
const props = defineProps<{ kind: DocKind; doc: SriFields & { _id: string; status?: string }; canWrite: boolean }>()
const emit = defineEmits<{ updated: [doc: SriFields] }>()

const toast = useToastStore()
const { printRide, printing } = useRide()
// Sin estado propio: BaseButton muestra la espera y bloquea el doble clic.
async function retry() {
  try {
    const doc = await salesService.retrySri(props.kind, props.doc._id)
    emit('updated', doc)
    toast.info(t.sri.retried)
  } catch (e) {
    toast.error((e as ApiError).message)
  }
}
</script>

<template>
  <section class="panel panel--pad sri">
    <header class="sri__head">
      <h3 class="sri__title">{{ t.sri.title }}</h3>
      <StatusBadge :status="doc.sriStatus || 'pendiente'" />
      <HelpTip :text="t.colHelp.sri" :label="t.sri.title" />
      <span class="toolbar__spacer"></span>
      <BaseButton v-if="canWrite && doc.sriStatus !== 'autorizado' && doc.status !== 'anulado'" size="sm" icon="send" :action="retry">{{ t.actions.retrySri }}</BaseButton>
      <BaseButton size="sm" icon="print" :disabled="!!printing" :action="() => printRide(kind, doc._id, 'a4')">{{ t.actions.rideA4 }}</BaseButton>
      <BaseButton v-if="kind === 'invoices'" size="sm" icon="print" :disabled="!!printing" :action="() => printRide(kind, doc._id, 'ticket')">{{ t.actions.rideTicket }}</BaseButton>
    </header>
    <ul v-if="doc.sriMessages?.length" class="sri__msgs">
      <li v-for="m in doc.sriMessages" :key="m">{{ m }}</li>
    </ul>
    <p v-if="doc.sriStatus !== 'autorizado'" class="sri__note">{{ t.sri.pending }}</p>
    <dl class="sri__kv">
      <div v-if="doc.accessKey"><dt>{{ t.sri.accessKey }} <HelpTip :text="t.sri.accessKeyHelp" :label="t.sri.accessKey" /></dt><dd class="mono">{{ doc.accessKey }}</dd></div>
      <div v-if="doc.authorizationNumber">
        <dt>{{ t.sri.authorization }}</dt>
        <dd class="mono">{{ doc.authorizationNumber }} · {{ doc.authorizationDate ? formatDateTime(doc.authorizationDate) : '' }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped lang="scss">
.sri {
  @include flex(column, stretch, flex-start, 0.5rem);

  &__head {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: 1rem;
  }

  &__msgs {
    margin: 0;
    padding-left: 1.1rem;
    color: $ink-soft;
  }

  &__note {
    margin: 0;
    color: $ink-muted;
    font-size: 0.9rem;
  }

  &__kv {
    @include flex(column, stretch, flex-start, 0.25rem);
    margin: 0;

    div {
      @include flex(row, baseline, flex-start, 0.5rem);
      flex-wrap: wrap;
    }

    dt {
      color: $ink-muted;
    }

    dd {
      margin: 0;
      word-break: break-all;
    }
  }
}
</style>
