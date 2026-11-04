<script setup lang="ts">
import { computed } from 'vue'
import { site } from '@/config/site'
import BaseBadge from './BaseBadge.vue'

/** Estado de un documento ('autorizado', 'anulado', 'pendiente'…) con su color. */
const props = defineProps<{ status: string | null | undefined }>()

const entry = computed(() => site.status[props.status ?? ''] ?? { label: props.status ?? '', tone: 'neutral' as const })
</script>

<template>
  <BaseBadge v-if="status" :tone="entry.tone">{{ entry.label }}</BaseBadge>
</template>
