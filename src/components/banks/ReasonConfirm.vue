<script setup lang="ts">
import { ref, watch } from 'vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import { bancos } from '@/config/copy/bancos'

/**
 * Acción destructiva con motivo: primero se escribe el motivo y luego la
 * doble confirmación de ConfirmModal. Sin `reason` va directo a la doble
 * confirmación. Emite `confirm(motivo)`.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    secondMessage: string
    confirmLabel?: string
    subject?: string
    /** Copy del campo de motivo; si no se pasa, no se pide motivo. */
    reason?: { label: string; help: string }
    loading?: boolean
    error?: string
  }>(),
  { confirmLabel: undefined, subject: '', reason: undefined, error: '' },
)
const emit = defineEmits<{ confirm: [reason: string]; cancel: [] }>()

const text = ref('')
const step = ref<'reason' | 'confirm'>('reason')
const missing = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    text.value = ''
    missing.value = false
    step.value = props.reason ? 'reason' : 'confirm'
  },
)

function next() {
  missing.value = !text.value.trim()
  if (!missing.value) step.value = 'confirm'
}
</script>

<template>
  <FormDialog
    :open="open && step === 'reason'"
    :title="title"
    :submit-label="confirmLabel"
    @submit="next"
    @close="emit('cancel')"
  >
    <p class="rc__msg">{{ message }}</p>
    <FormField
      v-if="reason"
      v-bind="reason"
      for="rc-reason"
      required
      :error="missing ? bancos.reason.required : ''"
    >
      <textarea id="rc-reason" v-model="text" rows="3" maxlength="300" />
    </FormField>
  </FormDialog>
  <ConfirmModal
    :open="open && step === 'confirm'"
    danger
    :title="title"
    :subject="subject || text"
    :message="message"
    :second-message="secondMessage"
    :confirm-label="confirmLabel"
    :second-label="confirmLabel"
    :loading="loading"
    :error="error"
    @confirm="emit('confirm', text.trim())"
    @cancel="emit('cancel')"
  />
</template>

<style scoped lang="scss">
.rc__msg {
  margin: 0 0 0.75rem;
  color: $ink-soft;
}
</style>
