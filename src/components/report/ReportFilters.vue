<script setup lang="ts">
import { reactive } from 'vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import FormField from '@/components/ui/FormField.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import WarehousePicker from '@/components/pickers/WarehousePicker.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import ProductPicker from '@/components/pickers/ProductPicker.vue'
import AccountPicker from '@/components/pickers/AccountPicker.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import { useCatalogStore } from '@/stores/catalog'
import { site } from '@/config/site'
import { formatDay } from '@/utils/format'
import type { ReportFilterField, ReportFilterValues } from './filters'

/**
 * Barra de filtros de reportes. `fields` elige cuáles se muestran; el
 * slot agrega filtros propios del reporte. Al consultar emite `apply` con
 * el resumen en texto (para la hoja impresa: "Bodega: Guayaquil").
 */
const props = withDefaults(
  defineProps<{
    fields?: ReportFilterField[]
    partyRole?: 'customer' | 'supplier' | 'employee'
    loading?: boolean
  }>(),
  { fields: () => ['range'], partyRole: undefined },
)

const model = defineModel<ReportFilterValues>({ required: true })
const emit = defineEmits<{ apply: [summary: string[]] }>()

const catalog = useCatalogStore()
const t = site.filters
const labels = reactive({ party: '', product: '', account: '' })
const has = (f: ReportFilterField) => props.fields.includes(f)

function summary(): string[] {
  const m = model.value
  const out: string[] = []
  if (has('range') && (m.from || m.to)) out.push(`${t.from} ${formatDay(m.from) || '…'} ${t.to.toLowerCase()} ${formatDay(m.to) || '…'}`)
  if (m.warehouseId) out.push(`${t.warehouse}: ${catalog.warehouseName(m.warehouseId)}`)
  if (m.bankAccountId) out.push(`${t.bankAccount}: ${catalog.bankAccounts.find((b) => b._id === m.bankAccountId)?.name ?? ''}`)
  if (m.partyId && labels.party) out.push(`${t.party}: ${labels.party}`)
  if (m.productId && labels.product) out.push(`${t.product}: ${labels.product}`)
  if (m.accountCode) out.push(`${t.account}: ${labels.account || m.accountCode}`)
  return out
}
</script>

<template>
  <form class="rf panel panel--pad" @submit.prevent="emit('apply', summary())">
    <div class="form-grid">
      <template v-if="has('range')">
        <FormField :label="t.from" for="rf-from" class="narrow">
          <BaseDatePicker id="rf-from" v-model="model.from" :range-end="model.to" clearable />
        </FormField>
        <FormField :label="t.to" for="rf-to" class="narrow">
          <BaseDatePicker id="rf-to" v-model="model.to" :range-start="model.from" clearable />
        </FormField>
      </template>
      <FormField v-if="has('warehouse')" :label="t.warehouse" for="rf-wh">
        <WarehousePicker id="rf-wh" v-model="model.warehouseId" :empty-label="t.all" />
      </FormField>
      <FormField v-if="has('bankAccount')" :label="t.bankAccount" for="rf-bank">
        <BankAccountPicker id="rf-bank" v-model="model.bankAccountId" :empty-label="t.all" />
      </FormField>
      <FormField v-if="has('party')" :label="t.party" for="rf-party">
        <PartyPicker id="rf-party" v-model="model.partyId" :role="partyRole" clearable @pick="labels.party = $event?.name ?? ''" />
      </FormField>
      <FormField v-if="has('product')" :label="t.product" for="rf-product">
        <ProductPicker id="rf-product" v-model="model.productId" clearable @pick="labels.product = $event ? `${$event.code} ${$event.name}` : ''" />
      </FormField>
      <FormField v-if="has('account')" :label="t.account" for="rf-account">
        <AccountPicker id="rf-account" v-model="model.accountCode" clearable @pick="labels.account = $event ? `${$event.code} ${$event.name}` : ''" />
      </FormField>
      <slot />
      <div class="rf__submit">
        <button type="submit" class="btn btn--primary" :disabled="loading">
          <AppIcon :name="loading ? 'spinner' : 'search'" :spin="loading" /> {{ t.apply }}
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped lang="scss">
.rf {
  margin-bottom: 0.75rem;

  &__submit {
    @include flex(row, flex-end, flex-start);
    flex: 0 0 auto !important;
  }
}
</style>
