<script setup lang="ts">
import { site } from '@/config/site'
import EmptyState from '@/components/ui/EmptyState.vue'
</script>

<template>
  <section class="panel">
    <EmptyState :title="site.notFound.title" :message="site.notFound.message">
      <RouterLink :to="{ name: 'Home' }" class="btn btn--primary">{{ site.notFound.back }}</RouterLink>
    </EmptyState>
  </section>
</template>
