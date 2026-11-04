<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import type { IconName } from '@/components/ui/icons'
import { LEVEL_ICON, type Level } from '@/components/ui/levels'

/**
 * Tarjeta del tablero: cifra grande, detalle y enlace a la pantalla que la
 * explica. `level` es el semáforo (franja, icono y color de la cifra);
 * `delta` la tendencia con flecha verde (sube) o roja (baja).
 */
defineProps<{
  /** Opcionales solo con `loading`: la tarjeta vacía se dibuja como skeleton. */
  title?: string
  value?: string
  icon?: IconName
  /** Sin `to` (el rol no abre esa pantalla) la tarjeta no es enlace. */
  to?: RouteLocationRaw
  hint?: string
  /** Qué significa la cifra. */
  help?: string
  /** Variación en % contra el período anterior; null = sin base para comparar. */
  delta?: number | null
  deltaLabel?: string
  /** Semáforo: danger = atender ya, warning = revisar, success = al día. Sin nivel: cifra informativa. */
  level?: Level
  /** Texto del semáforo ("Al día", "Revisar"): el color nunca va solo. */
  levelLabel?: string
  loading?: boolean
}>()
</script>

<template>
  <div v-if="loading" class="kpi" aria-busy="true">
    <SkeletonBlock width="45%" height="0.65rem" />
    <SkeletonBlock width="70%" height="1.7rem" />
    <SkeletonBlock width="55%" />
  </div>
  <!-- La ayuda va fuera del enlace: un botón dentro de un <a> no es válido. -->
  <div v-else class="kpi-box">
    <component :is="to ? RouterLink : 'div'" :to="to" class="kpi" :class="[{ 'kpi--link': to }, level && `kpi--${level}`]">
      <span class="kpi__head"><AppIcon v-if="icon" :name="icon" class="kpi__icon" /> {{ title }}</span>
      <strong class="kpi__value num">{{ value }}</strong>
      <span v-if="level && levelLabel" class="kpi__level"><AppIcon :name="LEVEL_ICON[level]" /> {{ levelLabel }}</span>
      <span v-if="delta !== undefined && delta !== null" class="kpi__delta" :class="delta >= 0 ? 'is-up' : 'is-down'">
        <AppIcon :name="delta >= 0 ? 'trend-up' : 'trend-down'" /> {{ delta >= 0 ? '+' : '−' }}{{ Math.abs(delta).toFixed(1) }}% {{ deltaLabel }}
      </span>
      <span v-if="hint" class="kpi__hint">{{ hint }}</span>
      <AppIcon v-if="to" name="chevron-right" class="kpi__go" />
    </component>
    <span v-if="help" class="kpi-box__help" :class="{ 'kpi-box__help--link': to }"><HelpTip :text="help" :label="`Ayuda: ${title}`" /></span>
  </div>
</template>

<style scoped lang="scss">
.kpi-box {
  @include flex(column, stretch, flex-start);
  position: relative;

  > .kpi {
    flex: 1;
  }

  &__help {
    position: absolute;
    top: 0.8rem;
    right: 0.9rem;

    &--link {
      right: 2.1rem;
    }
  }
}

.kpi {
  @include card;
  @include flex(column, flex-start, flex-start, 0.25rem);
  @include transition(border-color);
  @include focus-ring;
  position: relative;
  padding: 0.9rem 1rem;
  box-shadow: $shadow-sm;
  animation: fade-in 0.18s ease-out;

  &--link:hover {
    border-color: $accent;
  }

  &__head {
    @include eyebrow;
    @include flex(row, center, flex-start, 0.4rem);
  }

  &__icon {
    color: $accent;
  }

  &__value {
    font-size: 1.4rem;
    line-height: 1.2;
    color: $ink;
  }

  &__level {
    @include flex(row, center, flex-start, 0.3rem);
    font-size: $text-xs;
    font-weight: 600;
  }

  // Semáforo: franja izquierda, icono del título y etiqueta en el color del nivel.
  @each $name, $fg in (danger, $danger), (warning, $warning), (success, $success), (info, $info) {
    &--#{$name} {
      border-left: 4px solid $fg;

      .kpi__icon,
      .kpi__level {
        color: $fg;
      }
    }
  }

  &--danger &__value {
    color: $danger;
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
