<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useBodyScroll } from '@/composables/useBodyScroll'
import { site } from '@/config/site'
import AppIcon from './AppIcon.vue'

/**
 * Confirmación propia (nunca window.confirm). Con `secondMessage` confirma
 * DOS veces: primero explica qué va a pasar y luego pide ratificar; recién
 * ahí emite `confirm`. Todo lo destructivo (anular, cerrar mes, desactivar,
 * pasar a producción) va con doble confirmación.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    /** Lo que está en juego (número de documento, mes…), destacado. */
    subject?: string
    confirmLabel?: string
    secondMessage?: string
    secondLabel?: string
    danger?: boolean
    loading?: boolean
    error?: string
  }>(),
  { subject: '', confirmLabel: undefined, secondMessage: '', secondLabel: undefined, error: '' },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
const step = ref<1 | 2>(1)

useBodyScroll(toRef(props, 'open'))
watch(
  () => props.open,
  (open) => open && (step.value = 1),
)

function next() {
  if (props.loading) return
  if (step.value === 1 && props.secondMessage) step.value = 2
  else emit('confirm')
}

function cancel() {
  if (!props.loading) emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="cm" @click.self="cancel" @keydown.esc="cancel">
        <div class="cm__box" role="alertdialog" aria-modal="true" :aria-label="title" :class="{ 'cm__box--danger': danger }">
          <span class="cm__icon"><AppIcon :name="danger ? 'alert' : 'help'" /></span>
          <h2 class="cm__title">{{ step === 2 ? site.confirm.sure : title }}</h2>
          <p v-if="subject" class="cm__subject">{{ subject }}</p>
          <p class="cm__msg">{{ step === 2 ? secondMessage : message }}</p>

          <ol v-if="secondMessage" class="cm__steps" aria-label="Pasos de confirmación">
            <li v-for="(s, i) in site.confirm.steps" :key="s" :class="{ 'is-on': step === i + 1, 'is-done': step > i + 1 }">{{ s }}</li>
          </ol>

          <p v-if="error" class="cm__error" role="alert">{{ error }}</p>

          <div class="cm__actions">
            <button type="button" class="btn btn--ghost" :disabled="loading" @click="cancel">{{ site.confirm.cancel }}</button>
            <button type="button" class="btn" :class="danger ? 'btn--danger' : 'btn--primary'" :disabled="loading" @click="next">
              <AppIcon v-if="loading" name="spinner" spin />
              {{ step === 2 ? (secondLabel ?? confirmLabel ?? site.confirm.continue) : (confirmLabel ?? site.confirm.continue) }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.cm {
  position: fixed;
  inset: 0;
  z-index: 240;
  @include flex(row, flex-end, center);
  padding: 0.75rem;
  background: $overlay;

  @include from('sm') {
    align-items: center;
  }

  &__box {
    @include card;
    @include flex(column, center, flex-start, 0.5rem);
    width: 100%;
    max-width: 420px;
    padding: 1.5rem 1.25rem 1.1rem;
    text-align: center;
    box-shadow: $shadow-lg;
  }

  &__icon {
    @include flex(row, center, center);
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    font-size: 1.1rem;
    color: $accent;
    background: $accent-soft;
  }

  &__box--danger &__icon {
    color: $danger;
    background: $danger-bg;
  }

  &__title {
    font-size: $text-lg;
  }

  &__subject {
    padding: 0.3rem 0.7rem;
    border-radius: $radius-sm;
    background: $sand;
    font-weight: 600;
    word-break: break-word;
  }

  &__msg {
    font-size: $text-sm;
    color: $ink-soft;
  }

  &__steps {
    @include flex(row, center, center, 1rem);
    list-style: none;
    margin-top: 0.3rem;
    @include eyebrow;

    li {
      @include flex(row, center, flex-start, 0.35rem);

      &::before {
        content: '';
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: $line-strong;
      }

      &.is-on {
        color: $ink;
        &::before {
          background: $accent;
        }
      }

      &.is-done::before {
        background: $success;
      }
    }
  }

  &__error {
    width: 100%;
    font-size: $text-sm;
    color: $danger;
    background: $danger-bg;
    border-radius: $radius-sm;
    padding: 0.5rem 0.75rem;
  }

  &__actions {
    @include flex(column-reverse, stretch, center, 0.5rem);
    width: 100%;
    margin-top: 0.75rem;

    @include from('sm') {
      flex-direction: row;

      .btn {
        flex: 1;
      }
    }
  }
}
</style>
