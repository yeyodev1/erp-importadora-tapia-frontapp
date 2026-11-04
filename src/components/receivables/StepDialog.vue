<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import { cxc } from '@/config/copy/cxc'
import { todayISO } from '@/utils/format'
import type { CheckStep } from '@/services/receivables.service'

/**
 * Acción sobre un documento ya grabado (depositar, acreditar, devolver,
 * anular): primero pide fecha y, si hace falta, banco o motivo; después
 * confirma con ConfirmModal (doble si viene `secondMessage`).
 */
const props = defineProps<{
  open: boolean
  title: string
  message: string
  subject?: string
  secondMessage?: string
  secondLabel?: string
  danger?: boolean
  bank?: boolean
  reason?: boolean
  loading?: boolean
  error?: string
}>()
const emit = defineEmits<{ confirm: [step: CheckStep]; cancel: [] }>()

const t = cxc.checks
const form = reactive({ date: todayISO(), bankAccountId: '', reason: '' })
const asking = ref(false)
const missing = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.assign(form, { date: todayISO(), bankAccountId: '', reason: '' })
    asking.value = false
    missing.value = ''
  },
)

function next() {
  missing.value = !form.date
    ? 'Elige la fecha'
    : props.bank && !form.bankAccountId
      ? 'Elige el banco'
      : props.reason && !form.reason.trim()
        ? 'Escribe el motivo'
        : ''
  if (!missing.value) asking.value = true
}

function confirm() {
  emit('confirm', {
    date: form.date,
    ...(props.bank ? { bankAccountId: form.bankAccountId } : {}),
    ...(props.reason ? { reason: form.reason.trim() } : {}),
  })
}
</script>

<template>
  <FormDialog
    :open="open && !asking"
    :title="title"
    :error="missing"
    :submit-label="title"
    @submit="next"
    @close="emit('cancel')"
  >
    <p v-if="subject" class="step__subject">{{ subject }}</p>
    <div class="form-grid">
      <FormField v-bind="t.date" for="step-date" required>
        <BaseDatePicker id="step-date" v-model="form.date" />
      </FormField>
      <FormField v-if="bank" v-bind="t.bank" for="step-bank" required>
        <BankAccountPicker id="step-bank" v-model="form.bankAccountId" kind="banco" />
      </FormField>
      <FormField v-if="reason" v-bind="t.reason" for="step-reason" required full>
        <input id="step-reason" v-model="form.reason" :placeholder="t.reasonPlaceholder" />
      </FormField>
    </div>
  </FormDialog>
  <ConfirmModal
    :open="open && asking"
    :title="title"
    :subject="subject"
    :message="message"
    :second-message="secondMessage"
    :second-label="secondLabel"
    :danger="danger"
    :loading="loading"
    :error="error"
    @confirm="confirm"
    @cancel="emit('cancel')"
  />
</template>

<style scoped lang="scss">
.step__subject {
  font-weight: 600;
  margin-bottom: 0.75rem;
}
</style>
