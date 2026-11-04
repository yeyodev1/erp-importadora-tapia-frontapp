<script setup lang="ts">
import HelpTip from './HelpTip.vue'

defineProps<{ label: string; hint?: string; help?: string; disabled?: boolean }>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <div class="switch-wrap">
    <button
      type="button"
      role="switch"
      class="switch"
      :aria-checked="model"
      :disabled="disabled"
      @click="model = !model"
    >
      <span class="switch__track" :class="{ 'switch__track--on': model }">
        <span class="switch__thumb"></span>
      </span>
      <span class="switch__text">
        <span class="switch__label">{{ label }}</span>
        <span v-if="hint" class="switch__hint">{{ hint }}</span>
      </span>
    </button>
    <HelpTip v-if="help" :text="help" :label="`Ayuda: ${label}`" />
  </div>
</template>

<style scoped lang="scss">
.switch-wrap {
  @include flex(row, center, flex-start, 0.35rem);
}

.switch {
  @include flex(row, center, flex-start, 0.6rem);
  text-align: left;
  min-height: 2.25rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &__track {
    position: relative;
    width: 2.2rem;
    height: 1.25rem;
    border-radius: $radius-pill;
    background: $line-strong;
    flex-shrink: 0;
    @include transition(background);

    &--on {
      background: $accent;
    }
  }

  &__thumb {
    position: absolute;
    top: 0.15rem;
    left: 0.15rem;
    width: 0.95rem;
    height: 0.95rem;
    border-radius: 50%;
    background: $surface;
    box-shadow: $shadow-sm;
    @include transition(transform);
  }

  &__track--on &__thumb {
    transform: translateX(0.95rem);
  }

  &__text {
    @include flex(column, flex-start, center, 0);
  }

  &__label {
    font-size: $text-base;
    font-weight: 500;
  }

  &__hint {
    font-size: $text-xs;
    color: $ink-muted;
  }
}
</style>
