<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import PayableInvoicesGrid from './PayableInvoicesGrid.vue'
import { purchasesService } from '@/services/purchases.service'
import { useToastStore } from '@/stores/toast'
import { formatMoney } from '@/utils/money'
import { todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { InvoiceAmountLine, PayableTransaction } from '@/types/purchases'

/**
 * Aplica el saldo de un anticipo: `cross` lo cruza contra facturas de uno o
 * varios proveedores; `refund` registra el sobrante devuelto al banco.
 */
const props = defineProps<{ advance: PayableTransaction | null; mode: 'cross' | 'refund' }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const t = cxp.advances
const toast = useToastStore()
const lines = ref<InvoiceAmountLine[]>([])
const form = reactive({ date: todayISO(), description: '', bankAccountId: '', amount: null as number | null })
const saving = ref(false)
const error = ref('')

const open = computed(() => (props.advance ? props.advance.amount - props.advance.applied : 0))
const crossTotal = computed(() => lines.value.reduce((s, l) => s + l.amount, 0))

watch(
  () => props.advance,
  (a) => {
    if (!a) return
    Object.assign(form, { date: todayISO(), description: '', bankAccountId: '', amount: a.amount - a.applied })
    lines.value = []
    error.value = ''
  },
)

async function submit() {
  const a = props.advance!
  error.value = ''
  if (props.mode === 'cross') {
    if (!lines.value.length) return (error.value = 'Escribe cuánto cruzar en al menos una factura')
    if (crossTotal.value > open.value) return (error.value = t.over)
  } else {
    if (!form.bankAccountId) return (error.value = 'Elige el banco donde se depositó')
    if (!form.amount || form.amount > open.value) return (error.value = `La devolución va de $0.01 a ${formatMoney(open.value)}`)
  }
  saving.value = true
  try {
    const tx =
      props.mode === 'cross'
        ? await purchasesService.crossAdvance(a._id, { date: form.date, description: form.description, lines: lines.value.map(({ invoiceId, amount }) => ({ invoiceId, amount })) })
        : await purchasesService.refundAdvance(a._id, { date: form.date, bankAccountId: form.bankAccountId, amount: form.amount })
    toast.success(`${props.mode === 'cross' ? t.crossed : t.refunded}: ${tx.number}`)
    emit('saved')
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <FormDialog
    :open="!!advance"
    :title="mode === 'cross' ? t.crossTitle : t.refundTitle"
    :wide="mode === 'cross'"
    :loading="saving"
    :error="error"
    @submit="submit"
    @close="emit('close')"
  >
    <p v-if="advance" class="aa__head">
      <strong class="mono">{{ advance.number }}</strong> · {{ advance.partyId?.name }} · {{ t.open }}
      <strong class="num">{{ formatMoney(open) }}</strong>
    </p>
    <div class="form-grid">
      <FormField v-bind="cxp.payments.fields.date" for="aa-date" required class="narrow">
        <BaseDatePicker id="aa-date" v-model="form.date" :range-start="advance?.date.slice(0, 10)" />
      </FormField>
      <template v-if="mode === 'cross'">
        <FormField v-bind="cxp.payments.fields.description" for="aa-desc">
          <input id="aa-desc" v-model="form.description" maxlength="200" :placeholder="cxp.payments.descriptionPlaceholder" />
        </FormField>
      </template>
      <template v-else>
        <FormField v-bind="cxp.payments.fields.bank" for="aa-bank" required>
          <BankAccountPicker id="aa-bank" v-model="form.bankAccountId" />
        </FormField>
        <FormField v-bind="cxp.payments.fields.amount" for="aa-amount" required class="narrow">
          <MoneyInput id="aa-amount" v-model="form.amount" />
        </FormField>
      </template>
    </div>
    <template v-if="mode === 'cross' && advance">
      <p class="aa__hint">{{ t.crossHint }}</p>
      <PayableInvoicesGrid v-model="lines" amount-label="Cruzar" />
      <p class="aa__left" :class="{ 'is-over': crossTotal > open }">
        Queda en el anticipo <strong class="num">{{ formatMoney(open - crossTotal) }}</strong>
      </p>
    </template>
  </FormDialog>
</template>

<style scoped lang="scss">
.aa__head {
  margin-bottom: 0.85rem;
}

.aa__hint {
  margin: 0.85rem 0 0.5rem;
  color: $ink-muted;
  font-size: 0.9rem;
}

.aa__left {
  margin-top: 0.5rem;
  text-align: right;

  &.is-over {
    color: $danger;
  }
}
</style>
