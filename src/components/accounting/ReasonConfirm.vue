<script setup lang="ts">
import { ref, watch } from 'vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'

/**
 * Anular / reabrir con motivo: primero se explica y se escribe el motivo,
 * luego la doble confirmación de ConfirmModal. Emite `confirm(motivo)`.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    secondMessage: string
    reason: { label: string; help: string }
    subject?: string
    loading?: boolean
    error?: string
  }>(),
  { subject: '', error: '' },
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
    step.value = 'reason'
  },
)

function next() {
  missing.value = !text.value.trim()
  if (!missing.value) step.value = 'confirm'
}
</script>

<template>
  <FormDialog :open="open && step === 'reason'" :title="title" :submit-label="title" @submit="next" @close="emit('cancel')">
    <p class="rc__msg">{{ message }}</p>
    <FormField v-bind="reason" for="acc-reason" required :error="missing ? `${reason.label}: obligatorio` : ''">
      <textarea id="acc-reason" v-model="text" rows="3" maxlength="300" />
    </FormField>
  </FormDialog>
  <ConfirmModal
    :open="open && step === 'confirm'"
    danger
    :title="title"
    :subject="subject ? `${subject} · ${text}` : text"
    :message="message"
    :second-message="secondMessage"
    :second-label="title"
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
