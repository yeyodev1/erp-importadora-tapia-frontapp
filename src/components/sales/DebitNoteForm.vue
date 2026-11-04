<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import InvoicePicker from './InvoicePicker.vue'
import SaleTotals from './SaleTotals.vue'
import { saleTotals } from '@/composables/sales/saleMath'
import { salesService, type DebitNote } from '@/services/sales.service'
import { todayISO } from '@/utils/format'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'

/** Nota de débito: cargo adicional (interés, flete) con IVA sobre una factura; sube su saldo. */
const emit = defineEmits<{ saved: [note: DebitNote]; cancel: [] }>()
const form = reactive({ partyId: '', invoiceId: '', date: todayISO(), reason: '', amount: null as number | null, vatRate: 15 })
const saving = ref(false)
const error = ref('')
const f = t.fields
const rates = [0, 5, 15].map((v) => ({ value: v, label: `${v} %`, help: t.vatRateHelp[v] }))
const totals = computed(() => saleTotals([{ qty: 1, unitPrice: form.amount, discount: 0, vatRate: form.vatRate }]))

async function save() {
  error.value = ''
  saving.value = true
  try {
    const note = await salesService.createDebitNote({ invoiceId: form.invoiceId, date: form.date, reason: form.reason.trim(), amount: form.amount ?? 0, vatRate: form.vatRate })
    emit('saved', note)
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="panel panel--pad ndf" @submit.prevent="save">
    <LockedDateBanner :date="form.date" />
    <div class="form-grid">
      <FormField v-bind="f.party" for="nd-party" required>
        <PartyPicker id="nd-party" v-model="form.partyId" role="customer" @pick="form.invoiceId = ''" />
      </FormField>
      <FormField v-bind="f.invoice" for="nd-inv" required>
        <InvoicePicker id="nd-inv" v-model="form.invoiceId" :party-id="form.partyId" />
      </FormField>
      <FormField v-bind="f.date" for="nd-date" required class="narrow">
        <BaseDatePicker id="nd-date" v-model="form.date" />
      </FormField>
      <FormField v-bind="f.reason" for="nd-reason" required full>
        <input id="nd-reason" v-model="form.reason" required maxlength="300" :placeholder="t.placeholders.debitReason" />
      </FormField>
      <FormField v-bind="f.amount" for="nd-amount" required>
        <MoneyInput id="nd-amount" v-model="form.amount" />
      </FormField>
      <FormField v-bind="f.vatRate">
        <BaseSegmented v-model="form.vatRate" :options="rates" :label="f.vatRate.label" />
      </FormField>
    </div>
    <SaleTotals :totals="totals" />
    <p v-if="error" class="ndf__error" role="alert">{{ error }}</p>
    <div class="ndf__actions">
      <button type="button" class="btn btn--ghost" :disabled="saving" @click="emit('cancel')">{{ t.actions.cancel }}</button>
      <BaseButton type="submit" variant="primary" icon="check" :loading="saving" :disabled="!form.invoiceId || !form.amount">{{ t.actions.save }}</BaseButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.ndf {
  @include flex(column, stretch, flex-start, 0.75rem);
  margin-bottom: 1rem;

  &__error {
    margin: 0;
    color: $danger;
  }

  &__actions {
    @include flex(row, center, flex-end, 0.5rem);
    flex-wrap: wrap;
  }
}
</style>
