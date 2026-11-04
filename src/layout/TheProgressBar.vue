<script setup lang="ts">
import { ref, watch } from 'vue'
import { busy } from '@/composables/useProgress'

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

// Cambios de pantalla y peticiones al API. Solo aparece si la carga tarda: una
// barra que parpadea en cada clic distrae más de lo que informa.
watch(busy, (on) => {
  clearTimeout(timer)
  if (on) timer = setTimeout(() => (visible.value = true), 200)
  else visible.value = false
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="progress" role="progressbar" aria-label="Cargando">
      <span class="progress__bar"></span>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.progress {
  position: fixed;
  inset: 0 0 auto;
  height: 3px;
  z-index: 400;
  overflow: hidden;
  background: rgba($accent, 0.15);

  &__bar {
    position: absolute;
    inset: 0 auto 0 0;
    width: 40%;
    background: $accent;
    border-radius: $radius-pill;
    // transform y no `left`: corre en la GPU aunque el hilo principal esté pintando la vista.
    animation: slide-across 1s ease-in-out infinite;
  }
}
</style>
