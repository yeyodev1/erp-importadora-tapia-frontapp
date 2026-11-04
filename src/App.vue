<script setup lang="ts">
import TheProgressBar from '@/layout/TheProgressBar.vue'
import ThePrintSheet from '@/layout/ThePrintSheet.vue'
import ToastList from '@/components/ui/ToastList.vue'
</script>

<template>
  <TheProgressBar />
  <RouterView />
  <ToastList />
  <ThePrintSheet />
</template>
