<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { site } from '@/config/site'
import { useAccess } from '@/composables/useAccess'
import BaseBadge from './BaseBadge.vue'

/**
 * Encabezado de pantalla: ruta de migas (módulo · submenú), título (por
 * defecto el de la ruta) y acciones a la derecha.
 */
const props = defineProps<{ title?: string; subtitle?: string }>()

const route = useRoute()
const { readOnly } = useAccess()

const crumbs = computed(() => {
  const mod = site.modules.find((m) => m.key === route.meta.module)
  if (!mod || mod.key === 'inicio') return ''
  return [mod.label, route.meta.section ? site.sections[route.meta.section] : ''].filter(Boolean).join(' · ')
})
const heading = computed(() => props.title ?? route.meta.title ?? '')
</script>

<template>
  <header class="page-head">
    <div class="page-head__text">
      <p v-if="crumbs" class="page-head__crumbs">{{ crumbs }}</p>
      <h1 class="page-head__title">
        {{ heading }}
        <BaseBadge v-if="readOnly" tone="info">{{ site.topbar.readOnly }}</BaseBadge>
      </h1>
      <p v-if="subtitle" class="page-head__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.default" class="page-head__actions">
      <slot />
    </div>
  </header>
</template>

<style scoped lang="scss">
.page-head {
  @include flex(row, flex-end, space-between, 0.75rem);
  flex-wrap: wrap;
  margin-bottom: 1rem;

  &__text {
    min-width: 0;
  }

  &__crumbs {
    @include eyebrow;
    margin-bottom: 0.2rem;
  }

  &__title {
    @include display($text-xl, 600);
    @include flex(row, center, flex-start, 0.6rem);
    flex-wrap: wrap;
  }

  &__subtitle {
    margin-top: 0.25rem;
    font-size: $text-sm;
    color: $ink-soft;
    max-width: 70ch;
  }

  &__actions {
    @include flex(row, center, flex-end, 0.5rem);
    flex-wrap: wrap;
  }
}
</style>
