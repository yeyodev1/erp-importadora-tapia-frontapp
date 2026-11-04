<script setup lang="ts">
import { formatMoney } from '@/utils/money'

/** Fila de cifras cortas (totales de un resumen). `money: false` para conteos. */
defineProps<{ items: { label: string; value: number; money?: boolean }[] }>()
</script>

<template>
  <ul class="sc">
    <li v-for="i in items" :key="i.label" class="sc__item">
      <span class="sc__label">{{ i.label }}</span>
      <strong class="sc__value num">{{ i.money === false ? i.value.toLocaleString('en-US') : formatMoney(i.value) }}</strong>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.sc {
  @include flex-cards(150px, 0.5rem);
  list-style: none;
  margin: 0 0 0.75rem;
  padding: 0;

  &__item {
    @include card;
    @include flex(column, flex-start, flex-start, 0.15rem);
    padding: 0.6rem 0.8rem;
  }

  &__label {
    @include eyebrow;
  }

  &__value {
    font-size: $text-base;
  }
}
</style>
