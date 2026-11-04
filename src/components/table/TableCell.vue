<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { LEVEL_ICON } from '@/components/ui/levels'
import { formatValue, rawValue, type Column } from './columns'
import { overdueDays, overdueIndicator, signedLevel, stockLevel } from './indicators'

/** Contenido de una celda de DataTable: el valor con su formato y, en los indicadores, su color e icono. */
const props = defineProps<{ col: Column<T>; row: T }>()

const value = computed(() => rawValue(props.col, props.row))
const text = computed(() => formatValue(props.col, value.value))
const chip = computed(() => (props.col.format === 'days-overdue' ? overdueIndicator(overdueDays(value.value)) : null))
const level = computed(() => {
  if (props.col.format === 'amount-signed') return signedLevel(value.value)
  if (props.col.format === 'qty-stock') return stockLevel(value.value, props.col.min?.(props.row))
  return null
})
</script>

<template>
  <span v-if="chip" class="chip" :class="`chip--${chip.level}`"><AppIcon :name="chip.level === 'success' ? 'check' : 'clock'" />{{ chip.label }}</span>
  <span v-else-if="level" class="mark" :class="`mark--${level}`" :title="level === 'warning' ? 'Bajo el mínimo' : undefined">
    <AppIcon v-if="col.format === 'qty-stock'" :name="LEVEL_ICON[level]" />{{ text }}
  </span>
  <template v-else>{{ text }}</template>
</template>

<style scoped lang="scss">
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0 0.45rem;
  border: 1px solid;
  border-radius: $radius-pill;
  font-size: $text-xs;
  font-weight: 600;
  line-height: 1.6;
  white-space: nowrap;

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
}

.mark {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;

  .icon {
    font-size: 0.8em;
  }

  &--warning {
    color: $warning;
  }
  &--danger {
    color: $danger;
  }
}
</style>
