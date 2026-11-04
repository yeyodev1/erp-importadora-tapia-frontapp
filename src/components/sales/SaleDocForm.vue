<script setup lang="ts">
import { computed } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import WarehousePicker from '@/components/pickers/WarehousePicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import type { LineColumn } from '@/components/documents/lines'
import SaleTotals from './SaleTotals.vue'
import { blankLine, type FormLine, type SaleForm } from '@/composables/sales/useSaleForm'
import { lineSubtotal } from '@/composables/sales/saleMath'
import { formatQty } from '@/utils/money'
import { facturacion as t } from '@/config/copy/facturacion'

/** Formulario de factura o proforma (misma cabecera y líneas). La lógica vive en useSaleForm. */
const props = defineProps<{ form: SaleForm; submitLabel: string; idPrefix: string }>()
const emit = defineEmits<{ cancel: [] }>()

// Refs sueltos: el template los desenvuelve y v-model escribe en el ref, no en la prop.
const { head: h, lines, totals, saving, error, short, stockOf, pickParty, pickProduct, save } = props.form
const f = t.fields
const priceLists = computed(() => [...new Set([...t.priceLists, h.priceList])].map((v) => ({ value: v, label: v })))

const columns: LineColumn<FormLine>[] = [
  { key: 'productId', label: t.cols.product, type: 'product', width: '34%' },
  { key: 'stock', label: t.cols.stock, type: 'readonly', width: '6rem' },
  { key: 'qty', label: t.cols.qty, type: 'qty', width: '7rem' },
  { key: 'unitPrice', label: t.cols.price, type: 'money', width: '8rem' },
  { key: 'discount', label: t.cols.discount, type: 'money', width: '7rem' },
  { key: 'vatRate', label: t.cols.vatRate, type: 'readonly', width: '4rem' },
  { key: 'subtotal', label: t.cols.lineTotal, type: 'readonly', format: 'money', total: true, width: '8rem', value: (l) => (l.productId ? lineSubtotal(l) : null) },
]
</script>

<template>
  <form class="sdf" @submit.prevent="save()">
    <div class="panel panel--pad form-grid">
      <FormField v-bind="f.warehouse" :for="`${idPrefix}-wh`" required>
        <WarehousePicker :id="`${idPrefix}-wh`" v-model="h.warehouseId" />
      </FormField>
      <FormField v-bind="f.date" :for="`${idPrefix}-date`" required class="narrow">
        <BaseDatePicker :id="`${idPrefix}-date`" v-model="h.date" />
      </FormField>
      <FormField v-bind="f.party" :for="`${idPrefix}-party`" required full>
        <PartyPicker :id="`${idPrefix}-party`" v-model="h.partyId" role="customer" @pick="pickParty" />
      </FormField>
      <FormField v-bind="f.seller" :for="`${idPrefix}-seller`">
        <input :id="`${idPrefix}-seller`" v-model="h.sellerName" />
      </FormField>
      <FormField v-bind="f.creditDays" :for="`${idPrefix}-days`" class="narrow">
        <input :id="`${idPrefix}-days`" v-model.number="h.creditDays" inputmode="numeric" class="num" />
      </FormField>
      <FormField v-bind="f.priceList" :for="`${idPrefix}-list`">
        <BaseCombobox :id="`${idPrefix}-list`" v-model="h.priceList" :options="priceLists" />
      </FormField>
      <FormField v-bind="f.paymentMethod" :for="`${idPrefix}-pay`">
        <BaseCombobox :id="`${idPrefix}-pay`" v-model="h.paymentMethod" :options="t.paymentMethods" />
      </FormField>
      <FormField v-bind="f.orderRef" :for="`${idPrefix}-order`" class="narrow">
        <input :id="`${idPrefix}-order`" v-model="h.orderRef" />
      </FormField>
      <FormField v-bind="f.notes" :for="`${idPrefix}-notes`">
        <input :id="`${idPrefix}-notes`" v-model="h.notes" />
      </FormField>
    </div>

    <DocumentLines v-model="lines" :columns="columns" :new-line="blankLine" :id-prefix="`${idPrefix}-l`" @pick-product="pickProduct">
      <template #cell-stock="{ line }">
        <span class="sdf__stock num" :class="{ 'is-short': short(line) }" :title="short(line) ? t.invoices.stockShort : undefined">
          <AppIcon v-if="short(line)" name="alert" />
          {{ stockOf(line) == null ? '—' : formatQty(stockOf(line)) }}
        </span>
      </template>
      <template #cell-vatRate="{ line }">
        <span class="num">{{ line.productId ? `${line.vatRate} %` : '' }}</span>
      </template>
    </DocumentLines>

    <div class="panel panel--pad sdf__foot">
      <SaleTotals :totals="totals" />
      <p v-if="error" class="sdf__error" role="alert">{{ error }}</p>
      <div class="sdf__actions">
        <button type="button" class="btn btn--ghost" :disabled="saving" @click="emit('cancel')">{{ t.actions.cancel }}</button>
        <button type="submit" class="btn btn--primary" :disabled="saving">
          <AppIcon :name="saving ? 'spinner' : 'check'" :spin="saving" />
          {{ saving ? t.actions.saving : submitLabel }}
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped lang="scss">
.sdf {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__stock {
    @include flex(row, center, flex-end, 0.3rem);

    &.is-short {
      color: $danger;
      font-weight: 600;
    }
  }

  &__foot {
    @include flex(column, stretch, flex-start, 0.75rem);
  }

  &__error {
    margin: 0;
    color: $danger;
  }

  &__actions {
    @include flex(row, center, flex-end, 0.5rem);
    flex-wrap: wrap;
  }
}
</style>
