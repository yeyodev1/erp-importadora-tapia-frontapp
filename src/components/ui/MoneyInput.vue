<script setup lang="ts">
import { useNumericInput } from '@/composables/useNumericInput'
import { formatMoney, toCents } from '@/utils/money'

/**
 * Monto en dólares en pantalla, CENTAVOS ENTEROS en el v-model.
 * Acepta "1.234,56" o "1234.56". Vacío = null.
 */
const props = defineProps<{
  id?: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  allowNegative?: boolean
}>()

const model = defineModel<number | null>({ default: null })

const { text, onInput, onFocus, onBlur } = useNumericInput(
  model,
  toCents,
  (cents) => (cents == null ? '' : formatMoney(cents, false)),
  () => props.allowNegative,
)
</script>

<template>
  <div class="numeric" :class="{ 'numeric--invalid': invalid }">
    <span class="numeric__adorn" aria-hidden="true">$</span>
    <input
      :id="id"
      :value="text"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      :placeholder="placeholder ?? '0.00'"
      :disabled="disabled"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
  </div>
</template>

<style lang="scss">
// Sin scoped: QtyInput comparte estas clases.
.numeric {
  position: relative;
  @include flex(row, center);

  &__adorn {
    position: absolute;
    left: 0.6rem;
    color: $ink-muted;
    font-size: $text-sm;
    pointer-events: none;
  }

  &__adorn--end {
    left: auto;
    right: 0.6rem;
  }

  input {
    @include numeric;
    padding-left: 1.4rem;
  }

  &--end input {
    padding-left: 0.65rem;
    padding-right: 2.6rem;
  }

  &--invalid input {
    border-color: $danger;
  }
}
</style>
