<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { purchasesService } from '@/services/purchases.service'
import { useToastStore } from '@/stores/toast'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { PurchaseInvoice, WithholdingLine } from '@/types/purchases'

/** Comprobante de retención emitido: estado SRI, mensajes y reenvío si no se autorizó. */
const props = defineProps<{ invoice: PurchaseInvoice; canWrite: boolean }>()
const emit = defineEmits<{ updated: [invoice: PurchaseInvoice] }>()

const t = cxp.invoices
const toast = useToastStore()
const sending = ref(false)

const columns: Column<WithholdingLine>[] = [
  { key: 'tax', label: 'Impuesto', value: (w) => cxp.tax[w.tax] },
  { key: 'code', label: 'Código de retención' },
  { key: 'description', label: 'Concepto' },
  { key: 'base', label: 'Base imponible', format: 'money', help: cxp.reports.columns.wBase },
  { key: 'rate', label: 'Porcentaje', format: 'qty', help: cxp.reports.columns.wRate },
  { key: 'amount', label: 'Retenido', format: 'money', total: true, help: cxp.reports.columns.wAmount },
]

async function resend() {
  sending.value = true
  try {
    emit('updated', await purchasesService.resendWithholding(props.invoice._id))
    toast.success(t.resent)
  } catch (e) {
    toast.error((e as ApiError).message)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="panel panel--pad wv">
    <header class="wv__head">
      <h3 class="wv__title">Retención {{ invoice.withholding?.number }}</h3>
      <StatusBadge :status="invoice.withholding?.sriStatus" />
      <span class="wv__spacer"></span>
      <button
        v-if="canWrite && invoice.status === 'vigente' && invoice.withholding?.sriStatus !== 'autorizado'"
        type="button"
        class="btn btn--sm btn--primary"
        :disabled="sending"
        @click="resend"
      >
        <AppIcon :name="sending ? 'spinner' : 'refresh'" :spin="sending" /> {{ t.resend }}
      </button>
    </header>
    <p v-if="invoice.withholding?.accessKey" class="wv__key mono">{{ invoice.withholding.accessKey }}</p>
    <ul v-if="invoice.withholding?.messages?.length" class="wv__msgs">
      <li v-for="m in invoice.withholding.messages" :key="m"><AppIcon name="info" /> {{ m }}</li>
    </ul>
    <DataTable :columns="columns" :rows="invoice.withholdings" row-key="code" :exportable="false" />
  </section>
</template>

<style scoped lang="scss">
.wv {
  @include flex(column, stretch, flex-start, 0.6rem);
}

.wv__head {
  @include flex(row, center, flex-start, 0.6rem);
  flex-wrap: wrap;
}

.wv__title {
  font-size: 1rem;
  font-weight: 600;
}

.wv__spacer {
  flex: 1;
}

.wv__key {
  word-break: break-all;
  color: $ink-soft;
}

.wv__msgs {
  list-style: none;
  color: $warning;
  font-size: 0.9rem;
}
</style>
