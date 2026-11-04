<script setup lang="ts">
/**
 * Lugar reservado mientras llegan los datos: la página no salta cuando
 * aparecen. Con `lines` dibuja un párrafo (la última línea más corta).
 * El contenedor que carga lleva `aria-busy`; esto es solo visual.
 */
withDefaults(defineProps<{ width?: string; height?: string; lines?: number; radius?: string }>(), {
  width: '100%',
  height: '0.8rem',
  lines: 0,
  radius: undefined,
})
</script>

<template>
  <span v-if="lines" class="sk-lines" aria-hidden="true">
    <span v-for="n in lines" :key="n" class="skeleton" :style="{ height, width: n === lines && n > 1 ? '60%' : width }"></span>
  </span>
  <span v-else class="skeleton" aria-hidden="true" :style="{ width, height, borderRadius: radius }"></span>
</template>

<style scoped lang="scss">
.sk-lines {
  @include flex(column, stretch, flex-start, 0.5rem);
  width: 100%;
}
</style>
