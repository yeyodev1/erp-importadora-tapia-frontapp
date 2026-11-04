<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import VoidDialog from '@/components/purchases/VoidDialog.vue'
import WithholdingVoucherCard from '@/components/purchases/WithholdingVoucherCard.vue'
import { purchasesService } from '@/services/purchases.service'
import { useAccess } from '@/composables/useAccess'
import { useToastStore } from '@/stores/toast'
import { formatMoney } from '@/utils/money'
import { formatDay } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { JournalEntry, PayableApplication, PurchaseInvoice, PurchaseInvoiceDetail } from '@/types/purchases'

const t = cxp.invoices
const route = useRoute()
const toast = useToastStore()
const { canWrite } = useAccess()
const inv = ref<PurchaseInvoiceDetail | null>(null)
const entry = ref<JournalEntry | null>(null)
const error = ref('')
const voiding = ref(false)
const voidBusy = ref(false)
const voidError = ref('')

const docType = computed(() => cxp.docTypes.find((d) => d.value === inv.value?.docType)?.label ?? '')
const facts = computed(() => {
  const i = inv.value
  if (!i) return []
  return [
    ['Proveedor', `${i.supplierName} · ${i.supplierRuc}`],
    ['Fecha', formatDay(i.date)],
    ['Vence', formatDay(i.dueDate)],
    ['Sustento', cxp.taxSupports.find((s) => s.value === i.taxSupport)?.label ?? i.taxSupport],
    ['Forma de pago', cxp.paymentMethods.find((p) => p.value === i.paymentMethod)?.label ?? i.paymentMethod],
    ['Bien o servicio', i.goodsOrServices === 'servicio' ? 'Servicio' : 'Bien'],
    ['Autorización', i.authorization],
    ['Descripción', i.description],
  ].filter(([, v]) => v)
})
const amounts = computed(() => {
  const i = inv.value
  if (!i) return []
  return [
    ['Base 0', i.base0],
    ['Base 15 %', i.baseVat],
    ['IVA', i.vat],
    ['Total', i.total],
    ['Retención', i.withholdingTotal],
    ['Neto a pagar', i.payable],
    ['Aprobado', i.approved],
    ['Saldo', i.balance],
  ] as [string, number][]
})

const appColumns: Column<PayableApplication>[] = [
  { key: 'date', label: 'Fecha', format: 'date' },
  { key: 'kind', label: 'Tipo', value: (a) => cxp.kinds[a.kind] ?? a.kind },
  { key: 'amount', label: 'Valor', format: 'money', total: true },
  { key: 'status', label: 'Estado' },
]

async function load() {
  error.value = ''
  try {
    inv.value = await purchasesService.getInvoice(String(route.params.id))
    entry.value = inv.value.journalEntryId ? await purchasesService.getEntry(inv.value.journalEntryId) : null
  } catch (e) {
    error.value = (e as ApiError).message
  }
}
onMounted(load)

const onUpdated = (updated: PurchaseInvoice) => inv.value && (inv.value = { ...inv.value, ...updated })

async function doVoid(reason: string) {
  voidBusy.value = true
  voidError.value = ''
  try {
    await purchasesService.voidInvoice(inv.value!._id, { reason })
    toast.success('Factura anulada')
    voiding.value = false
    await load()
  } catch (e) {
    voidError.value = (e as ApiError).message
  } finally {
    voidBusy.value = false
  }
}
</script>

<template>
  <section class="idt">
    <PageHeader :title="inv ? `${docType} ${inv.docNumber}` : t.detail">
      <RouterLink :to="{ name: 'SupplierInvoices' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> Facturas</RouterLink>
      <button v-if="canWrite && inv?.status === 'vigente'" type="button" class="btn btn--danger" @click="voiding = true">
        <AppIcon name="x" /> {{ t.void }}
      </button>
    </PageHeader>

    <EmptyState v-if="error" tone="error" :message="error" @retry="load" />
    <template v-else-if="inv">
      <section class="panel panel--pad idt__card">
        <header class="idt__head">
          <StatusBadge :status="inv.status" />
          <span v-if="inv.voidReason" class="idt__void">Motivo: {{ inv.voidReason }}</span>
        </header>
        <dl class="idt__facts">
          <div v-for="[k, v] in facts" :key="k" class="idt__fact">
            <dt>{{ k }}</dt>
            <dd>{{ v }}</dd>
          </div>
        </dl>
        <dl class="idt__amounts">
          <div v-for="[k, v] in amounts" :key="k" class="idt__fact">
            <dt>{{ k }}</dt>
            <dd class="num">{{ formatMoney(v) }}</dd>
          </div>
        </dl>
      </section>

      <WithholdingVoucherCard v-if="inv.withholding" :invoice="inv" :can-write="canWrite" @updated="onUpdated" />

      <section class="panel panel--pad">
        <EntryPreview v-if="entry" :lines="entry.lines" :title="`${t.entry} N.° ${entry.number}`" />
      </section>

      <section class="panel panel--pad">
        <h3 class="idt__title">{{ t.applications }}</h3>
        <DataTable :columns="appColumns" :rows="inv.applications" :exportable="false" :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)">
          <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
          <template #empty>{{ t.noApplications }}</template>
        </DataTable>
      </section>
    </template>

    <VoidDialog
      :open="voiding"
      :title="t.void"
      :subject="inv ? `${inv.docNumber} · ${inv.supplierName}` : ''"
      :message="t.voidMessage"
      :second-message="t.voidSecond"
      :loading="voidBusy"
      :error="voidError"
      @confirm="doVoid"
      @cancel="voiding = false"
    />
  </section>
</template>

<style scoped lang="scss">
.idt {
  @include flex(column, stretch, flex-start, 1rem);
}

.idt__card {
  @include flex(column, stretch, flex-start, 1rem);
}

.idt__head {
  @include flex(row, center, flex-start, 0.75rem);
}

.idt__void {
  color: $danger;
}

.idt__facts,
.idt__amounts {
  @include flex(row, flex-start, flex-start, 0.75rem 1.5rem);
  flex-wrap: wrap;
}

.idt__amounts {
  padding-top: 0.75rem;
  border-top: 1px solid $line;
}

.idt__fact {
  flex: 1 1 160px;

  dt {
    font-size: 0.78rem;
    color: $ink-muted;
  }

  dd {
    word-break: break-word;
  }
}

.idt__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
</style>
