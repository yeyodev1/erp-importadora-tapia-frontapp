<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="layout">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="layout__main">
      <AppTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="layout__content">
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
