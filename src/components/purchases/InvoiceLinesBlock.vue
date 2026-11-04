<script setup lang="ts">
import { lineHelp } from '@/config/copy/lineHelp'
import { computed } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
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
const a = t.amounts
const th = t.totalsHelp
// Bloque "Totales" del sistema anterior: Base cero, Bases imponible, IVA, Subtotal, Retención y Total (a pagar).
const figures = computed(() => [
  { key: 'base0', label: a.base0, help: th.base0, value: totals.value.base0 },
  { key: 'baseVat', label: a.baseVat, help: th.baseVat, value: totals.value.baseVat },
])
const after = computed(() => [
  { key: 'subtotal', label: a.subtotal, help: th.subtotal, value: totals.value.total },
  { key: 'withholding', label: a.withholding, help: th.withholding, value: totals.value.withholdingTotal },
  { key: 'total', label: a.total, help: th.total, value: totals.value.payable },
])
const defaultAccount = computed(() => props.ctx.supplier.value?.supplier?.defaultExpenseAccount ?? '')

const expenseColumns: LineColumn<ExpenseLine>[] = [
  { key: 'accountCode', label: 'Cuenta de gasto', type: 'account', width: '34%', help: lineHelp.expenseAccount },
  { key: 'description', label: 'Detalle', type: 'text', width: '26%', help: lineHelp.detail },
  { key: 'base0', label: 'Base cero', type: 'money', total: true, help: lineHelp.base0 },
  { key: 'baseVat', label: 'Base imponible', type: 'money', total: true, help: lineHelp.baseVat },
]
const productColumns: LineColumn<ProductLine>[] = [
  { key: 'productId', label: 'Producto', type: 'product', width: '40%', help: lineHelp.product },
  { key: 'qty', label: 'Cantidad', type: 'qty', total: true, help: lineHelp.qty },
  { key: 'subtotal', label: 'Subtotal', type: 'money', total: true, help: lineHelp.subtotal },
  { key: 'vatRate', label: 'IVA', type: 'readonly', value: (l) => `${l.vatRate} %`, help: lineHelp.vatRate },
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

    <div class="il__totals" role="group" :aria-label="t.blocks.totals">
      <h3 class="il__head">{{ t.blocks.totals }}</h3>
      <span v-for="x in figures" :key="x.key">
        <span class="il__label">{{ x.label }} <HelpTip :text="x.help" :label="x.label" /></span>
        <strong class="num">{{ formatMoney(x.value) }}</strong>
      </span>
      <FormField v-bind="t.fields.vat" for="inv-vat" :hint="form.vat != null && form.vat !== totals.vatAuto ? `Calculado: ${formatMoney(totals.vatAuto)}` : ''">
        <MoneyInput id="inv-vat" :model-value="totals.vat" @update:model-value="form.vat = $event" />
      </FormField>
      <span v-for="x in after" :key="x.key" :class="{ 'il__total': x.key === 'total' }">
        <span class="il__label">{{ x.label }} <HelpTip :text="x.help" :label="x.label" /></span>
        <strong class="num">{{ formatMoney(x.value) }}</strong>
      </span>
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

.il__head {
  margin-right: auto;
  align-self: center;
  font-weight: 600;
  color: $ink;
  font-size: 1rem;
}

.il__label {
  @include flex(row, center, flex-end, 0.25rem);
}

.il__total strong {
  font-size: 1.15rem;
}
</style>
