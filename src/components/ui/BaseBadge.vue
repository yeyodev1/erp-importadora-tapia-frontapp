<script setup lang="ts">
import type { BadgeTone } from '@/config/site'

withDefaults(defineProps<{ tone?: BadgeTone }>(), { tone: 'neutral' })
</script>

<template>
  <span class="badge" :class="`badge--${tone}`"><slot /></span>
</template>

<style scoped lang="scss">
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.05rem 0.45rem;
  border-radius: 4px;
  font-size: $text-xs;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  border: 1px solid transparent;

  // Fondo suave + borde del mismo tono + texto oscuro del tono (contraste AA).
  &--neutral {
    color: $ink-soft;
    background: $neutral-bg;
    border-color: $line;
  }
  &--success {
    color: $success;
    background: $success-bg;
    border-color: $success-line;
  }
  &--warning {
    color: $warning;
    background: $warning-bg;
    border-color: $warning-line;
  }
  &--danger {
    color: $danger;
    background: $danger-bg;
    border-color: $danger-line;
  }
  &--info {
    color: $info;
    background: $info-bg;
    border-color: $info-line;
  }
}
</style>
