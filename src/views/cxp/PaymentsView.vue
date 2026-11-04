<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import BankOutFields from '@/components/purchases/BankOutFields.vue'
import TransactionsTable from '@/components/purchases/TransactionsTable.vue'
import { useAccess } from '@/composables/useAccess'
import { purchasesService } from '@/services/purchases.service'
import { useCatalogStore } from '@/stores/catalog'
import { useToastStore } from '@/stores/toast'
import { formatMoney } from '@/utils/money'
import { todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { PaymentApproval } from '@/types/purchases'

const t = cxp.payments
const { canWrite } = useAccess()
const catalog = useCatalogStore()
const toast = useToastStore()
const tab = ref<'toPay' | 'done'>('toPay')
const beneficiaryId = ref('')
const approvals = ref<PaymentApproval[]>([])
const selected = reactive<Record<string, boolean>>({})
const loading = ref(false)
const bank = ref({ bankAccountId: '', method: 'CHEQUE' as 'CHEQUE' | 'TRANSFERENCIA', date: todayISO() })
const saving = ref(false)
const error = ref('')
const done = ref<InstanceType<typeof TransactionsTable> | null>(null)

async function load() {
  error.value = ''
  approvals.value = []
  if (!beneficiaryId.value) return
  loading.value = true
  try {
    approvals.value = (await purchasesService.listApprovals({ status: 'pendiente', beneficiaryId: beneficiaryId.value, limit: 500 })).items
    approvals.value.forEach((a) => (selected[a._id] = true))
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}
watch(beneficiaryId, load)

const chosen = computed(() => approvals.value.filter((a) => selected[a._id]))
const total = computed(() => chosen.value.reduce((s, a) => s + a.total, 0))

const columns: Column<PaymentApproval>[] = [
  { key: 'pay', label: t.select, screenOnly: true, width: '6rem' },
  { key: 'number', label: 'Aprobación', format: 'int', width: '7rem' },
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'invoices', label: 'Facturas', value: (a) => a.lines.map((l) => `${l.invoiceId?.docNumber} (${formatMoney(l.amount)})`).join(', ') },
  { key: 'note', label: 'Nota' },
  { key: 'total', label: 'Valor', format: 'money', total: true },
]

async function pay() {
  error.value = ''
  if (!chosen.value.length) return (error.value = 'Elige al menos una aprobación')
  if (!bank.value.bankAccountId) return (error.value = 'Elige el banco')
  saving.value = true
  try {
    const tx = await purchasesService.pay({ approvalIds: chosen.value.map((a) => a._id), ...bank.value })
    toast.success(`${t.saved}: ${tx.number}${tx.checkNumber ? ` · cheque # ${tx.checkNumber}` : ''}`)
    catalog.invalidate('bankAccounts')
    done.value?.reload()
    await load()
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="py">
    <PageHeader />
    <BaseSegmented
      v-model="tab"
      tabs
      :options="[
        { value: 'toPay', label: t.toPay },
        { value: 'done', label: t.done },
      ]"
    />

    <template v-if="tab === 'toPay'">
      <section class="panel panel--pad">
        <div class="form-grid">
          <FormField v-bind="t.fields.beneficiary" for="py-benef" required>
            <PartyPicker id="py-benef" v-model="beneficiaryId" clearable />
          </FormField>
        </div>
      </section>
      <EmptyState v-if="!beneficiaryId" :message="t.choose" />
      <template v-else>
        <DataTable :columns="columns" :rows="approvals" :loading="loading" :exportable="false">
          <template #cell-pay="{ row }"><BaseSwitch v-model="selected[row._id]" :label="t.select" /></template>
        </DataTable>
        <section v-if="canWrite && approvals.length" class="panel panel--pad">
          <BankOutFields v-model="bank" id-prefix="py" />
          <p v-if="error" class="py__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>
          <div class="py__actions">
            <span>Total <strong class="num">{{ formatMoney(total) }}</strong></span>
            <button type="button" class="btn btn--primary" :disabled="saving" @click="pay">
              <AppIcon :name="saving ? 'spinner' : 'wallet'" :spin="saving" /> {{ t.execute }}
            </button>
          </div>
        </section>
      </template>
    </template>

    <div v-show="tab === 'done'"><TransactionsTable ref="done" kind="pago" :can-write="canWrite" /></div>
  </section>
</template>

<style scoped lang="scss">
.py {
  @include flex(column, stretch, flex-start, 1rem);
}

.py__error {
  margin-top: 0.75rem;
  color: $danger;
}

.py__actions {
  @include flex(row, center, flex-end, 1rem);
  flex-wrap: wrap;
  margin-top: 1rem;

  strong {
    font-size: 1.15rem;
  }
}
</style>
