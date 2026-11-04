<script setup lang="ts">
import { site } from '@/config/site'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{ page: number; pages: number; total?: number }>()
const emit = defineEmits<{ go: [page: number] }>()
</script>

<template>
  <footer class="pager">
    <span v-if="total !== undefined" class="pager__total">{{ total.toLocaleString('en-US') }} {{ site.table.records }}</span>
    <span class="pager__spacer"></span>
    <template v-if="pages > 1">
    <button type="button" class="btn btn--ghost btn--sm" :disabled="page <= 1" :aria-label="site.table.prev" @click="emit('go', page - 1)">
      <AppIcon name="chevron-left" />
    </button>
    <span class="pager__page">{{ site.table.page }} {{ page }} {{ site.table.of }} {{ pages }}</span>
    <button type="button" class="btn btn--ghost btn--sm" :disabled="page >= pages" :aria-label="site.table.next" @click="emit('go', page + 1)">
      <AppIcon name="chevron-right" />
    </button>
    </template>
  </footer>
</template>

<style scoped lang="scss">
.pager {
  @include flex(row, center, flex-end, 0.5rem);
  padding: 0.5rem 0.75rem;
  border-top: 1px solid $line;
  font-size: $text-sm;
  color: $ink-soft;
  font-variant-numeric: tabular-nums;

  &__spacer {
    flex: 1;
  }
}
</style>
