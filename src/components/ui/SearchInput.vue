<script setup lang="ts">
import { site } from '@/config/site'
import AppIcon from './AppIcon.vue'

defineProps<{ placeholder?: string; label?: string }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="search toolbar__search">
    <span class="visually-hidden">{{ label ?? site.table.search }}</span>
    <AppIcon name="search" class="search__icon" />
    <input v-model="model" type="search" :placeholder="placeholder ?? site.table.search" autocomplete="off" />
  </label>
</template>

<style scoped lang="scss">
.search {
  position: relative;
  @include flex(row, center);
  min-width: 0;

  &__icon {
    position: absolute;
    left: 0.6rem;
    color: $ink-muted;
    pointer-events: none;
  }

  input {
    padding-left: 1.9rem;
  }
}
</style>
