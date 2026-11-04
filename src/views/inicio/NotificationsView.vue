<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import NotificationItem from '@/components/notifications/NotificationItem.vue'
import { LEVEL_ICON, LEVELS, type Level } from '@/components/ui/levels'
import { useNotificationsStore } from '@/stores/notifications'
import { formatDateTime } from '@/utils/format'
import { notifications as t } from '@/config/copy/notifications'

/** Todos los avisos del rol, agrupados por nivel y con filtro. La campana los mantiene al día. */
const store = useNotificationsStore()
if (!store.loadedAt) store.refresh()

const level = ref<Level | 'all'>('all')
const options = computed(() => [
  { value: 'all' as const, label: t.all, count: store.items.length },
  ...LEVELS.filter((l) => l !== 'success').map((l) => ({
    value: l,
    label: t.levels[l],
    count: store.items.filter((n) => n.level === l).length,
    help: t.levelHelp[l],
  })),
])
const groups = computed(() =>
  LEVELS.filter((l) => level.value === 'all' || l === level.value)
    .map((l) => ({ level: l, items: store.items.filter((n) => n.level === l) }))
    .filter((g) => g.items.length),
)
</script>

<template>
  <section class="nv">
    <PageHeader :subtitle="t.subtitle">
      <BaseButton icon="refresh" :loading="store.loading" @click="store.refresh()">{{ t.refresh }}</BaseButton>
      <BaseButton v-if="store.unseen.length" icon="check-double" variant="primary" @click="store.markAllSeen()">{{ t.markAll }}</BaseButton>
    </PageHeader>

    <div class="nv__bar">
      <BaseSegmented v-model="level" :options="options" :label="t.filterLabel" />
      <small v-if="store.loadedAt" class="nv__updated"><AppIcon name="clock" /> {{ t.updated }} {{ formatDateTime(store.loadedAt) }}</small>
    </div>

    <div v-if="store.loading && !store.loadedAt" class="panel panel--pad" aria-busy="true"><SkeletonBlock :lines="5" /></div>
    <EmptyState v-else-if="store.error && !store.items.length" tone="error" :message="store.error" @retry="store.refresh()" />
    <EmptyState v-else-if="!groups.length" tone="success" :title="t.emptyTitle" :message="level === 'all' ? t.empty : t.emptyLevel" />

    <section v-for="g in groups" :key="g.level" class="nv__group panel">
      <h2 class="nv__title" :class="`is-${g.level}`">
        <AppIcon :name="LEVEL_ICON[g.level]" /> {{ t.levels[g.level] }} <span class="nv__n">{{ g.items.length }}</span>
      </h2>
      <NotificationItem v-for="n in g.items" :key="n.id" :notice="n" />
    </section>
  </section>
</template>

<style scoped lang="scss">
.nv {
  &__bar {
    @include flex(row, center, space-between, 0.75rem);
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  &__updated {
    @include flex(row, center, flex-start, 0.3rem);
    font-size: $text-xs;
    color: $ink-muted;
  }

  &__group {
    overflow: hidden;
    margin-bottom: 0.75rem;

    :deep(.ntf + .ntf) {
      border-top: 1px solid $line;
    }
  }

  &__title {
    @include flex(row, center, flex-start, 0.4rem);
    padding: 0.6rem 0.85rem;
    font-size: $text-sm;
    font-weight: 600;
    background: $paper;
    border-bottom: 1px solid $line;

    @each $name, $fg in (danger, $danger), (warning, $warning), (info, $info), (success, $success) {
      &.is-#{$name} {
        color: $fg;
      }
    }
  }

  &__n {
    padding: 0 0.4rem;
    border-radius: $radius-pill;
    font-size: $text-xs;
    color: $ink-soft;
    background: $sand;
  }
}
</style>
