<script setup lang="ts">
import { toRef } from 'vue'
import { useBodyScroll } from '@/composables/useBodyScroll'
import { site } from '@/config/site'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  open: boolean
  title: string
  submitLabel?: string
  loading?: boolean
  /** Formularios largos (producto, tercero). */
  wide?: boolean
  /** Sin botón de guardar: el rol solo puede ver. */
  readonly?: boolean
  error?: string
}>()

const emit = defineEmits<{ submit: []; close: [] }>()

useBodyScroll(toRef(props, 'open'))
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog" @click.self="emit('close')" @keydown.esc="emit('close')">
        <form
          class="dialog__box"
          :class="{ 'dialog__box--wide': wide }"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          novalidate
          @submit.prevent="!readonly && emit('submit')"
        >
          <header class="dialog__head">
            <h3 class="dialog__title">{{ title }}</h3>
            <button type="button" class="dialog__close" aria-label="Cerrar" @click="emit('close')">
              <AppIcon name="x" />
            </button>
          </header>

          <!-- El scroll va en un div: un <fieldset> con overflow no recorta bien en Chrome -->
          <div class="dialog__body">
            <fieldset class="dialog__fields" :disabled="readonly">
              <slot />
            </fieldset>
          </div>

          <p v-if="error" class="dialog__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>

          <footer class="dialog__actions">
            <slot name="extra" />
            <button type="button" class="btn btn--ghost" @click="emit('close')">{{ readonly ? 'Cerrar' : site.common.cancel }}</button>
            <button v-if="!readonly" type="submit" class="btn btn--primary" :disabled="loading">
              <AppIcon v-if="loading" name="spinner" spin />
              {{ submitLabel || site.common.save }}
            </button>
          </footer>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.dialog {
  position: fixed;
  inset: 0;
  background: $overlay;
  @include flex(row, flex-end, center);
  z-index: 200;

  @include from('sm') {
    align-items: center;
    padding: 1rem;
  }

  &__box {
    @include card;
    @include flex(column, stretch, flex-start, 0);
    width: 100%;
    max-width: 560px;
    max-height: calc(100dvh - 1rem);
    box-shadow: $shadow-lg;
    border-radius: $radius-md $radius-md 0 0;

    @include from('sm') {
      border-radius: $radius-md;
      max-height: calc(100dvh - 2rem);
    }

    &--wide {
      max-width: 860px;
    }
  }

  &__head {
    @include flex(row, center, space-between, 1rem);
    padding: 0.9rem 1.1rem;
    border-bottom: 1px solid $line;
  }

  &__title {
    font-size: $text-lg;
  }

  &__close {
    @include flex(row, center, center);
    width: 2rem;
    height: 2rem;
    border-radius: $radius-sm;
    color: $ink-soft;

    &:hover {
      background: $sand;
    }
  }

  &__body {
    padding: 1rem 1.1rem;
    overflow-y: auto;
    // Sin esto el contenido largo se sale de la caja en vez de hacer scroll.
    flex: 1 1 auto;
    min-height: 0;
  }

  &__fields {
    @include flex(column, stretch, flex-start, 0.85rem);
    border: none;
    min-width: 0;
  }

  &__error {
    @include flex(row, center, flex-start, 0.45rem);
    margin: 0 1.1rem 0.5rem;
    padding: 0.55rem 0.75rem;
    font-size: $text-sm;
    color: $danger;
    background: $danger-bg;
    border-radius: $radius-sm;
  }

  &__actions {
    @include flex(row, center, flex-end, 0.5rem);
    flex-wrap: wrap;
    padding: 0.75rem 1.1rem;
    border-top: 1px solid $line;
    background: $paper;
  }
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;

  .dialog__box {
    transition: transform 0.25s $ease;
  }
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;

  .dialog__box {
    transform: translateY(12px);
  }
}
</style>
