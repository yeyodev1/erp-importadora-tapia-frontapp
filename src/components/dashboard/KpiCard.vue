<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/components/ui/icons'

/** Tarjeta del tablero: cifra grande, detalle y enlace a la pantalla que la explica. */
defineProps<{
  title: string
  value: string
  icon: IconName
  /** Sin `to` (el rol no abre esa pantalla) la tarjeta no es enlace. */
  to?: RouteLocationRaw
  hint?: string
  /** Variación en % contra el período anterior; null = sin base para comparar. */
  delta?: number | null
  deltaLabel?: string
  /** Resalta la cifra cuando hay algo que atender (vencidos, pendientes). */
  alert?: boolean
}>()
</script>

<template>
  <component :is="to ? RouterLink : 'div'" :to="to" class="kpi" :class="{ 'kpi--link': to }">
    <span class="kpi__head"><AppIcon :name="icon" /> {{ title }}</span>
    <strong class="kpi__value num" :class="{ 'is-alert': alert }">{{ value }}</strong>
    <span v-if="delta !== undefined && delta !== null" class="kpi__delta" :class="delta >= 0 ? 'is-up' : 'is-down'">
      <AppIcon :name="delta >= 0 ? 'chevron-up' : 'chevron-down'" /> {{ Math.abs(delta).toFixed(1) }}% {{ deltaLabel }}
    </span>
    <span v-if="hint" class="kpi__hint">{{ hint }}</span>
    <AppIcon v-if="to" name="chevron-right" class="kpi__go" />
  </component>
</template>

<style scoped lang="scss">
.kpi {
  @include card;
  @include flex(column, flex-start, flex-start, 0.25rem);
  @include transition(border-color);
  @include focus-ring;
  position: relative;
  padding: 0.9rem 1rem;
  box-shadow: $shadow-sm;

  &--link:hover {
    border-color: $accent;
  }

  &__head {
    @include eyebrow;
    @include flex(row, center, flex-start, 0.4rem);
  }

  &__value {
    font-size: 1.4rem;
    line-height: 1.2;
    color: $ink;

    &.is-alert {
      color: $danger;
    }
  }

  &__delta {
    font-size: $text-sm;
    font-weight: 600;

    &.is-up {
      color: $success;
    }

    &.is-down {
      color: $danger;
    }
  }

  &__hint {
    font-size: $text-sm;
    color: $ink-muted;
  }

  &__go {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
    color: $ink-muted;
    font-size: 0.75rem;
  }
}
</style>
