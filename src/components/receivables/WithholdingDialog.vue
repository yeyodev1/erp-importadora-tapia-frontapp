<script setup lang="ts">
import { watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import { pct, RATES, useWithholdingForm } from '@/composables/receivables/useWithholdingForm'
import { cxc } from '@/config/copy/cxc'
import { site } from '@/config/site'
import { formatMoney } from '@/utils/money'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const t = cxc.withholdings
const w = useWithholdingForm(() => emit('saved'))
const rateOptions = (tax: 'renta' | 'iva') =>
  RATES[tax].map((r) => {
    const label = `${String(r).replace('.', ',')} %`
    return { value: r, label, help: t.rateHelp[tax](label.replace(' %', '')) }
  })

watch(
  () => props.open,
  (open) => open && w.reset(),
)
</script>

<template>
  <FormDialog
    :open="open"
    :title="t.newTitle"
    wide
    :loading="w.saving.value"
    :error="w.error.value"
    @submit="w.submit"
    @close="emit('close')"
  >
    <LockedDateBanner :date="w.form.date" />
    <div class="form-grid">
      <FormField v-bind="cxc.receipts.fields.party" for="wh-party" required>
        <PartyPicker id="wh-party" v-model="w.form.partyId" role="customer" />
      </FormField>
      <FormField v-bind="t.invoice" for="wh-inv" required>
        <BaseCombobox
          id="wh-inv"
          v-model="w.form.invoiceId"
          :options="w.invoiceOptions.value"
          :disabled="!w.form.partyId"
          :placeholder="w.form.partyId ? undefined : cxc.receipts.pickParty"
        />
      </FormField>
      <FormField v-bind="t.date" for="wh-date" required>
        <BaseDatePicker id="wh-date" v-model="w.form.date" />
      </FormField>
      <FormField v-bind="t.voucher" for="wh-voucher" required>
        <input
          id="wh-voucher"
          v-model="w.form.voucherNumber"
          class="mono"
          placeholder="Ej.: 001-001-000000123"
        />
      </FormField>
      <FormField v-bind="t.authorization" for="wh-auth" full>
        <input
          id="wh-auth"
          v-model="w.form.authorization"
          class="mono"
          inputmode="numeric"
          :placeholder="t.authorizationPlaceholder"
        />
      </FormField>
    </div>

    <p v-if="w.invoice.value" class="inv">
      Factura {{ w.invoice.value.number }}: base
      {{ formatMoney(w.invoice.value.subtotal0 + w.invoice.value.subtotalVat) }} · IVA
      {{ formatMoney(w.invoice.value.vat) }} · saldo {{ formatMoney(w.invoice.value.balance) }}
    </p>

    <h4 class="form-section">{{ t.lines }} <HelpTip :text="`${t.rate.help} ${t.base.help}`" /></h4>
    <ul class="wl">
      <li v-for="(l, i) in w.lines.value" :key="i" class="wl__row">
        <strong class="wl__tax">{{ t[l.tax] }}</strong>
        <BaseSegmented v-model="l.rate" :options="rateOptions(l.tax)" :label="t.rate.label" />
        <MoneyInput
          :id="`wh-base-${i}`"
          v-model="l.base"
          class="wl__base"
          :aria-label="t.base.label"
        />
        <span class="wl__amount num">{{ formatMoney(l.base ? pct(l.base, l.rate) : 0) }}</span>
        <button
          type="button"
          class="btn btn--ghost btn--icon btn--sm"
          :title="site.lines.remove"
          @click="w.lines.value.splice(i, 1)"
        >
          <AppIcon name="trash" :label="site.lines.remove" />
        </button>
      </li>
    </ul>
    <div class="wl__foot">
      <button type="button" class="btn btn--ghost btn--sm" @click="w.addLine('renta')">
        <AppIcon name="plus" /> {{ t.addRenta }}
      </button>
      <button type="button" class="btn btn--ghost btn--sm" @click="w.addLine('iva')">
        <AppIcon name="plus" /> {{ t.addIva }}
      </button>
      <span
        class="wl__total"
        :class="{ 'is-off': w.invoice.value && w.total.value > w.invoice.value.balance }"
      >
        {{ t.total }}: <strong class="num">{{ formatMoney(w.total.value) }}</strong>
      </span>
    </div>
  </FormDialog>
</template>

<style scoped lang="scss">
.inv {
  color: $ink-soft;
  margin: 0.75rem 0;
}

.wl {
  @include flex(column, stretch, flex-start, 0.5rem);
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;

  &__row {
    @include flex(row, center, flex-start, 0.5rem 0.75rem);
    flex-wrap: wrap;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid $line;
  }

  &__tax {
    flex: 0 0 3.5rem;
  }

  &__base {
    flex: 1 1 8rem;
    max-width: 11rem;
  }

  &__amount {
    flex: 1 1 6rem;
  }

  &__foot {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
  }

  &__total {
    margin-left: auto;

    &.is-off {
      color: $danger;
    }
  }
}
</style>
