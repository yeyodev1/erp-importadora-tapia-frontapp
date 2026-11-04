<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { formatMoney } from '@/utils/money'
import { voucherGuide as g } from '@/config/copy/voucherGuide'

/** Totales del asiento en vivo y, en palabras, cuánto falta y de qué lado para cuadrar. Montos en centavos. */
const props = defineProps<{ debit: number; credit: number }>()

const diff = computed(() => props.debit - props.credit)
const state = computed(() => {
  if (!props.debit && !props.credit) return { tone: 'idle', icon: 'info', text: g.balance.empty }
  if (diff.value === 0) return { tone: 'ok', icon: 'check', text: g.balance.ok.replace('{amount}', formatMoney(props.debit)) }
  const amount = formatMoney(Math.abs(diff.value))
  return diff.value > 0
    ? { tone: 'bad', icon: 'alert-circle', text: g.balance.missingCredit.replace('{amount}', amount) }
    : { tone: 'bad', icon: 'alert-circle', text: g.balance.missingDebit.replace('{amount}', amount) }
})
</script>

<template>
  <div class="bb" :class="`bb--${state.tone}`" role="status" aria-live="polite">
    <p class="bb__msg"><AppIcon :name="state.icon as never" /> {{ state.text }}</p>
    <dl class="bb__nums">
      <div><dt>{{ g.balance.debit }}</dt><dd>{{ formatMoney(debit) }}</dd></div>
      <div><dt>{{ g.balance.credit }}</dt><dd>{{ formatMoney(credit) }}</dd></div>
      <div><dt>{{ g.balance.difference }}</dt><dd>{{ formatMoney(Math.abs(diff)) }}</dd></div>
    </dl>
  </div>
</template>

<style scoped lang="scss">
.bb {
  @include flex(row, center, space-between, 0.75rem);
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border-radius: $radius-md;
  border: 1px solid $line;
  background: $surface;
  transition: background 0.2s ease-out, border-color 0.2s ease-out;

  &--ok {
    border-color: $success;
    background: $success-bg;
  }

  &--bad {
    border-color: $danger;
    background: $danger-bg;
  }

  &__msg {
    @include flex(row, center, flex-start, 0.45rem);
    margin: 0;
    font-weight: 600;
  }

  &__nums {
    @include flex(row, center, flex-end, 1.25rem);
    margin: 0;

    div {
      @include flex(column, flex-end, flex-start, 0);
    }

    dt {
      font-size: $text-xs;
      color: $ink-muted;
    }

    dd {
      margin: 0;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
  }
}
</style>
