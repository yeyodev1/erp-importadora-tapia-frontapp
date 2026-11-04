<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import { useCatalogStore } from '@/stores/catalog'
import { cxp } from '@/config/copy/cxp'

/** Banco, medio (cheque o transferencia) y fecha de un pago o anticipo; avisa el cheque que se va a usar y si el mes está cerrado. */
const model = defineModel<{ bankAccountId: string; method: 'CHEQUE' | 'TRANSFERENCIA'; date: string }>({ required: true })
defineProps<{ idPrefix: string }>()

const f = cxp.payments.fields
const catalog = useCatalogStore()
onMounted(() => catalog.ensure('bankAccounts'))
const nextCheck = computed(() => catalog.bankAccounts.find((b) => b._id === model.value.bankAccountId)?.nextCheck)
</script>

<template>
  <div class="form-grid">
    <LockedDateBanner :date="model.date" class="full" />
    <FormField v-bind="f.bank" :for="`${idPrefix}-bank`" required>
      <BankAccountPicker :id="`${idPrefix}-bank`" v-model="model.bankAccountId" kind="banco" />
    </FormField>
    <FormField v-bind="f.method">
      <BaseSegmented
        v-model="model.method"
        :label="f.method.label"
        :options="cxp.methods"
      />
    </FormField>
    <FormField v-bind="f.date" :for="`${idPrefix}-date`" required class="narrow">
      <BaseDatePicker :id="`${idPrefix}-date`" v-model="model.date" />
    </FormField>
    <AlertBanner v-if="model.method === 'CHEQUE' && model.bankAccountId" level="info" icon="wallet" class="full" :title="cxp.payments.checkTitle(nextCheck)" :message="cxp.payments.checkMessage" />
  </div>
</template>
