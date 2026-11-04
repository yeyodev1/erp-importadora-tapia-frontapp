<script setup lang="ts" generic="V extends string | number">
/**
 * Elección entre pocas opciones visibles (tipo de cuenta, IVA 0/15, pestañas
 * de un listado). Reemplaza radios y <select> cortos.
 */
defineProps<{
  options: { value: V; label: string; count?: number }[]
  label?: string
  disabled?: boolean
  /** Pestañas: subrayado en vez de botones. */
  tabs?: boolean
}>()

const model = defineModel<V>({ required: true })
</script>

<template>
  <div class="seg" :class="{ 'seg--tabs': tabs }" role="radiogroup" :aria-label="label">
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      role="radio"
      class="seg__opt"
      :class="{ 'seg__opt--on': o.value === model }"
      :aria-checked="o.value === model"
      :disabled="disabled"
      @click="model = o.value"
    >
      {{ o.label }}<span v-if="o.count !== undefined" class="seg__count">{{ o.count }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.seg {
  display: inline-flex;
  align-self: flex-start;
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px;
  background: $sand;
  border-radius: $radius-sm;

  &__opt {
    min-height: 2rem;
    padding: 0.25rem 0.8rem;
    font-size: $text-sm;
    font-weight: 500;
    color: $ink-soft;
    border-radius: 4px;
    @include transition(background);

    &:hover {
      color: $ink;
    }

    &--on {
      background: $surface;
      color: $ink;
      font-weight: 600;
      box-shadow: $shadow-sm;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  &__count {
    margin-left: 0.4rem;
    font-size: $text-xs;
    color: $ink-muted;
    font-variant-numeric: tabular-nums;
  }

  &--tabs {
    background: none;
    padding: 0;
    gap: 0;
    border-bottom: 1px solid $line;
    border-radius: 0;
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  &--tabs &__opt {
    border-radius: 0;
    padding-inline: 0.9rem;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;

    &--on {
      background: none;
      box-shadow: none;
      color: $accent;
      border-bottom-color: $accent;
    }
  }
}
</style>
