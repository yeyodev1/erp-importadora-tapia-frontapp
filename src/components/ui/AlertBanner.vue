<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'
import { LEVEL_ICON, type Level } from './levels'

/**
 * Aviso dentro de una pantalla ("Estás en PRUEBAS del SRI", "Este mes está
 * cerrado"). Color e icono según el nivel; acción opcional (enlace o evento)
 * y cerrable. Si `dismissKey` está, el cierre se recuerda en la sesión del navegador.
 */
const props = withDefaults(
  defineProps<{
    level?: Level
    title?: string
    message?: string
    icon?: IconName
    /** Texto del botón de acción; con `to` es enlace, si no emite `action`. */
    actionLabel?: string
    to?: RouteLocationRaw
    closable?: boolean
    dismissKey?: string
  }>(),
  { level: 'info', title: undefined, message: undefined, icon: undefined, actionLabel: undefined, to: undefined, dismissKey: undefined },
)

const emit = defineEmits<{ action: []; close: [] }>()

const storageKey = computed(() => props.dismissKey && `tapia:banner:${props.dismissKey}`)
const closed = ref(!!storageKey.value && sessionStorage.getItem(storageKey.value) === '1')

function close() {
  closed.value = true
  if (storageKey.value) sessionStorage.setItem(storageKey.value, '1')
  emit('close')
}
</script>

<template>
  <div v-if="!closed" class="banner" :class="`banner--${level}`" :role="level === 'danger' ? 'alert' : 'status'">
    <AppIcon :name="icon ?? LEVEL_ICON[level]" class="banner__icon" />
    <div class="banner__text">
      <strong v-if="title" class="banner__title">{{ title }}</strong>
      <span v-if="message || $slots.default" class="banner__message"><slot>{{ message }}</slot></span>
    </div>
    <RouterLink v-if="actionLabel && to" :to="to" class="btn btn--ghost btn--sm banner__action">{{ actionLabel }}</RouterLink>
    <button v-else-if="actionLabel" type="button" class="btn btn--ghost btn--sm banner__action" @click="emit('action')">{{ actionLabel }}</button>
    <button v-if="closable" type="button" class="banner__close" aria-label="Cerrar aviso" @click="close"><AppIcon name="x" /></button>
  </div>
</template>

<style scoped lang="scss">
.banner {
  @include flex(row, flex-start, flex-start, 0.65rem);
  flex-wrap: wrap;
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.75rem;
  border: 1px solid;
  border-left-width: 4px;
  border-radius: $radius-sm;
  font-size: $text-sm;
  animation: fade-in 0.18s ease-out;

  &__icon {
    margin-top: 0.15rem;
    font-size: 1rem;
  }

  &__text {
    @include flex(column, flex-start, flex-start, 0.1rem);
    flex: 1 1 220px;
    min-width: 0;
    color: $ink;
  }

  &__title {
    font-weight: 600;
  }

  &__message {
    color: $ink-soft;
  }

  &__action {
    align-self: center;
    background: $surface;
  }

  &__close {
    @include flex(row, center, center);
    @include focus-ring;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 4px;
    color: $ink-muted;

    &:hover {
      color: $ink;
      background: rgba($ink, 0.06);
    }
  }

  @each $name, $fg, $bg, $line in (info, $info, $info-bg, $info-line), (success, $success, $success-bg, $success-line),
    (warning, $warning, $warning-bg, $warning-line), (danger, $danger, $danger-bg, $danger-line)
  {
    &--#{$name} {
      background: $bg;
      border-color: $line;
      border-left-color: $fg;

      .banner__icon {
        color: $fg;
      }
    }
  }
}
</style>
