<script setup lang="ts">
import { computed } from 'vue'
import { site } from '@/config/site'
import AppIcon from './AppIcon.vue'
import BaseBadge from './BaseBadge.vue'

/**
 * Estado de un documento ('autorizado', 'anulado', 'en_cartera'…) con su
 * icono y color (mapa en `site.status`). El icono hace que el estado se lea
 * también sin distinguir colores; los anulados salen grises y tachados.
 */
const props = defineProps<{ status: string | null | undefined }>()

const entry = computed(() => site.status[props.status ?? ''] ?? { label: props.status ?? '', tone: 'neutral' as const })
const isVoid = computed(() => props.status === 'anulado' || props.status === 'anulada')
</script>

<template>
  <BaseBadge v-if="status" :tone="entry.tone" :class="{ 'is-void': isVoid }">
    <AppIcon v-if="entry.icon" :name="entry.icon" class="status__icon" />
    <span class="status__label">{{ entry.label }}</span>
  </BaseBadge>
</template>

<style scoped lang="scss">
.status__icon {
  font-size: 0.85em;

  // El punto de activo/inactivo es más chico: es una luz, no un símbolo.
  &.fa-circle {
    font-size: 0.5em;
  }
}

.is-void .status__label {
  text-decoration: line-through;
}
</style>
