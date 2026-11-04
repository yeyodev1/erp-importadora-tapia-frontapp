<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import { formatMoney } from '@/utils/money'
import { cxp } from '@/config/copy/cxp'
import { blankWithholding, type useInvoiceForm } from '@/composables/purchases/useInvoiceForm'
import { percentOf } from '@/composables/purchases/invoiceMath'

/**
 * Retenciones de renta e IVA: se elige el código (trae su tasa sugerida) y
 * la base queda editable para repartirla en varios códigos, como en el
 * ejemplo del video (312 sobre los repuestos, 307 sobre la mano de obra).
 */
const props = defineProps<{ ctx: ReturnType<typeof useInvoiceForm> }>()

const t = cxp.invoices
const form = computed(() => props.ctx.form)
const totals = computed(() => props.ctx.totals.value)
const options = computed(() =>
  props.ctx.codes.value
    .filter((c) => c.isActive)
    .map((c) => ({ value: c._id, label: `${cxp.tax[c.tax]} ${c.code} · ${c.rate} %`, hint: c.description })),
)

function setRate(index: number, text: string) {
  const n = Number(text.replace(',', '.'))
  form.value.withholdings[index]!.rate = text.trim() && Number.isFinite(n) ? n : null
}

const remove = (index: number) => form.value.withholdings.splice(index, 1)
</script>

<template>
  <section class="panel panel--pad wl">
    <header class="wl__head">
      <h3 class="wl__title">{{ t.withholdings }}</h3>
      <FormField v-bind="t.fields.withholdingSeries" for="wh-series" class="wl__series">
        <input id="wh-series" v-model="form.withholdingSeries" class="mono" maxlength="7" :placeholder="t.placeholders.series" />
      </FormField>
    </header>

    <p v-if="!form.withholdings.length" class="wl__empty">{{ t.noWithholding }}</p>
    <div v-for="(w, i) in form.withholdings" :key="i" class="wl__row">
      <FormField v-bind="t.fields.code" :for="`wh-code-${i}`" class="wl__code">
        <BaseCombobox :id="`wh-code-${i}`" v-model="w.codeId" :options="options" @update:model-value="ctx.onCode(w)" />
      </FormField>
      <FormField v-bind="t.fields.base" :for="`wh-base-${i}`" class="wl__num">
        <MoneyInput :id="`wh-base-${i}`" v-model="w.base" />
      </FormField>
      <FormField v-bind="t.fields.rate" :for="`wh-rate-${i}`" class="wl__rate">
        <input :id="`wh-rate-${i}`" :value="w.rate ?? ''" class="num" inputmode="decimal" :placeholder="t.placeholders.rate" @input="setRate(i, ($event.target as HTMLInputElement).value)" />
      </FormField>
      <span class="wl__amount num">{{ formatMoney(percentOf(w.base ?? 0, w.rate ?? 0)) }}</span>
      <button type="button" class="btn btn--ghost btn--sm btn--icon" aria-label="Quitar retención" @click="remove(i)"><AppIcon name="trash" /></button>
    </div>

    <footer class="wl__foot">
      <span class="wl__add">
        <button type="button" class="btn btn--ghost btn--sm" @click="form.withholdings.push(blankWithholding())"><AppIcon name="search" /> {{ t.addWithholding }}</button>
        <HelpTip :text="t.addWithholdingHelp" :label="t.addWithholding" />
      </span>
      <span>{{ t.amounts.withholding }} <strong class="num">{{ formatMoney(totals.withholdingTotal) }}</strong></span>
      <span class="wl__payable">{{ t.amounts.payable }} <strong class="num">{{ formatMoney(totals.payable) }}</strong></span>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.wl {
  @include flex(column, stretch, flex-start, 0.75rem);
}

.wl__head {
  @include flex(row, flex-end, space-between, 1rem);
  flex-wrap: wrap;
}

.wl__title {
  font-size: 1rem;
  font-weight: 600;
}

.wl__series {
  flex: 0 1 160px;
}

.wl__empty {
  color: $ink-muted;
  font-size: 0.9rem;
}

.wl__row {
  @include flex(row, flex-end, flex-start, 0.5rem 0.75rem);
  flex-wrap: wrap;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid $line;
}

.wl__code {
  flex: 1 1 100%;

  @include from('md') {
    flex: 1 1 320px;
  }
}

.wl__num {
  flex: 1 1 120px;
}

.wl__rate {
  flex: 0 1 80px;
}

.wl__amount {
  flex: 0 0 auto;
  min-width: 6rem;
  padding-bottom: 0.55rem;
  font-weight: 600;
}

.wl__foot {
  @include flex(row, center, flex-end, 0.75rem 1.5rem);
  flex-wrap: wrap;

  > .wl__add {
    @include flex(row, center, flex-start, 0.25rem);
    margin-right: auto;
  }

  strong {
    margin-left: 0.35rem;
  }
}

.wl__payable strong {
  font-size: 1.15rem;
}
</style>
