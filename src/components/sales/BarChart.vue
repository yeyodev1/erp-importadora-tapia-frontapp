<script setup lang="ts">
import { computed } from 'vue'

/**
 * Barras horizontales hechas con flex (sin librerías): una fila por ítem,
 * largo proporcional al mayor. `text` ya viene formateado (dinero o cantidad).
 */
const props = defineProps<{ items: { label: string; value: number; text: string }[]; title?: string }>()

const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)))
</script>

<template>
  <figure class="bars" :aria-label="title">
    <figcaption v-if="title" class="bars__title">{{ title }}</figcaption>
    <div v-for="(item, i) in items" :key="i" class="bars__row">
      <span class="bars__label" :title="item.label">{{ item.label }}</span>
      <span class="bars__track">
        <span class="bars__fill" :style="{ width: `${(Math.max(0, item.value) / max) * 100}%` }"></span>
      </span>
      <span class="bars__value num">{{ item.text }}</span>
    </div>
  </figure>
</template>

<style scoped lang="scss">
.bars {
  @include card;
  @include flex(column, stretch, flex-start, 0.4rem);
  margin: 0 0 0.75rem;
  padding: 1rem;

  &__title {
    @include eyebrow;
    margin-bottom: 0.25rem;
  }

  &__row {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;

    @include from('md') {
      flex-wrap: nowrap;
    }
  }

  &__label {
    flex: 1 1 100%;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: $ink-soft;
    font-size: 0.85rem;

    @include from('md') {
      flex: 0 0 16rem;
    }
  }

  &__track {
    flex: 1 1 auto;
    height: 0.75rem;
    background: $sand;
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    background: $accent;
    border-radius: 3px;
  }

  &__value {
    flex: 0 0 7rem;
    text-align: right;
    font-size: 0.85rem;
  }
}

@media print {
  .bars__fill {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
