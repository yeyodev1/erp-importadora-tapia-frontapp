<script setup lang="ts">
import { computed } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import WarehousePicker from '@/components/pickers/WarehousePicker.vue'
import { formatMoney } from '@/utils/money'
import { cxp } from '@/config/copy/cxp'
import { blankExpense, blankProduct, type useInvoiceForm } from '@/composables/purchases/useInvoiceForm'
import type { ExpenseLine, ProductLine } from '@/composables/purchases/invoiceMath'
import type { LineColumn } from '@/components/documents/lines'

/** Líneas de gasto (cuenta contable) o de productos (bodega) + IVA de la factura. */
const props = defineProps<{ ctx: ReturnType<typeof useInvoiceForm> }>()

const t = cxp.invoices
const form = computed(() => props.ctx.form)
const totals = computed(() => props.ctx.totals.value)
const defaultAccount = computed(() => props.ctx.supplier.value?.supplier?.defaultExpenseAccount ?? '')

const expenseColumns: LineColumn<ExpenseLine>[] = [
  { key: 'accountCode', label: 'Cuenta de gasto', type: 'account', width: '34%' },
  { key: 'description', label: 'Detalle', type: 'text', width: '26%' },
  { key: 'base0', label: 'Base 0 %', type: 'money', total: true },
  { key: 'baseVat', label: 'Base 15 %', type: 'money', total: true },
]
const productColumns: LineColumn<ProductLine>[] = [
  { key: 'productId', label: 'Producto', type: 'product', width: '40%' },
  { key: 'qty', label: 'Cantidad', type: 'qty', total: true },
  { key: 'subtotal', label: 'Subtotal', type: 'money', total: true },
  { key: 'vatRate', label: 'IVA', type: 'readonly', value: (l) => `${l.vatRate} %` },
]
</script>

<template>
  <section class="panel panel--pad il">
    <BaseSegmented v-model="form.lineKind" tabs :options="cxp.lineKinds" :label="t.expenseLines" />
    <DocumentLines
      v-if="form.lineKind === 'gasto'"
      v-model="form.expenseLines"
      id-prefix="exp"
      :columns="expenseColumns"
      :new-line="() => blankExpense(defaultAccount)"
    />
    <template v-else>
      <div class="form-grid">
        <FormField v-bind="t.fields.warehouse" for="inv-wh" required>
          <WarehousePicker id="inv-wh" v-model="form.warehouseId" />
        </FormField>
      </div>
      <DocumentLines v-model="form.productLines" id-prefix="prd" :columns="productColumns" :new-line="blankProduct" @pick-product="ctx.onProduct" />
    </template>

    <div class="il__totals">
      <span>Base 0 % <strong class="num">{{ formatMoney(totals.base0) }}</strong></span>
      <span>Base 15 % <strong class="num">{{ formatMoney(totals.baseVat) }}</strong></span>
      <FormField v-bind="t.fields.vat" for="inv-vat" :hint="form.vat != null && form.vat !== totals.vatAuto ? `Calculado: ${formatMoney(totals.vatAuto)}` : ''">
        <MoneyInput id="inv-vat" :model-value="totals.vat" @update:model-value="form.vat = $event" />
      </FormField>
      <span class="il__total">Total <strong class="num">{{ formatMoney(totals.total) }}</strong></span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.il {
  @include flex(column, stretch, flex-start, 1rem);
}

.il__totals {
  @include flex(row, flex-end, flex-end, 1rem 1.5rem);
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid $line;

  > span {
    @include flex(column, flex-end, flex-start, 0.15rem);
    font-size: 0.85rem;
    color: $ink-muted;
  }

  strong {
    color: $ink;
    font-size: 1rem;
  }
}

.il__total strong {
  font-size: 1.15rem;
}
</style>
