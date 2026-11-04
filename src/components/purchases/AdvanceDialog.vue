<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import BankOutFields from './BankOutFields.vue'
import { purchasesService } from '@/services/purchases.service'
import { useCatalogStore } from '@/stores/catalog'
import { useToastStore } from '@/stores/toast'
import { todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'

/** Anticipo sin factura: a un proveedor (pago antes de la factura) o al empleado que compra a varios. */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const t = cxp.advances
const f = cxp.payments.fields
const catalog = useCatalogStore()
const toast = useToastStore()
const blank = () => ({ role: 'supplier' as 'supplier' | 'employee', partyId: '', amount: null as number | null, description: '' })
const form = reactive(blank())
const bank = ref({ bankAccountId: '', method: 'CHEQUE' as 'CHEQUE' | 'TRANSFERENCIA', date: todayISO() })
const saving = ref(false)
const error = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.assign(form, blank())
    error.value = ''
  },
)
watch(
  () => form.role,
  () => (form.partyId = ''),
)

async function submit() {
  error.value = ''
  if (!form.partyId) return (error.value = 'Elige el beneficiario')
  if (!form.amount || form.amount <= 0) return (error.value = 'El anticipo debe ser mayor que cero')
  if (!bank.value.bankAccountId) return (error.value = 'Elige el banco')
  saving.value = true
  try {
    const tx = await purchasesService.createAdvance({ partyId: form.partyId, amount: form.amount, description: form.description || undefined, ...bank.value })
    toast.success(`${t.saved}: ${tx.number}${tx.checkNumber ? ` · cheque # ${tx.checkNumber}` : ''}`)
    catalog.invalidate('bankAccounts')
    emit('saved')
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <FormDialog :open="open" :title="t.newTitle" :loading="saving" :error="error" @submit="submit" @close="emit('close')">
    <div class="form-grid">
      <FormField v-bind="t.roleField" full>
        <BaseSegmented v-model="form.role" :options="t.roles" :label="t.roleField.label" />
      </FormField>
      <FormField v-bind="cxp.approvals.fields.beneficiary" for="adv-party" required>
        <PartyPicker :key="form.role" id="adv-party" v-model="form.partyId" :role="form.role" />
      </FormField>
      <FormField v-bind="f.amount" for="adv-amount" required class="narrow">
        <MoneyInput id="adv-amount" v-model="form.amount" />
      </FormField>
      <FormField v-bind="f.description" for="adv-desc" full>
        <input id="adv-desc" v-model="form.description" maxlength="200" :placeholder="t.descriptionPlaceholder" />
      </FormField>
    </div>
    <BankOutFields v-model="bank" id-prefix="adv" class="adv__bank" />
  </FormDialog>
</template>

<style scoped lang="scss">
.adv__bank {
  margin-top: 0.85rem;
}
</style>
