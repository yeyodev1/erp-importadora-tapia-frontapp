<script setup lang="ts">
import HelpTip from './HelpTip.vue'

/**
 * Etiqueta + ayuda (?) + control + error. Con el copy de site.ts basta
 * `<FormField v-bind="copy.fields.name" for="x">`, que trae label y help.
 */
defineProps<{
  label: string
  help?: string
  for?: string
  required?: boolean
  error?: string
  /** Nota gris bajo el control. */
  hint?: string
  /** Ocupa toda la fila dentro de un `.form-grid`. */
  full?: boolean
}>()
</script>

<template>
  <div class="field" :class="{ 'field--full': full }">
    <div class="field__head">
      <label :for="$props.for">
        {{ label }}<span v-if="required" class="field__req" aria-hidden="true">*</span>
      </label>
      <HelpTip v-if="help" :text="help" :label="`Ayuda: ${label}`" />
    </div>
    <slot />
    <p v-if="hint" class="field__hint">{{ hint }}</p>
    <p v-if="error" class="field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.field {
  @include flex(column, stretch, flex-start, 0.3rem);
  min-width: 0;

  &__head {
    @include flex(row, center, flex-start, 0.3rem);
    min-height: 1.2rem;
  }

  &__req {
    color: $danger;
    margin-left: 0.15rem;
  }

  &__hint {
    font-size: $text-xs;
    color: $ink-muted;
  }

  &__error {
    font-size: $text-xs;
    color: $danger;
  }
}
</style>
