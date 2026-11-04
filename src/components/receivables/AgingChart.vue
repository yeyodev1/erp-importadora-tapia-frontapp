<script setup lang="ts">
import { computed } from 'vue'
import { AGING_BUCKETS, type AgingBucket } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'
import { formatMoney } from '@/utils/money'

/** Barras horizontales por tramo de vencimiento, hechas con flex (sin librería de gráficos). */
const props = defineProps<{ totals: Record<AgingBucket, number> & { total: number } }>()

const t = cxc.aging
const max = computed(() => Math.max(1, ...AGING_BUCKETS.map((b) => props.totals[b])))
const bars = computed(() =>
  AGING_BUCKETS.map((b) => ({
    key: b,
    label: t.buckets[b],
    amount: props.totals[b],
    width: `${Math.max(0, (props.totals[b] / max.value) * 100)}%`,
    share: props.totals.total ? Math.round((props.totals[b] / props.totals.total) * 1000) / 10 : 0,
  })),
)
</script>

<template>
  <figure class="ac panel panel--pad">
    <figcaption class="ac__title">{{ t.chart }}</figcaption>
    <ul class="ac__list" role="list">
      <li v-for="b in bars" :key="b.key" class="ac__row" :class="`ac__row--${b.key}`">
        <span class="ac__label">{{ b.label }}</span>
        <span class="ac__track" aria-hidden="true"
          ><span class="ac__bar" :style="{ width: b.width }"
        /></span>
        <span class="ac__amount num"
          >{{ formatMoney(b.amount) }} <small>{{ b.share }} %</small></span
        >
      </li>
    </ul>
  </figure>
</template>

<style scoped lang="scss">
.ac {
  margin: 0 0 0.75rem;

  &__title {
    @include eyebrow;
    margin-bottom: 0.75rem;
  }

  &__list {
    @include flex(column, stretch, flex-start, 0.5rem);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__row {
    @include flex(row, center, flex-start, 0.75rem);
    flex-wrap: wrap;

    @include from('md') {
      flex-wrap: nowrap;
    }
  }

  &__label {
    flex: 0 0 7.5rem;
    font-weight: 500;
  }

  &__track {
    flex: 1 1 60%;
    order: 3;
    height: 0.9rem;
    background: $sand;
    border-radius: 4px;
    overflow: hidden;

    @include from('md') {
      order: 0;
    }
  }

  &__bar {
    display: block;
    height: 100%;
    background: $accent;
    border-radius: 4px;
  }

  // Lo más vencido, más oscuro: se lee el riesgo sin colores de estado.
  &__row--notDue &__bar {
    opacity: 0.45;
  }

  &__row--over120 &__bar,
  &__row--d91_120 &__bar {
    background: $accent-deep;
  }

  &__amount {
    flex: 1 1 9rem;
    text-align: right;

    small {
      color: $ink-muted;
    }
  }
}
</style>
