<script setup lang="ts">
import { ref, watch } from 'vue'
import { navigating } from '@/composables/useProgress'

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

// Solo aparece si la carga tarda: una barra que parpadea en cada clic distrae
// más de lo que informa.
watch(navigating, (on) => {
  clearTimeout(timer)
  if (on) timer = setTimeout(() => (visible.value = true), 150)
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
    top: 0;
    bottom: 0;
    width: 40%;
    background: $accent;
    border-radius: $radius-pill;
    animation: progress-slide 1.1s $ease infinite;
  }
}

@keyframes progress-slide {
  from {
    left: -40%;
  }
  to {
    left: 100%;
  }
}
</style>
