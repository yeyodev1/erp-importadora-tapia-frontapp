<script setup lang="ts">
import { computed } from 'vue'
import { lineHelp } from '@/config/copy/lineHelp'
import FormField from '@/components/ui/FormField.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import QtyInput from '@/components/ui/QtyInput.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import type { LineColumn } from '@/components/documents/lines'
import InvoicePicker from './InvoicePicker.vue'
import SaleTotals from './SaleTotals.vue'
import { useCreditNoteForm, type NcLine } from '@/composables/sales/useCreditNoteForm'
import { lineSubtotal } from '@/composables/sales/saleMath'
import { splitNumber } from '@/composables/sales/docNumber'
import { formatMoney } from '@/utils/money'
import { facturacion as t } from '@/config/copy/facturacion'
import type { CreditNote } from '@/services/sales.service'

/**
 * Nota de crédito en el orden de la pantalla de hoy: cabecera (cliente,
 * fecha, vendedor), bloque "Aplica a" (tipo, serie, número y saldo de la
 * factura), motivo, líneas y totales Base cero / Base imponible / IVA / Total.
 */
const emit = defineEmits<{ saved: [note: CreditNote]; cancel: [] }>()
const { form, invoice, lines, totals, tooMuch, pickInvoice, save, saving, error } = useCreditNoteForm((n) => emit('saved', n))
const f = t.fields
const c = t.cols
const nc = t.creditNotes
const series = computed(() => splitNumber(invoice.value?.number).series)

const columns: LineColumn<NcLine>[] = [
  { key: 'code', label: c.code, type: 'readonly', width: '6rem', help: lineHelp.product },
  { key: 'name', label: c.product, type: 'readonly', width: '26%' },
  { key: 'sold', label: c.sold, type: 'readonly', format: 'qty', width: '6rem', help: lineHelp.sold },
  { key: 'left', label: c.available, type: 'readonly', format: 'qty', width: '6rem', help: lineHelp.available },
  { key: 'qty', label: c.qty, width: '7rem', help: lineHelp.returnQty },
  { key: 'unitPrice', label: c.pvp, width: '8rem', help: lineHelp.price },
  { key: 'vatRate', label: c.vatPct, type: 'readonly', width: '4rem', value: (l) => `${l.vatRate}`, help: t.colHelp.vatRate },
  { key: 'discount', label: c.discount, width: '7rem', help: lineHelp.discount },
  { key: 'subtotal', label: t.totals.total, type: 'readonly', format: 'money', total: true, width: '8rem', value: (l) => (l.qty ? lineSubtotal(l) : null), help: lineHelp.lineTotal },
]

function onParty() {
  form.invoiceId = ''
  pickInvoice(null)
}
</script>

<template>
  <form class="ncf" @submit.prevent="save">
    <LockedDateBanner :date="form.date" />
    <div class="panel panel--pad form-grid">
      <FormField v-bind="f.party" for="nc-party" required>
        <PartyPicker id="nc-party" v-model="form.partyId" role="customer" @pick="onParty" />
      </FormField>
      <FormField v-bind="f.date" for="nc-date" required class="narrow">
        <BaseDatePicker id="nc-date" v-model="form.date" />
      </FormField>
      <dl v-if="invoice" class="ncf__customer full" :aria-label="nc.customerInfo">
        <div><dt>{{ f.seller.label }}</dt><dd>{{ invoice.sellerName || '—' }}</dd></div>
        <div><dt>{{ nc.address }}</dt><dd>{{ invoice.customer.address || '—' }}</dd></div>
        <div><dt>{{ nc.email }}</dt><dd>{{ invoice.customer.email || '—' }}</dd></div>
      </dl>

      <fieldset class="ncf__applies full">
        <legend>{{ nc.appliesTo }} <HelpTip :text="nc.appliesToHelp" /></legend>
        <div class="form-grid">
          <FormField v-bind="nc.docType" for="nc-doctype" class="narrow">
            <input id="nc-doctype" :value="nc.docTypeValue" readonly tabindex="-1" />
          </FormField>
          <FormField v-bind="nc.number" for="nc-inv" required>
            <InvoicePicker id="nc-inv" v-model="form.invoiceId" :party-id="form.partyId" @pick="pickInvoice" />
          </FormField>
          <FormField v-bind="nc.series" for="nc-series" class="narrow">
            <input id="nc-series" :value="series" readonly tabindex="-1" class="mono" />
          </FormField>
          <FormField v-bind="nc.balance" for="nc-balance" class="narrow">
            <input id="nc-balance" :value="invoice ? formatMoney(invoice.balance) : ''" readonly tabindex="-1" class="num" />
          </FormField>
        </div>
      </fieldset>

      <FormField v-bind="f.reason" for="nc-reason" required full>
        <input id="nc-reason" v-model="form.reason" required maxlength="300" :placeholder="t.placeholders.reason" />
      </FormField>
      <BaseSwitch v-model="form.returnsStock" v-bind="f.returnsStock" :hint="form.returnsStock ? nc.returns : nc.valueOnly" />
    </div>

    <p class="ncf__muted">{{ invoice ? nc.linesHint : nc.pickInvoice }}</p>
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
      <SaleTotals :totals="totals" :count="lines.filter((l) => l.qty).length" />
      <p v-if="error" class="ncf__error" role="alert">{{ error }}</p>
      <div class="ncf__actions">
        <button type="button" class="btn btn--ghost" :disabled="saving" @click="emit('cancel')">{{ t.actions.cancel }}</button>
        <BaseButton type="submit" variant="primary" icon="check" :loading="saving" :disabled="!invoice">{{ t.actions.save }}</BaseButton>
      </div>
    </div>
  </form>
</template>

<style scoped lang="scss">
.ncf {
  @include flex(column, stretch, flex-start, 0.75rem);
  margin-bottom: 1rem;

  &__customer {
    @include flex(row, flex-start, flex-start, 0.5rem 1.5rem);
    flex-wrap: wrap;
    margin: 0;
    font-size: $text-sm;

    dt {
      color: $ink-muted;
    }

    dd {
      margin: 0;
    }
  }

  &__applies {
    margin: 0;
    padding: 0.75rem;
    border: 1px solid $line-strong;
    border-radius: 6px;

    legend {
      @include flex(row, center, flex-start, 0.35rem);
      padding: 0 0.35rem;
      font-weight: 600;
    }
  }

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
