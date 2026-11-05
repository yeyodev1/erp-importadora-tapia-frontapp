<script setup lang="ts">
import FormField from '@/components/ui/FormField.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import { nomina } from '@/config/copy/nomina'
import type { Department, EmployeeFormData } from '@/types'

/** Ficha del trabajador. Fechas AAAA-MM-DD; sueldo en centavos. */
const form = defineModel<EmployeeFormData>({ required: true })
defineProps<{ isNew: boolean }>()

const t = nomina.employees
const f = t.fields
const departments = (['administracion', 'ventas'] as Department[]).map((value) => ({ value, label: nomina.departments[value], help: nomina.departmentHints[value] }))
</script>

<template>
  <div class="form-grid">
    <p class="form-section full">{{ t.personal }}</p>
    <FormField v-bind="f.identification" for="em-id" required :hint="isNew ? t.partyNote : undefined">
      <input id="em-id" v-model.trim="form.identification" class="mono" inputmode="numeric" maxlength="10" required :disabled="!isNew" :placeholder="t.ph.identification" />
    </FormField>
    <FormField v-bind="f.firstName" for="em-first" required>
      <input id="em-first" v-model="form.firstName" required :placeholder="t.ph.firstName" />
    </FormField>
    <FormField v-bind="f.lastName" for="em-last" required>
      <input id="em-last" v-model="form.lastName" required :placeholder="t.ph.lastName" />
    </FormField>
    <FormField v-bind="f.address" for="em-addr" full>
      <input id="em-addr" v-model="form.address" :placeholder="t.ph.address" />
    </FormField>
    <FormField v-bind="f.phone" for="em-phone">
      <input id="em-phone" v-model="form.phone" inputmode="tel" :placeholder="t.ph.phone" />
    </FormField>
    <FormField v-bind="f.email" for="em-email">
      <input id="em-email" v-model.trim="form.email" type="email" :placeholder="t.ph.email" />
    </FormField>

    <p class="form-section full">{{ t.job }}</p>
    <FormField v-bind="f.hireDate" for="em-hire" required class="narrow">
      <BaseDatePicker id="em-hire" v-model="form.hireDate" />
    </FormField>
    <FormField v-bind="f.department" required>
      <BaseSegmented v-model="form.department" :options="departments" :label="f.department.label" />
    </FormField>
    <FormField v-bind="f.position" for="em-pos">
      <input id="em-pos" v-model="form.position" :placeholder="t.ph.position" />
    </FormField>
    <FormField v-bind="f.salary" for="em-salary" required class="narrow">
      <MoneyInput id="em-salary" v-model="form.salary" />
    </FormField>
    <FormField v-bind="f.sellerName" for="em-seller">
      <input id="em-seller" v-model.trim="form.sellerName" :placeholder="t.ph.sellerName" />
    </FormField>
    <FormField v-bind="f.commissionRate" for="em-rate" class="narrow">
      <input id="em-rate" v-model="form.commissionRate" inputmode="decimal" class="num" :placeholder="t.ph.commissionRate" />
    </FormField>
    <div class="full flags">
      <BaseSwitch v-model="form.reserveFundMonthly" v-bind="f.reserveFundMonthly" />
      <BaseSwitch v-model="form.isActive" v-bind="f.isActive" />
    </div>
    <FormField v-bind="f.exitDate" for="em-exit" class="narrow">
      <BaseDatePicker id="em-exit" v-model="form.exitDate" clearable />
    </FormField>
  </div>
</template>

<style scoped lang="scss">
.flags {
  @include flex(row, center, flex-start, 0.5rem 1.25rem);
  flex-wrap: wrap;
}
</style>
