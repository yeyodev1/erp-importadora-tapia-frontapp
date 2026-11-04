<script setup lang="ts">
import { lineHelp } from '@/config/copy/lineHelp'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import QtyInput from '@/components/ui/QtyInput.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import type { LineColumn } from '@/components/documents/lines'
import InvoicePicker from './InvoicePicker.vue'
import SaleTotals from './SaleTotals.vue'
import { useCreditNoteForm, type NcLine } from '@/composables/sales/useCreditNoteForm'
import { lineSubtotal } from '@/composables/sales/saleMath'
import { formatMoney } from '@/utils/money'
import { facturacion as t } from '@/config/copy/facturacion'
import type { CreditNote } from '@/services/sales.service'

/** Nota de crédito: cliente → factura → cantidades a devolver o rebajar. */
const emit = defineEmits<{ saved: [note: CreditNote]; cancel: [] }>()
const { form, invoice, lines, totals, tooMuch, pickInvoice, save, saving, error } = useCreditNoteForm((n) => emit('saved', n))
const f = t.fields
const c = t.cols

const columns: LineColumn<NcLine>[] = [
  { key: 'name', label: c.product, type: 'readonly', width: '30%', value: (l) => `${l.code} · ${l.name}`, help: lineHelp.product },
  { key: 'sold', label: c.sold, type: 'readonly', format: 'qty', width: '6rem', help: lineHelp.sold },
  { key: 'left', label: c.available, type: 'readonly', format: 'qty', width: '6rem', help: lineHelp.available },
  { key: 'qty', label: c.qty, width: '7rem', help: lineHelp.returnQty },
  { key: 'unitPrice', label: c.price, width: '8rem', help: lineHelp.price },
  { key: 'discount', label: c.discount, width: '7rem', help: lineHelp.discount },
  { key: 'subtotal', label: c.lineTotal, type: 'readonly', format: 'money', total: true, width: '8rem', value: (l) => (l.qty ? lineSubtotal(l) : null), help: lineHelp.lineTotal },
]

function onParty() {
  form.invoiceId = ''
  pickInvoice(null)
}
</script>

<template>
  <form class="ncf" @submit.prevent="save">
    <div class="panel panel--pad form-grid">
      <FormField v-bind="f.party" for="nc-party" required>
        <PartyPicker id="nc-party" v-model="form.partyId" role="customer" @pick="onParty" />
      </FormField>
      <FormField v-bind="f.invoice" for="nc-inv" required :hint="invoice ? `${t.totals.balance}: ${formatMoney(invoice.balance)}` : undefined">
        <InvoicePicker id="nc-inv" v-model="form.invoiceId" :party-id="form.partyId" @pick="pickInvoice" />
      </FormField>
      <FormField v-bind="f.date" for="nc-date" required class="narrow">
        <BaseDatePicker id="nc-date" v-model="form.date" />
      </FormField>
      <FormField v-bind="f.reason" for="nc-reason" required full>
        <input id="nc-reason" v-model="form.reason" required maxlength="300" :placeholder="t.placeholders.reason" />
      </FormField>
      <BaseSwitch v-model="form.returnsStock" v-bind="f.returnsStock" :hint="form.returnsStock ? t.creditNotes.returns : t.creditNotes.valueOnly" />
    </div>

    <p class="ncf__muted">{{ invoice ? t.creditNotes.linesHint : t.creditNotes.pickInvoice }}</p>
    <DocumentLines v-if="invoice" v-model="lines" :columns="columns" :new-line="() => lines[0]!" readonly id-prefix="nc-l">
      <template #cell-qty="{ line, index }">
        <QtyInput :id="`nc-l-${index}-qty`" v-model="line.qty" :invalid="tooMuch(line)" />
      </template>
      <template #cell-unitPrice="{ line, index }">
        <MoneyInput :id="`nc-l-${index}-unitPrice`" v-model="line.unitPrice" />
      </template>
      <template #cell-discount="{ line, index }">
        <MoneyInput :id="`nc-l-${index}-discount`" v-model="line.discount" />
      </template>
    </DocumentLines>

    <div class="panel panel--pad ncf__foot">
      <SaleTotals :totals="totals" />
      <p v-if="error" class="ncf__error" role="alert">{{ error }}</p>
      <div class="ncf__actions">
        <button type="button" class="btn btn--ghost" :disabled="saving" @click="emit('cancel')">{{ t.actions.cancel }}</button>
        <button type="submit" class="btn btn--primary" :disabled="saving || !invoice">
          <AppIcon :name="saving ? 'spinner' : 'check'" :spin="saving" /> {{ saving ? t.actions.saving : t.actions.save }}
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped lang="scss">
.ncf {
  @include flex(column, stretch, flex-start, 0.75rem);
  margin-bottom: 1rem;

  &__muted {
    margin: 0;
    color: $ink-muted;
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
