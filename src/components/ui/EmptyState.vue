<script setup lang="ts">
import { computed } from 'vue'
import { site } from '@/config/site'
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
    tone?: 'empty' | 'error' | 'construction'
  }>(),
  { title: undefined, message: undefined, tone: 'empty' },
)

defineEmits<{ retry: [] }>()

const icon = computed<IconName>(() =>
  props.tone === 'error' ? 'alert-circle' : props.tone === 'construction' ? 'construction' : 'empty',
)
</script>

<template>
  <div class="state" :class="`state--${tone}`">
    <span class="state__icon"><AppIcon :name="icon" /></span>
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

  &__icon {
    @include flex(row, center, center);
    width: 2.6rem;
    height: 2.6rem;
    border-radius: $radius-md;
    margin-bottom: 0.4rem;
    font-size: 1.1rem;
    color: $ink-muted;
    background: $sand;
  }

  &--error &__icon {
    color: $danger;
    background: $danger-bg;
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
