<script setup lang="ts">
import { usePopover } from '@/composables/usePopover'
import { site } from '@/config/site'
import AppIcon from './AppIcon.vue'

/**
 * Ayuda de campo: un "?" que muestra el texto al pasar el mouse, al
 * enfocarlo con teclado o al tocarlo en el teléfono.
 */
defineProps<{ text: string; label?: string }>()

const tip = usePopover({ width: 260 })
const { open, style } = tip
let timer: ReturnType<typeof setTimeout> | undefined

function show() {
  clearTimeout(timer)
  open.value = true
}

function hide() {
  clearTimeout(timer)
  timer = setTimeout(() => (open.value = false), 120)
}

function onPointerEnter(event: PointerEvent) {
  if (event.pointerType === 'mouse') show()
}
</script>

<template>
  <button
    v-if="text"
    :ref="tip.anchor"
    type="button"
    class="help"
    :aria-label="label || site.common.help"
    :aria-expanded="open"
    @pointerenter="onPointerEnter"
    @pointerleave="hide"
    @focus="show"
    @blur="hide"
    @click.stop.prevent="show"
    @keydown.esc="open = false"
  >
    <AppIcon name="help" />
  </button>
  <Teleport to="body">
    <Transition name="pop">
      <div v-if="open" :ref="tip.panel" role="tooltip" class="popover help__bubble" :style="style" @pointerenter="show" @pointerleave="hide">
        {{ text }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.help {
  @include flex(row, center, center);
  width: 1.15rem;
  height: 1.15rem;
  font-size: 0.78rem;
  color: $ink-muted;
  border-radius: 50%;
  flex-shrink: 0;

  &:hover,
  &[aria-expanded='true'] {
    color: $accent;
  }

  // Área táctil más grande que el icono
  position: relative;
  &::after {
    content: '';
    position: absolute;
    inset: -0.5rem;
  }
}

.help__bubble {
  padding: 0.6rem 0.75rem;
  font-size: $text-sm;
  line-height: 1.45;
  color: $surface;
  background: $nav-bg;
  border-color: $nav-bg;
}
</style>
