<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { useUserStore } from '@/stores/user'
import { useCatalogStore } from '@/stores/catalog'
import { useToastStore } from '@/stores/toast'
import { site } from '@/config/site'

/** Barra superior: menú (teléfono), módulo actual, bodega, usuario y rol. */
const emit = defineEmits<{ 'toggle-sidebar': [] }>()

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const catalog = useCatalogStore()
const toast = useToastStore()

onMounted(() => catalog.ensure('warehouses'))

const moduleLabel = computed(() => site.modules.find((m) => m.key === route.meta.module)?.label ?? '')
const warehouse = computed(() => catalog.warehouseName(user.user?.warehouseId) || site.topbar.noWarehouse)

function logout() {
  user.clear()
  catalog.clear()
  toast.info(site.topbar.loggedOut)
  router.replace({ name: 'Login' })
}
</script>

<template>
  <header class="tb">
    <button type="button" class="tb__menu btn btn--ghost btn--icon" :aria-label="site.topbar.menu" @click="emit('toggle-sidebar')">
      <AppIcon name="menu" />
    </button>
    <span class="tb__module">{{ moduleLabel }}</span>
    <span class="tb__spacer"></span>

    <span class="tb__chip" :title="site.topbar.warehouse">
      <AppIcon name="warehouse" /> <span class="tb__hide-sm">{{ warehouse }}</span>
    </span>
    <span class="tb__user">
      <span class="tb__name">{{ user.user?.name || user.user?.email }}</span>
      <BaseBadge v-if="user.role" tone="info">{{ site.roles[user.role] }}</BaseBadge>
    </span>
    <button type="button" class="btn btn--ghost btn--sm" :aria-label="site.topbar.logout" @click="logout">
      <AppIcon name="logout" /> <span class="tb__hide-sm">{{ site.topbar.logout }}</span>
    </button>
  </header>
</template>

<style scoped lang="scss">
.tb {
  position: sticky;
  top: 0;
  z-index: 100;
  @include flex(row, center, flex-start, 0.6rem);
  min-height: var(--topbar-height);
  padding: 0.4rem 0.75rem;
  background: $surface;
  border-bottom: 1px solid $line;

  @include from('md') {
    padding-inline: 1.25rem;
  }

  &__menu {
    @include from('lg') {
      display: none;
    }
  }

  &__module {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__spacer {
    flex: 1;
  }

  &__chip {
    @include flex(row, center, flex-start, 0.35rem);
    padding: 0.2rem 0.55rem;
    border-radius: $radius-sm;
    background: $sand;
    font-size: $text-sm;
    color: $ink-soft;
    white-space: nowrap;
  }

  &__user {
    @include flex(row, center, flex-end, 0.45rem);
    min-width: 0;
  }

  &__name {
    display: none;
    font-size: $text-sm;
    font-weight: 600;
    white-space: nowrap;

    @include from('md') {
      display: inline;
    }
  }

  &__hide-sm {
    display: none;

    @include from('md') {
      display: inline;
    }
  }
}
</style>
