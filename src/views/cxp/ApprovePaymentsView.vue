<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import PayableInvoicesGrid from '@/components/purchases/PayableInvoicesGrid.vue'
import { useList } from '@/composables/useList'
import { useAccess } from '@/composables/useAccess'
import { purchasesService } from '@/services/purchases.service'
import { useToastStore } from '@/stores/toast'
import { formatMoney } from '@/utils/money'
import { todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { InvoiceAmountLine, PaymentApproval } from '@/types/purchases'

const t = cxp.approvals
const toast = useToastStore()
const { canWrite } = useAccess()
const lines = ref<InvoiceAmountLine[]>([])
const reloadKey = ref(0)
const grid = ref<InstanceType<typeof PayableInvoicesGrid> | null>(null)
const form = reactive({ date: todayISO(), beneficiaryId: '', note: '' })
const saving = ref(false)
const error = ref('')

const manySuppliers = computed(() => new Set(lines.value.map((l) => l.supplierId)).size > 1)
const total = computed(() => lines.value.reduce((a, l) => a + l.amount, 0))

const pending = useList(
  (p) => purchasesService.listApprovals(p),
  () => ({ status: 'pendiente' }),
)
const columns: Column<PaymentApproval>[] = [
  { key: 'number', label: 'N.°', format: 'int', width: '5rem' },
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'beneficiary', label: 'Beneficiario', value: (a) => a.beneficiaryId?.name },
  { key: 'invoices', label: 'Facturas', value: (a) => a.lines.map((l) => l.invoiceId?.docNumber).join(', ') },
  { key: 'note', label: 'Nota' },
  { key: 'total', label: 'Total', format: 'money', total: true },
  { key: 'actions', label: '', screenOnly: true },
]

async function save() {
  error.value = ''
  if (!lines.value.length) return (error.value = 'Escribe cuánto aprobar en al menos una factura')
  if (grid.value?.over.length) return (error.value = 'Hay valores mayores al saldo libre de la factura')
  if (manySuppliers.value && !form.beneficiaryId) return (error.value = 'Con varios proveedores indica el beneficiario del pago')
  saving.value = true
  try {
    const a = await purchasesService.approve({
      lines: lines.value.map(({ invoiceId, amount }) => ({ invoiceId, amount })),
      date: form.date,
      beneficiaryId: form.beneficiaryId || undefined,
      note: form.note,
    })
    toast.success(`${t.saved}: N.° ${a.number} por ${formatMoney(a.total)}`)
    form.note = ''
    form.beneficiaryId = ''
    reloadKey.value++
    pending.reload()
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}

const cancelling = ref<PaymentApproval | null>(null)
const cancelBusy = ref(false)
const cancelError = ref('')
async function doCancel() {
  cancelBusy.value = true
  cancelError.value = ''
  try {
    await purchasesService.cancelApproval(cancelling.value!._id)
    toast.success('Aprobación anulada')
    cancelling.value = null
    reloadKey.value++
    pending.reload()
  } catch (e) {
    cancelError.value = (e as ApiError).message
  } finally {
    cancelBusy.value = false
  }
}
</script>

<template>
  <section class="ap">
    <PageHeader />
    <p class="ap__note" role="note"><AppIcon name="info" /> {{ t.noAccounting }}</p>

    <PayableInvoicesGrid ref="grid" v-model="lines" allow-all :reload-key="reloadKey" />

    <section v-if="canWrite" class="panel panel--pad">
      <div class="form-grid">
        <FormField label="Fecha" for="ap-date" class="narrow">
          <BaseDatePicker id="ap-date" v-model="form.date" />
        </FormField>
        <FormField v-bind="t.fields.beneficiary" for="ap-benef" :required="manySuppliers">
          <PartyPicker id="ap-benef" v-model="form.beneficiaryId" clearable />
        </FormField>
        <FormField v-bind="t.fields.note" for="ap-note">
          <input id="ap-note" v-model="form.note" maxlength="200" />
        </FormField>
      </div>
      <p v-if="error" class="ap__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>
      <div class="ap__actions">
        <span>{{ t.totalApproved }} <strong class="num">{{ formatMoney(total) }}</strong></span>
        <button type="button" class="btn btn--primary" :disabled="saving" @click="save">
          <AppIcon :name="saving ? 'spinner' : 'check'" :spin="saving" /> {{ t.save }}
        </button>
      </div>
    </section>

    <h3 class="ap__title">{{ t.pendingList }}</h3>
    <DataTable :columns="columns" :rows="pending.items" :loading="pending.loading" :error="pending.error" :page="pending.page" :pages="pending.pages" :total="pending.total" @update:page="pending.page = $event" @retry="pending.reload">
      <template #cell-actions="{ row }">
        <button v-if="canWrite" type="button" class="btn btn--ghost btn--sm" @click="cancelling = row"><AppIcon name="x" /> Anular</button>
      </template>
    </DataTable>

    <ConfirmModal
      :open="!!cancelling"
      danger
      :title="t.cancel"
      :subject="cancelling ? `N.° ${cancelling.number} · ${cancelling.beneficiaryId?.name} · ${formatMoney(cancelling.total)}` : ''"
      :message="t.cancelMessage"
      :second-message="t.cancelSecond"
      :second-label="t.cancel"
      :loading="cancelBusy"
      :error="cancelError"
      @confirm="doCancel"
      @cancel="cancelling = null"
    />
  </section>
</template>

<style scoped lang="scss">
.ap {
  @include flex(column, stretch, flex-start, 1rem);
}

.ap__note {
  @include flex(row, flex-start, flex-start, 0.5rem);
  padding: 0.7rem 0.9rem;
  border-radius: 6px;
  background: $info-bg;
  color: $info;
}

.ap__error {
  margin-top: 0.75rem;
  color: $danger;
}

.ap__actions {
  @include flex(row, center, flex-end, 1rem);
  flex-wrap: wrap;
  margin-top: 1rem;

  strong {
    font-size: 1.15rem;
  }
}

.ap__title {
  font-size: 1rem;
  font-weight: 600;
}
</style>
