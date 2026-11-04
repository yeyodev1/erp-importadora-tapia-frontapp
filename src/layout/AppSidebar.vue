<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useNavigation } from '@/composables/useNavigation'
import type { Screen } from '@/router/defineModule'
import { site, type ModuleKey } from '@/config/site'

/**
 * Barra lateral con la misma estructura del "SISTEMA INTEGRADO": módulos a
 * la izquierda y, al abrir uno, sus submenús. En el teléfono es un cajón.
 */
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const { nav } = useNavigation()
const expanded = ref<ModuleKey | undefined>(route.meta.module)

watch(
  () => route.fullPath,
  () => {
    if (route.meta.module) expanded.value = route.meta.module
    emit('close')
  },
)

// Bajar el código de la pantalla al pasar el mouse o enfocar: al hacer clic ya está.
const prefetch = (screen: Screen) => void screen.component().catch(() => {})

function toggle(key: ModuleKey) {
  expanded.value = expanded.value === key ? undefined : key
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="sb-overlay" @click="emit('close')"></div>
  </Transition>
  <aside class="sb" :class="{ 'sb--open': open }" aria-label="Menú principal">
    <RouterLink :to="{ name: 'Home' }" class="sb__brand">
      <span class="sb__logo">T</span>
      <span class="sb__brand-text">
        <strong>{{ site.shortName }}</strong>
        <small>{{ site.company.legalName }}</small>
      </span>
    </RouterLink>

    <nav class="sb__nav">
      <template v-for="mod in nav" :key="mod.key">
        <RouterLink
          v-if="mod.screens.length === 1 && !mod.screens[0]!.path"
          :to="{ name: mod.screens[0]!.name }"
          class="sb__mod"
          :class="{ 'sb__mod--current': route.meta.module === mod.key }"
          @pointerenter="prefetch(mod.screens[0]!)"
          @focus="prefetch(mod.screens[0]!)"
        >
          <AppIcon :name="mod.icon" class="sb__icon" />
          <span class="sb__label">{{ mod.label }}</span>
        </RouterLink>

        <div v-else class="sb__group">
          <button
            type="button"
            class="sb__mod"
            :class="{ 'sb__mod--current': route.meta.module === mod.key }"
            :aria-expanded="expanded === mod.key"
            @click="toggle(mod.key)"
          >
            <AppIcon :name="mod.icon" class="sb__icon" />
            <span class="sb__label">{{ mod.label }}</span>
            <AppIcon name="chevron-down" class="sb__chev" />
          </button>
          <!-- Solo anima al abrir: al cerrar, un menú que se demora empuja al que se abre. -->
          <Transition name="reveal">
            <div v-show="expanded === mod.key" class="sb__menu">
              <div v-for="sec in mod.sections" :key="sec.key" class="sb__sec">
                <p class="sb__sec-title">{{ sec.label }}</p>
                <RouterLink
                  v-for="item in sec.items"
                  :key="item.name"
                  :to="{ name: item.name }"
                  class="sb__link"
                  active-class="sb__link--active"
                  @pointerenter="prefetch(item)"
                  @focus="prefetch(item)"
                >
                  {{ item.title }}
                </RouterLink>
              </div>
            </div>
          </Transition>
        </div>
      </template>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.sb-overlay {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: $overlay;

  @include from('lg') {
    display: none;
  }
}

.sb {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 150;
  width: var(--sidebar-width);
  @include flex(column, stretch, flex-start);
  background: $nav-bg;
  color: $nav-ink;
  transform: translateX(-100%);
  transition: transform 0.22s $ease;

  &--open {
    transform: none;
  }

  @include from('lg') {
    transform: none;
  }

  &__brand {
    @include flex(row, center, flex-start, 0.6rem);
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(#fff, 0.08);
    min-height: var(--topbar-height);
  }

  &__logo {
    @include flex(row, center, center);
    width: 2rem;
    height: 2rem;
    border-radius: $radius-sm;
    background: $accent;
    color: #fff;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__brand-text {
    @include flex(column, flex-start, center, 0);
    min-width: 0;
    color: #fff;

    small {
      font-size: 0.6rem;
      color: $nav-ink;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
    }
  }

  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    overscroll-behavior: contain;
  }

  &__mod {
    @include flex(row, center, flex-start, 0.65rem);
    width: 100%;
    min-height: 2.4rem;
    padding: 0.4rem 0.65rem;
    border-radius: $radius-sm;
    font-size: $text-base;
    font-weight: 500;
    color: $nav-ink;
    text-align: left;

    &:hover {
      background: rgba(#fff, 0.06);
      color: #fff;
    }

    &--current {
      color: #fff;
      background: $nav-active;
    }
  }

  &__icon {
    width: 1.1rem;
    opacity: 0.85;
  }

  &__label {
    flex: 1;
  }

  &__chev {
    font-size: 0.7rem;
    opacity: 0.6;
    transition: transform 0.2s $ease;
  }

  &__mod[aria-expanded='true'] &__chev {
    transform: rotate(180deg);
  }

  &__menu {
    padding: 0.2rem 0 0.5rem 1.75rem;
  }

  .reveal-enter-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s $ease;
  }

  .reveal-enter-from {
    opacity: 0;
    transform: translateY(-4px);
  }

  &__sec {
    @include flex(column, stretch, flex-start, 1px);
    margin-top: 0.35rem;
  }

  &__sec-title {
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba($nav-ink, 0.6);
    padding: 0.3rem 0.5rem 0.15rem;
  }

  &__link {
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
    font-size: $text-sm;
    color: $nav-ink;

    &:hover {
      color: #fff;
      background: rgba(#fff, 0.06);
    }

    &--active {
      color: #fff;
      background: $accent;
    }
  }
}
</style>
