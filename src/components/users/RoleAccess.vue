<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { moduleAccess, type Access } from '@/config/access'
import { site } from '@/config/site'
import { accessCopy as c, roleGuide } from '@/config/copy/roles'
import type { Role } from '@/types'

/** Resumen de un rol y, módulo por módulo, si graba, solo ve o no ve. Sale de la matriz real de permisos. */
const props = defineProps<{ role: Role; compact?: boolean }>()

const guide = computed(() => roleGuide[props.role])
const rows = computed(() =>
  site.modules.map((m) => ({ ...m, access: moduleAccess(props.role, m.key) as Access })),
)
const ICON: Record<Access, string> = { write: 'pen', read: 'search', none: 'lock' }
</script>

<template>
  <div class="ra" :class="{ 'ra--compact': compact }">
    <p v-if="!compact" class="ra__summary">{{ guide.summary }}</p>
    <p class="ra__who"><b>{{ c.who }}:</b> {{ guide.who }}</p>
    <ul class="ra__mods">
      <li v-for="m in rows" :key="m.key" class="ra__mod" :class="`is-${m.access}`">
        <AppIcon :name="m.icon" />
        <span class="ra__name">{{ m.label }}</span>
        <span class="ra__badge"><AppIcon :name="ICON[m.access] as never" /> {{ c[m.access] }}</span>
      </li>
    </ul>
    <p v-if="role !== 'admin'" class="ra__note">{{ c.usersNote }}</p>
  </div>
</template>

<style scoped lang="scss">
.ra {
  @include flex(column, stretch, flex-start, 0.5rem);

  &__summary {
    margin: 0;
    font-weight: 600;
  }

  &__who,
  &__note {
    margin: 0;
    font-size: $text-sm;
    color: $ink-muted;
  }

  &__mods {
    @include flex-cards(13rem, 0.4rem);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__mod {
    @include flex(row, center, flex-start, 0.45rem);
    padding: 0.4rem 0.6rem;
    border-radius: $radius-sm;
    border: 1px solid $line;
    font-size: $text-sm;

    &.is-write {
      border-color: $success;
      background: $success-bg;
    }

    &.is-read {
      border-color: $info;
      background: $info-bg;
    }

    &.is-none {
      color: $ink-muted;
      background: $paper;
    }
  }

  &__name {
    flex: 1;
  }

  &__badge {
    @include flex(row, center, flex-end, 0.25rem);
    font-size: $text-xs;
    font-weight: 600;
    white-space: nowrap;
  }
}
</style>
