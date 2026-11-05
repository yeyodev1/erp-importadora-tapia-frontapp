<script setup lang="ts">
import AlertBanner from '@/components/ui/AlertBanner.vue'
import type { Level } from '@/components/ui/levels'

/** Lista de avisos en lenguaje claro bajo un banner (bloqueos, notas, avisos del archivo). */
defineProps<{ level: Level; title: string; items: string[] }>()
</script>

<template>
  <AlertBanner v-if="items.length" :level="level" :title="title">
    <ul class="nl">
      <li v-for="i in items" :key="i">{{ i }}</li>
    </ul>
  </AlertBanner>
</template>

<style scoped lang="scss">
.nl {
  margin: 0.25rem 0 0;
  padding-left: 1.1rem;
  line-height: 1.45;
}
</style>
