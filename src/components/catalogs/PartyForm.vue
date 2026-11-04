<script setup lang="ts">
import { computed, ref } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import AccountPicker from '@/components/pickers/AccountPicker.vue'
import { site } from '@/config/site'
import type { FormOf } from '@/composables/useEditor'
import type { IdType, Party } from '@/types'

/** Formulario de tercero: datos generales y, según sus banderas, los de cliente y proveedor. */
const form = defineModel<FormOf<Party>>({ required: true })

const t = site.catalogs.parties
const f = t.fields
const idTypes = (Object.keys(t.idTypes) as IdType[]).map((value) => ({ value, label: t.idTypes[value], hint: t.idTypeHints[value] }))

// shortcut: las listas de precios no tienen catálogo propio; se ofrecen GENERAL y las que se escriban.
const lists = ref(['GENERAL'])
const listOptions = computed(() =>
  [...new Set([...lists.value, form.value.customer.priceList].filter(Boolean))].map((l) => ({ value: l, label: l })),
)
async function addList(name: string) {
  const value = name.toUpperCase()
  lists.value.push(value)
  return value
}

const days = (value: string) => Math.max(0, Math.trunc(Number(value) || 0))
</script>

<template>
  <div class="form-grid">
    <FormField v-bind="f.idType" for="pt-idtype" required>
      <BaseCombobox id="pt-idtype" v-model="form.idType" :options="idTypes" />
    </FormField>
    <FormField v-bind="f.identification" for="pt-id" required>
      <input id="pt-id" v-model.trim="form.identification" class="mono" inputmode="numeric" required :placeholder="t.ph.identification" />
    </FormField>
    <FormField v-bind="f.name" for="pt-name" required full>
      <input id="pt-name" v-model="form.name" required :placeholder="t.ph.name" />
    </FormField>
    <FormField v-bind="f.address" for="pt-addr" full>
      <input id="pt-addr" v-model="form.address" :placeholder="t.ph.address" />
    </FormField>
    <FormField v-bind="f.phone" for="pt-phone">
      <input id="pt-phone" v-model="form.phone" inputmode="tel" :placeholder="t.ph.phone" />
    </FormField>
    <FormField v-bind="f.email" for="pt-email">
      <input id="pt-email" v-model.trim="form.email" type="email" :placeholder="t.ph.email" />
    </FormField>
    <div class="full flags">
      <BaseSwitch v-model="form.isCustomer" v-bind="f.isCustomer" />
      <BaseSwitch v-model="form.isSupplier" v-bind="f.isSupplier" />
      <BaseSwitch v-model="form.isEmployee" v-bind="f.isEmployee" />
    </div>

    <template v-if="form.isCustomer">
      <p class="form-section full">{{ t.customerSection }}</p>
      <FormField v-bind="f.sellerName" for="pt-seller">
        <input id="pt-seller" v-model="form.customer.sellerName" :placeholder="t.ph.sellerName" />
      </FormField>
      <FormField v-bind="f.sellerCode" for="pt-sellercode" class="narrow">
        <input id="pt-sellercode" v-model="form.customer.sellerCode" class="mono" :placeholder="t.ph.sellerCode" />
      </FormField>
      <FormField v-bind="f.creditDays" for="pt-cdays" class="narrow">
        <input id="pt-cdays" :value="form.customer.creditDays" inputmode="numeric" class="num" :placeholder="t.ph.creditDays" @input="form.customer.creditDays = days(($event.target as HTMLInputElement).value)" />
      </FormField>
      <FormField v-bind="f.priceList" for="pt-plist">
        <BaseCombobox id="pt-plist" v-model="form.customer.priceList" :options="listOptions" create-label="Crear lista" :on-create="addList" />
      </FormField>
      <FormField v-bind="f.customerType" for="pt-ctype">
        <input id="pt-ctype" v-model="form.customer.customerType" :placeholder="t.ph.customerType" />
      </FormField>
      <FormField v-bind="f.parish" for="pt-parish">
        <input id="pt-parish" v-model="form.customer.parish" :placeholder="t.ph.parish" />
      </FormField>
      <FormField v-bind="f.branch" for="pt-branch">
        <input id="pt-branch" v-model="form.customer.branch" :placeholder="t.ph.branch" />
      </FormField>
      <BaseSwitch v-model="form.customer.withholdsVat" v-bind="f.withholdsVat" />
    </template>

    <template v-if="form.isSupplier">
      <p class="form-section full">{{ t.supplierSection }}</p>
      <FormField v-bind="f.supplierCreditDays" for="pt-sdays" class="narrow">
        <input id="pt-sdays" :value="form.supplier.creditDays" inputmode="numeric" class="num" :placeholder="t.ph.supplierCreditDays" @input="form.supplier.creditDays = days(($event.target as HTMLInputElement).value)" />
      </FormField>
      <FormField v-bind="f.defaultExpenseAccount" for="pt-exp">
        <AccountPicker id="pt-exp" v-model="form.supplier.defaultExpenseAccount" clearable />
      </FormField>
    </template>

    <p class="form-section full"></p>
    <BaseSwitch v-model="form.isActive" v-bind="f.isActive" />
  </div>
</template>

<style scoped lang="scss">
.flags {
  @include flex(row, center, flex-start, 0.5rem 1.25rem);
  flex-wrap: wrap;
}
</style>
