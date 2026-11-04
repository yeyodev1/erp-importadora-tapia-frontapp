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
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  font-size: $text-xs;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;

  &--neutral {
    color: $ink-soft;
    background: $sand;
  }
  &--success {
    color: $success;
    background: $success-bg;
  }
  &--warning {
    color: $warning;
    background: $warning-bg;
  }
  &--danger {
    color: $danger;
    background: $danger-bg;
  }
  &--info {
    color: $info;
    background: $info-bg;
  }
}
</style>
