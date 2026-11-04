<script setup lang="ts">
import { site } from '@/config/site'
import PageHeader from './PageHeader.vue'
import EmptyState from './EmptyState.vue'

/** Pantalla que todavía no existe: el menú ya navega hasta aquí. */
</script>

<template>
  <section>
    <PageHeader />
    <div class="panel">
      <EmptyState tone="construction" :title="site.underConstruction.title" :message="site.underConstruction.message" />
    </div>
  </section>
</template>
