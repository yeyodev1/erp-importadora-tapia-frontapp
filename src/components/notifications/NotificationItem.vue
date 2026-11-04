<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { icons, type IconName } from '@/components/ui/icons'
import { LEVEL_ICON } from '@/components/ui/levels'
import type { Notice } from '@/services/notifications.service'
import { useNotificationsStore } from '@/stores/notifications'
import { notifications as t } from '@/config/copy/notifications'

/** Un aviso: icono con el color de su nivel, título, detalle y enlace a su pantalla filtrada. */
const props = defineProps<{ notice: Notice; compact?: boolean }>()
const emit = defineEmits<{ open: [] }>()

const store = useNotificationsStore()
const icon = computed<IconName>(() => (props.notice.icon in icons ? (props.notice.icon as IconName) : LEVEL_ICON[props.notice.level]))
const isNew = computed(() => store.isNew(props.notice))

function open() {
  store.markSeen(props.notice)
  emit('open')
}
</script>

<template>
  <article class="ntf" :class="[`ntf--${notice.level}`, { 'ntf--new': isNew, 'ntf--compact': compact }]">
    <span class="ntf__icon"><AppIcon :name="icon" /></span>
    <RouterLink :to="notice.link" class="ntf__body" @click="open">
      <span class="ntf__title">
        {{ notice.title }}
        <span class="ntf__count num">{{ notice.count.toLocaleString('en-US') }}</span>
      </span>
      <span class="ntf__message">{{ notice.message }}</span>
    </RouterLink>
    <span v-if="isNew" class="ntf__dot" :title="t.new"><span class="sr-only">{{ t.new }}</span></span>
    <button v-if="isNew && !compact" type="button" class="btn btn--ghost btn--sm" @click="store.markSeen(notice)">
      <AppIcon name="check" /> {{ t.markSeen }}
    </button>
  </article>
</template>

<style scoped lang="scss">
.ntf {
  @include flex(row, flex-start, flex-start, 0.7rem);
  position: relative;
  padding: 0.7rem 0.85rem;
  border-left: 3px solid transparent;
  background: $surface;

  &__icon {
    @include flex(row, center, center);
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: $radius-sm;
  }

  &__body {
    @include flex(column, flex-start, flex-start, 0.15rem);
    @include focus-ring;
    flex: 1;
    min-width: 0;
    color: $ink;
    border-radius: 4px;

    &:hover .ntf__title {
      color: $accent;
      text-decoration: underline;
    }
  }

  &__title {
    @include flex(row, center, flex-start, 0.4rem);
    flex-wrap: wrap;
    font-size: $text-sm;
    font-weight: 600;
  }

  &__count {
    padding: 0 0.4rem;
    border-radius: $radius-pill;
    font-size: $text-xs;
    background: $sand;
    color: $ink-soft;
  }

  &__message {
    font-size: $text-sm;
    color: $ink-soft;
  }

  &__dot {
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    margin-top: 0.4rem;
    border-radius: 50%;
    background: $accent;
  }

  &--compact &__message {
    font-size: $text-xs;
  }

  // Lo visto pierde peso: sigue ahí (no está resuelto), pero no compite con lo nuevo.
  &:not(.ntf--new) .ntf__title {
    font-weight: 500;
  }

  @each $name, $fg, $bg in (danger, $danger, $danger-bg), (warning, $warning, $warning-bg), (info, $info, $info-bg), (success, $success, $success-bg) {
    &--#{$name} {
      .ntf__icon {
        color: $fg;
        background: $bg;
      }
    }
    &--#{$name}.ntf--new {
      border-left-color: $fg;
    }
  }
}

.sr-only {
  @include visually-hidden;
}
</style>
