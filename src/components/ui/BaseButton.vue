<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

/**
 * Botón de acción con espera: mientras `loading` es true o la promesa de
 * `action` no termina, muestra el spinner, conserva su ancho y queda
 * deshabilitado (un segundo clic no vuelve a enviar).
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'dark' | 'ghost' | 'danger'
    size?: 'sm'
    icon?: IconName
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    /** Acción async: el botón maneja solo su estado de espera. */
    action?: () => unknown
  }>(),
  { variant: 'ghost', size: undefined, icon: undefined, type: 'button', action: undefined },
)

const running = ref(false)
const busy = computed(() => props.loading || running.value)

async function onClick() {
  if (!props.action || busy.value) return
  running.value = true
  try {
    await props.action()
  } finally {
    running.value = false
  }
}
</script>

<template>
  <button
    :type="type"
    class="btn bb"
    :class="[`btn--${variant}`, size && `btn--${size}`, { 'is-busy': busy }]"
    :disabled="disabled || busy"
    :aria-busy="busy || undefined"
    @click="onClick"
  >
    <span class="bb__label"><AppIcon v-if="icon" :name="icon" /><slot /></span>
    <AppIcon v-if="busy" name="spinner" spin class="bb__spin" />
  </button>
</template>

<style scoped lang="scss">
.bb {
  position: relative;

  &__label {
    @include flex(row, center, center, 0.45rem);
    transition: opacity 0.12s ease;
  }

  &__spin {
    position: absolute;
    inset: 0;
    margin: auto;
    height: 1em;
  }

  // Ocupado no es lo mismo que deshabilitado: se ve vivo, con el spinner al centro.
  &.is-busy {
    opacity: 0.85;

    .bb__label {
      opacity: 0;
    }
  }
}
</style>
