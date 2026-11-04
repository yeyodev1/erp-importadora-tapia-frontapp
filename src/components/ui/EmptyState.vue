<script setup lang="ts">
import { computed } from 'vue'
import { site } from '@/config/site'
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
    tone?: 'empty' | 'error' | 'construction' | 'success'
    /** Ilustración propia (por defecto, la del tono). */
    icon?: IconName
  }>(),
  { title: undefined, message: undefined, tone: 'empty', icon: undefined },
)

defineEmits<{ retry: [] }>()

const TONE_ICON: Record<string, IconName> = { error: 'alert-circle', construction: 'construction', success: 'check-circle', empty: 'empty' }
const iconName = computed<IconName>(() => props.icon ?? TONE_ICON[props.tone]!)
</script>

<template>
  <div class="state" :class="`state--${tone}`">
    <span class="state__icon" aria-hidden="true"><AppIcon :name="iconName" /></span>
    <h3 class="state__title">{{ title ?? (tone === 'error' ? site.table.errorTitle : site.table.emptyTitle) }}</h3>
    <p v-if="message ?? tone === 'empty'" class="state__message">{{ message ?? site.table.emptyMessage }}</p>
    <button v-if="tone === 'error'" class="btn btn--ghost btn--sm" type="button" @click="$emit('retry')">
      <AppIcon name="refresh" /> {{ site.table.retry }}
    </button>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.state {
  @include flex(column, center, center, 0.4rem);
  padding: 2.5rem 1.25rem;
  text-align: center;

  // Ilustración: icono grande en un círculo de color tenue (gris vacío, rojo error, verde todo bien).
  &__icon {
    @include flex(row, center, center);
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    margin-bottom: 0.5rem;
    font-size: 1.7rem;
    color: $ink-muted;
    background: $sand;
    box-shadow: 0 0 0 8px rgba($sand, 0.5);
  }

  &--success &__icon {
    color: $success;
    background: $success-bg;
    box-shadow: 0 0 0 8px rgba($success-bg, 0.6);
  }

  &--error &__icon {
    color: $danger;
    background: $danger-bg;
    box-shadow: 0 0 0 8px rgba($danger-bg, 0.6);
  }

  &--construction &__icon {
    color: $accent;
    background: $accent-soft;
  }

  &__title {
    font-size: $text-lg;
  }

  &__message {
    font-size: $text-sm;
    color: $ink-soft;
    max-width: 380px;
    margin-bottom: 0.4rem;
  }
}
</style>
