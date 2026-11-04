<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import { useCatalogStore } from '@/stores/catalog'
import { cxp } from '@/config/copy/cxp'

/** Banco, medio (cheque o transferencia) y fecha de un pago o anticipo; muestra el cheque que se va a usar. */
const model = defineModel<{ bankAccountId: string; method: 'CHEQUE' | 'TRANSFERENCIA'; date: string }>({ required: true })
defineProps<{ idPrefix: string }>()

const f = cxp.payments.fields
const catalog = useCatalogStore()
onMounted(() => catalog.ensure('bankAccounts'))
const nextCheck = computed(() => catalog.bankAccounts.find((b) => b._id === model.value.bankAccountId)?.nextCheck)
</script>

<template>
  <div class="form-grid">
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
    <p v-if="model.method === 'CHEQUE' && nextCheck" class="bo__check full">
      <AppIcon name="info" /> {{ cxp.payments.checkWillUse }} <strong class="mono">{{ nextCheck }}</strong>
    </p>
  </div>
</template>

<style scoped lang="scss">
.bo__check {
  @include flex(row, center, flex-start, 0.4rem);
  color: $info;
}
</style>
