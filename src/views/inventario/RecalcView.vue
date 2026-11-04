<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { inventario as copy } from '@/config/copy/inventario'

/**
 * "Calcula y Mayoriza" del sistema anterior. Está en el menú para que el
 * contador lo encuentre donde lo busca, pero aquí no se corre: explica por
 * qué el costo nunca queda por reprocesar y qué revisar en su lugar.
 */
const t = copy.recalc
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle" />
    <div class="recalc panel panel--pad">
      <h2 class="form-section">{{ t.before }}</h2>
      <p>{{ t.beforeText }}</p>

      <h2 class="form-section">{{ t.now }}</h2>
      <ul class="recalc__list">
        <li v-for="item in t.nowItems" :key="item"><AppIcon name="check-circle" /> {{ item }}</li>
      </ul>

      <h2 class="form-section">{{ t.check }}</h2>
      <p>{{ t.checkText }}</p>
      <div class="recalc__links">
        <RouterLink :to="{ name: 'InventoryNegatives' }" class="btn btn--ghost"><AppIcon name="alert" /> {{ t.negatives }}</RouterLink>
        <span class="recalc__hint">{{ t.negativesHint }}</span>
      </div>
      <div class="recalc__links">
        <RouterLink :to="{ name: 'StockBalances' }" class="btn btn--ghost"><AppIcon name="scale" /> {{ t.valued }}</RouterLink>
        <span class="recalc__hint">{{ t.valuedHint }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.recalc {
  @include flex(column, stretch, flex-start, 0.6rem);
  max-width: 52rem;

  p {
    margin: 0;
    color: $ink-soft;
  }

  &__list {
    @include flex(column, stretch, flex-start, 0.4rem);
    margin: 0;
    padding: 0;
    list-style: none;
    color: $ink-soft;
  }

  &__links {
    @include flex(row, center, flex-start, 0.4rem 0.75rem);
    flex-wrap: wrap;
  }

  &__hint {
    font-size: $text-sm;
    color: $ink-muted;
  }
}
</style>
