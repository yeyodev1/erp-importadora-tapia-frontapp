<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useUserStore } from '@/stores/user'
import { canView } from '@/config/access'
import { notifications as t } from '@/config/copy/notifications'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

const sidebarOpen = ref(false)
const current = useRoute()
const catalog = useCatalogStore()

// Ambiente de pruebas del SRI: aviso fijo en Facturación y Configuración (donde se emite y donde se cambia).
const sriModule = computed(() => current.meta.module === 'facturacion' || current.meta.module === 'configuracion')
watch(sriModule, (on) => on && catalog.ensure('settings').catch(() => {}), { immediate: true })
const sriTest = computed(() => sriModule.value && catalog.settings?.sriEnvironment === 1)
// El enlace a Empresa solo para quien puede abrirla (y no estando ya ahí).
const router = useRouter()
const user = useUserStore()
const sriAction = computed(() => (current.name !== 'Company' && canView(user.role, router.resolve({ name: 'Company' }).meta) ? t.sriTest.action : undefined))
</script>

<template>
  <div class="layout">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="layout__main">
      <AppTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="layout__content">
        <AlertBanner
          v-if="sriTest"
          level="warning"
          :title="t.sriTest.title"
          :message="t.sriTest.message"
          :action-label="sriAction"
          :to="{ name: 'Company' }"
        />
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  min-height: 100vh;

  &__main {
    @include flex(column, stretch, flex-start);
    min-height: 100vh;

    @include from('lg') {
      margin-left: var(--sidebar-width);
    }
  }

  &__content {
    flex: 1;
    width: 100%;
    max-width: 1440px;
    padding: 1rem 0.75rem 2rem;

    @include from('md') {
      padding: 1.25rem 1.5rem 2.5rem;
    }
  }
}
</style>
