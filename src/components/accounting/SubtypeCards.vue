<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/components/ui/icons'
import { voucherGuide as g } from '@/config/copy/voucherGuide'

/**
 * Elegir el tipo de asiento como tarjetas: cada una dice cuándo se usa y
 * trae un ejemplo de Debe/Haber, para que el caso se entienda sin preguntar.
 * Funciona como un grupo de radios (flechas y espacio con teclado).
 */
const model = defineModel<string>({ required: true })
defineProps<{ disabled?: boolean }>()

const entries = Object.entries(g.subtypes)

function onKey(event: KeyboardEvent, index: number) {
  const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
  if (!step) return
  event.preventDefault()
  const to = (index + step + entries.length) % entries.length
  const next = entries[to]
  if (!next) return
  model.value = next[0]
  ;(event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus()
}
</script>

<template>
  <div class="sc" role="radiogroup" :aria-label="g.subtypeTitle">
    <button
      v-for="([value, s], i) in entries"
      :key="value"
      type="button"
      role="radio"
      class="sc__card"
      :class="{ 'is-active': model === value }"
      :aria-checked="model === value"
      :tabindex="model === value ? 0 : -1"
      :disabled="disabled"
      @click="model = value"
      @keydown="onKey($event, i)"
    >
      <span class="sc__top">
        <AppIcon :name="s.icon as IconName" />
        <strong>{{ s.title }}</strong>
        <AppIcon v-if="model === value" name="check" class="sc__check" />
      </span>
      <span class="sc__when">{{ s.when }}</span>
      <span class="sc__ex">
        <span class="sc__exlabel">{{ g.exampleLabel }}</span>
        <span><b>{{ g.debitLabel }}:</b> {{ s.example.debit }}</span>
        <span><b>{{ g.creditLabel }}:</b> {{ s.example.credit }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.sc {
  @include flex-cards(15rem, 0.75rem);

  &__card {
    @include flex(column, stretch, flex-start, 0.45rem);
    text-align: left;
    padding: 0.85rem 0.95rem;
    border: 1px solid $line;
    border-radius: $radius-md;
    background: $surface;
    color: inherit;
    cursor: pointer;
    transition: border-color 0.15s ease-out, box-shadow 0.15s ease-out, background 0.15s ease-out;

    &:hover:not(:disabled) {
      border-color: $accent;
    }

    &:focus-visible {
      outline: 2px solid $accent;
      outline-offset: 2px;
    }

    &.is-active {
      border-color: $accent;
      background: $accent-soft;
      box-shadow: 0 0 0 1px $accent inset;
    }

    &:disabled {
      cursor: default;
      opacity: 0.7;
    }
  }

  &__top {
    @include flex(row, center, flex-start, 0.45rem);
    font-size: $text-base;
  }

  &__check {
    margin-left: auto;
    color: $accent;
  }

  &__when {
    color: $ink-muted;
    font-size: $text-sm;
    line-height: 1.4;
  }

  &__ex {
    @include flex(column, stretch, flex-start, 0.1rem);
    margin-top: auto;
    padding-top: 0.45rem;
    border-top: 1px dashed $line;
    font-size: $text-xs;
  }

  &__exlabel {
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $ink-muted;
  }
}
</style>
