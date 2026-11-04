<script setup lang="ts">
import { useNumericInput } from '@/composables/useNumericInput'
import { formatQty, toQty } from '@/utils/money'

/** Cantidad con hasta 4 decimales (como el API). `unit` se muestra al final. */
const props = defineProps<{
  id?: string
  unit?: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  allowNegative?: boolean
}>()

const model = defineModel<number | null>({ default: null })

const { text, onInput, onFocus, onBlur } = useNumericInput(model, toQty, formatQty, () => props.allowNegative)
</script>

<template>
  <div class="numeric numeric--end" :class="{ 'numeric--invalid': invalid }">
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
    <span v-if="unit" class="numeric__adorn numeric__adorn--end" aria-hidden="true">{{ unit.slice(0, 4) }}</span>
  </div>
</template>
