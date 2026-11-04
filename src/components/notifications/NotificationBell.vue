<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { LEVEL_ICON, LEVELS } from '@/components/ui/levels'
import { REFRESH_MS, useNotificationsStore } from '@/stores/notifications'
import { notifications as t } from '@/config/copy/notifications'
import NotificationItem from './NotificationItem.vue'

/**
 * Campana del topbar: badge con los avisos nuevos (rojo o ámbar según el
 * peor), panel con la lista agrupada por nivel. También es quien refresca
 * los avisos: cada 2 minutos y al volver a la pestaña.
 */
const store = useNotificationsStore()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

const groups = computed(() =>
  LEVELS.map((level) => ({ level, items: store.items.filter((n) => n.level === level) })).filter((g) => g.items.length),
)
const badge = computed(() => (store.unseen.length > 99 ? '99+' : String(store.unseen.length)))

let timer: ReturnType<typeof setInterval> | undefined
const onVisible = () => document.visibilityState === 'visible' && store.refresh()
const onPointer = (e: PointerEvent) => root.value && !root.value.contains(e.target as Node) && (open.value = false)
const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (open.value = false)

onMounted(() => {
  store.refresh()
  // Con la pestaña oculta no se consulta: al volver se refresca de inmediato.
  timer = setInterval(() => document.visibilityState === 'visible' && store.refresh(), REFRESH_MS)
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
  listen(false)
})

function listen(on: boolean) {
  if (on) {
    window.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('keydown', onKey)
  } else {
    window.removeEventListener('pointerdown', onPointer, true)
    window.removeEventListener('keydown', onKey)
  }
}
watch(open, listen)
</script>

<template>
  <div ref="root" class="bell">
    <button
      type="button"
      class="btn btn--ghost btn--icon bell__btn"
      :aria-label="`${t.bell}: ${t.bellCount(store.unseen.length)}`"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
    >
      <AppIcon name="bell" />
      <span v-if="store.unseen.length" class="bell__badge" :class="`bell__badge--${store.worst}`" aria-hidden="true">{{ badge }}</span>
    </button>

    <Transition name="pop">
      <div v-if="open" class="bell__panel" role="dialog" :aria-label="t.title">
        <header class="bell__head">
          <strong>{{ t.title }}</strong>
          <button v-if="store.unseen.length" type="button" class="btn btn--ghost btn--sm" @click="store.markAllSeen()">
            <AppIcon name="check-double" /> {{ t.markAll }}
          </button>
        </header>

        <div class="bell__list">
          <p v-if="store.error && !store.items.length" class="bell__state bell__state--error"><AppIcon name="alert-circle" /> {{ store.error }}</p>
          <div v-else-if="!store.items.length" class="bell__state">
            <span class="bell__state-icon"><AppIcon name="check-circle" /></span>
            <strong>{{ t.emptyTitle }}</strong>
            <span>{{ t.empty }}</span>
          </div>
          <section v-for="g in groups" :key="g.level" class="bell__group">
            <h3 class="bell__group-title" :class="`is-${g.level}`"><AppIcon :name="LEVEL_ICON[g.level]" /> {{ t.levels[g.level] }}</h3>
            <NotificationItem v-for="n in g.items" :key="n.id" :notice="n" compact @open="open = false" />
          </section>
        </div>

        <footer class="bell__foot">
          <RouterLink :to="{ name: 'Notifications' }" class="btn btn--ghost btn--sm" @click="open = false">{{ t.viewAll }} <AppIcon name="chevron-right" /></RouterLink>
        </footer>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.bell {
  position: relative;

  &__btn {
    position: relative;
    font-size: 1.05rem;
  }

  &__badge {
    position: absolute;
    top: 0;
    right: -0.15rem;
    min-width: 1.1rem;
    height: 1.1rem;
    padding: 0 0.3rem;
    border-radius: $radius-pill;
    border: 2px solid $surface;
    font-size: 0.62rem;
    font-weight: 700;
    line-height: 0.8rem;
    color: #fff;
    background: $info;
    text-align: center;

    &--danger {
      background: $danger;
    }
    &--warning {
      background: $warning;
    }
  }

  // Teléfono: ocupa el ancho bajo el topbar; desde md, panel pegado a la campana.
  &__panel {
    position: fixed;
    top: var(--topbar-height);
    left: 0.5rem;
    right: 0.5rem;
    z-index: 200;
    @include flex(column, stretch, flex-start);
    max-height: min(560px, calc(100vh - var(--topbar-height) - 1rem));
    background: $surface;
    border: 1px solid $line;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
    overflow: hidden;

    @include from('md') {
      position: absolute;
      top: calc(100% + 0.4rem);
      left: auto;
      right: 0;
      width: 400px;
    }
  }

  &__head,
  &__foot {
    @include flex(row, center, space-between, 0.5rem);
    padding: 0.6rem 0.85rem;
    border-bottom: 1px solid $line;
  }

  &__foot {
    justify-content: flex-end;
    border-top: 1px solid $line;
    border-bottom: none;
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  &__group + &__group {
    border-top: 1px solid $line;
  }

  &__group-title {
    @include eyebrow;
    @include flex(row, center, flex-start, 0.35rem);
    padding: 0.5rem 0.85rem 0.1rem;

    &.is-danger {
      color: $danger;
    }
    &.is-warning {
      color: $warning;
    }
    &.is-info {
      color: $info;
    }
    &.is-success {
      color: $success;
    }
  }

  &__state {
    @include flex(column, center, center, 0.35rem);
    padding: 2rem 1.25rem;
    text-align: center;
    font-size: $text-sm;
    color: $ink-soft;

    &--error {
      flex-direction: row;
      color: $danger;
    }
  }

  &__state-icon {
    @include flex(row, center, center);
    width: 3rem;
    height: 3rem;
    margin-bottom: 0.3rem;
    border-radius: 50%;
    font-size: 1.4rem;
    color: $success;
    background: $success-bg;
  }
}
</style>
