<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'

/** Advertencias del API (ATS, cuadre): lo que el sistema no sabe y reporta con un valor por defecto. */
defineProps<{ title: string; items: string[] }>()
</script>

<template>
  <div v-if="items.length" class="wl panel panel--pad" role="note">
    <h3 class="wl__title"><AppIcon name="alert" /> {{ title }} ({{ items.length }})</h3>
    <ul class="wl__list">
      <li v-for="w in items" :key="w">{{ w }}</li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.wl {
  margin-bottom: 0.75rem;
  background: $warning-bg;
  border-color: rgba($warning, 0.3);
  font-size: $text-sm;

  &__title {
    @include flex(row, center, flex-start, 0.4rem);
    color: $warning;
    font-size: $text-sm;
  }

  &__list {
    margin-top: 0.4rem;
    padding-left: 1.1rem;
    color: $ink-soft;

    li + li {
      margin-top: 0.2rem;
    }
  }
}
</style>
