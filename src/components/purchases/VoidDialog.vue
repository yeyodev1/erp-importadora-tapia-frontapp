<script setup lang="ts">
import { ref, watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { cxp } from '@/config/copy/cxp'

/**
 * Anular un documento de CxP: pide el motivo (el API lo exige) y luego la
 * doble confirmación de ConfirmModal. Emite `confirm(reason)`.
 */
const props = defineProps<{
  open: boolean
  title: string
  subject: string
  message: string
  secondMessage: string
  loading?: boolean
  error?: string
}>()
const emit = defineEmits<{ confirm: [reason: string]; cancel: [] }>()

const reason = ref('')
const confirming = ref(false)
const missing = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    reason.value = ''
    confirming.value = false
    missing.value = false
  },
)

function next() {
  missing.value = !reason.value.trim()
  if (!missing.value) confirming.value = true
}
</script>

<template>
  <FormDialog :open="open && !confirming" :title="title" :submit-label="title" @submit="next" @close="emit('cancel')">
    <p class="vd__subject">{{ subject }}</p>
    <FormField v-bind="cxp.invoices.fields.reason" for="void-reason" required :error="missing ? 'Indica el motivo' : ''" full>
      <input id="void-reason" v-model="reason" maxlength="200" :placeholder="cxp.invoices.placeholders.reason" />
    </FormField>
  </FormDialog>
  <ConfirmModal
    :open="open && confirming"
    danger
    :title="title"
    :subject="subject"
    :message="message"
    :second-message="secondMessage"
    :second-label="title"
    :loading="loading"
    :error="error"
    @confirm="emit('confirm', reason.trim())"
    @cancel="confirming = false"
  />
</template>

<style scoped lang="scss">
.vd__subject {
  font-weight: 600;
  margin-bottom: 0.75rem;
}
</style>
