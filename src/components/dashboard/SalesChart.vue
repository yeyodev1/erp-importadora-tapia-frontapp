<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatMoney } from '@/utils/money'
import { formatMonth } from '@/utils/format'
import { compactMoney, linePoints, niceScale, type ChartBox } from './salesChart'

/**
 * Ventas de 12 meses en SVG propio: eje con valores redondos, meses abajo y
 * el último mes resaltado con su valor. El ancho del viewBox sigue al del
 * contenedor para que el texto no se achique en el teléfono.
 */
const props = defineProps<{ series: { period: string; sales: number }[]; title: string; empty: string }>()

const host = ref<HTMLElement | null>(null)
const width = ref(640)
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([e]) => e && (width.value = Math.max(280, Math.round(e.contentRect.width))))
  if (host.value) observer.observe(host.value)
})
onBeforeUnmount(() => observer?.disconnect())

const box = computed<ChartBox>(() => ({ width: width.value, height: 240, left: 52, right: 16, top: 28, bottom: 28 }))
const values = computed(() => props.series.map((s) => s.sales))
const scale = computed(() => niceScale(Math.max(0, ...values.value)))
const points = computed(() => linePoints(values.value, scale.value.max, box.value))
const hasData = computed(() => values.value.some((v) => v > 0))

const ticks = computed(() => {
  const b = box.value
  const h = b.height - b.top - b.bottom
  return Array.from({ length: 5 }, (_, i) => ({ value: i * scale.value.step, y: b.top + h - (i * scale.value.step * h) / scale.value.max }))
})
const short = new Intl.DateTimeFormat('es-EC', { month: 'short', timeZone: 'UTC' })
const monthShort = (p: string) => short.format(new Date(`${p}-15T12:00:00Z`)).replace('.', '')
// En pantallas angostas se rotula un mes sí y otro no.
const labelEvery = computed(() => (width.value < 480 ? 2 : 1))

const line = computed(() => points.value.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
const area = computed(() => {
  const p = points.value
  if (!p.length) return ''
  const base = box.value.height - box.value.bottom
  return `${line.value} L${p[p.length - 1]!.x.toFixed(1)},${base} L${p[0]!.x.toFixed(1)},${base} Z`
})
const last = computed(() => points.value[points.value.length - 1])
const lastItem = computed(() => props.series[props.series.length - 1])
const summary = computed(() => props.series.map((s) => `${formatMonth(s.period)}: ${formatMoney(s.sales)}`).join('; '))
</script>

<template>
  <figure ref="host" class="chart panel panel--pad">
    <figcaption class="chart__title">{{ title }}</figcaption>
    <p v-if="!hasData" class="chart__empty">{{ empty }}</p>
    <svg v-else :viewBox="`0 0 ${box.width} ${box.height}`" :width="box.width" :height="box.height" role="img" :aria-label="`${title}. ${summary}`">
      <g class="chart__grid">
        <g v-for="t in ticks" :key="t.value">
          <line :x1="box.left" :x2="box.width - box.right" :y1="t.y" :y2="t.y" />
          <text :x="box.left - 8" :y="t.y" text-anchor="end" dominant-baseline="middle">{{ compactMoney(t.value) }}</text>
        </g>
      </g>
      <path class="chart__area" :d="area" />
      <path class="chart__line" :d="line" />
      <g v-for="(p, i) in points" :key="series[i]!.period">
        <circle class="chart__dot" :cx="p.x" :cy="p.y" r="3">
          <title>{{ formatMonth(series[i]!.period) }}: {{ formatMoney(series[i]!.sales) }}</title>
        </circle>
        <text v-if="i % labelEvery === (series.length - 1) % labelEvery" class="chart__month" :class="{ 'is-last': i === series.length - 1 }" :x="p.x" :y="box.height - 8" text-anchor="middle">
          {{ monthShort(series[i]!.period) }}
        </text>
      </g>
      <g v-if="last && lastItem">
        <circle class="chart__last" :cx="last.x" :cy="last.y" r="6" />
        <text class="chart__value" :x="last.x - 8" :y="Math.max(box.top - 10, last.y - 12)" text-anchor="end">{{ formatMoney(lastItem.sales) }}</text>
      </g>
    </svg>
  </figure>
</template>

<style scoped lang="scss">
.chart {
  margin: 0;
  overflow: hidden;

  &__title {
    @include eyebrow;
    margin-bottom: 0.5rem;
  }

  &__empty {
    padding: 2rem 0;
    color: $ink-muted;
    font-size: $text-sm;
    text-align: center;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
    font-family: inherit;
  }

  &__grid line {
    stroke: $line;
    stroke-width: 1;
  }

  &__grid text,
  &__month {
    fill: $ink-muted;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  &__month.is-last {
    fill: $ink;
    font-weight: 700;
  }

  &__area {
    fill: rgba($accent, 0.08);
  }

  &__line {
    fill: none;
    stroke: $accent;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  &__dot {
    fill: $surface;
    stroke: $accent;
    stroke-width: 1.5;
  }

  &__last {
    fill: $accent-deep;
    stroke: $surface;
    stroke-width: 2;
  }

  &__value {
    fill: $ink;
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
}
</style>
