<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { site } from '@/config/site'
import { useToastStore } from '@/stores/toast'
import { printReport } from '@/composables/usePrint'
import { exportTable } from '@/utils/tableExport'
import AppIcon from '@/components/ui/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import TablePagination from './TablePagination.vue'
import { alignOf, computeTotals, formatValue, rawValue, type Column } from './columns'
import type { ApiError } from '@/types'

/**
 * Tabla de listados y reportes: columnas configurables con formato
 * (money en centavos, qty, date), totales al pie, paginación del servidor,
 * exportar a Excel y vista para imprimir/PDF con el encabezado de Tapia.
 * Ver src/components/README.md.
 */
const props = withDefaults(
  defineProps<{
    columns: Column<T>[]
    rows: T[]
    rowKey?: string
    loading?: boolean
    error?: string | null
    /** Paginación del servidor: si `pages` > 1 aparece el paginador. */
    page?: number
    pages?: number
    total?: number
    /** Totales del servidor (de todas las páginas). Si no, se suman las filas visibles. */
    totals?: Record<string, number>
    /** Título del Excel y de la hoja impresa (por defecto el de la pantalla). */
    title?: string
    /** Filtros aplicados, una línea cada uno, para la hoja impresa. */
    filtersText?: string[]
    /** Trae TODAS las filas para Excel/impresión cuando hay paginación. */
    fetchAll?: () => Promise<T[]>
    exportable?: boolean
    landscape?: boolean
    clickable?: boolean
    /** Resalta filas (anuladas, por ejemplo): devuelve una clase. */
    rowClass?: (row: T) => string | undefined
    /** Tabla vacía: qué hacer ("Usa 'Nuevo cobro' para registrar uno"). */
    emptyTitle?: string
    emptyMessage?: string
  }>(),
  {
    rowKey: '_id',
    error: null,
    page: 1,
    pages: 1,
    total: undefined,
    totals: undefined,
    title: undefined,
    filtersText: () => [],
    fetchAll: undefined,
    exportable: true,
    rowClass: undefined,
    emptyTitle: undefined,
    emptyMessage: undefined,
  },
)

const emit = defineEmits<{ 'update:page': [page: number]; 'row-click': [row: T]; retry: [] }>()

const route = useRoute()
const toast = useToastStore()
const busy = ref(false)

const footTotals = computed(() => props.totals ?? computeTotals(props.columns, props.rows))
const hasTotals = computed(() => props.columns.some((c) => c.total))
const reportTitle = computed(() => props.title ?? route.meta.title ?? site.name)

async function allRows(): Promise<{ rows: T[]; totals: Record<string, number> }> {
  if (!props.fetchAll || props.pages <= 1) return { rows: props.rows, totals: footTotals.value }
  const rows = await props.fetchAll()
  return { rows, totals: props.totals ?? computeTotals(props.columns, rows) }
}

async function run(kind: 'excel' | 'print') {
  if (busy.value) return
  busy.value = true
  try {
    const { rows, totals } = await allRows()
    const t = hasTotals.value ? totals : undefined
    if (kind === 'excel') await exportTable(reportTitle.value, props.columns, rows, t)
    else
      await printReport({
        title: reportTitle.value,
        filters: props.filtersText,
        columns: props.columns,
        rows,
        totals: t,
        landscape: props.landscape,
      })
  } catch (e) {
    toast.error((e as ApiError).message ?? String(e))
  } finally {
    busy.value = false
  }
}

const keyOf = (row: T, i: number) => String(row[props.rowKey] ?? i)
// Recargando con filas en pantalla: se quedan visibles (atenuadas) en vez de volver al skeleton.
const stale = computed(() => props.loading && props.rows.length > 0)
</script>

<template>
  <section class="dt panel" :class="{ 'dt--stale': stale }" :aria-busy="loading">
    <div class="dt__bar">
      <div class="dt__tools"><slot name="toolbar" /></div>
      <div v-if="exportable" class="dt__actions">
        <button type="button" class="btn btn--ghost btn--sm" :disabled="busy || loading || !rows.length" @click="run('excel')">
          <AppIcon :name="busy ? 'spinner' : 'excel'" :spin="busy" /> {{ site.table.export }}
        </button>
        <button type="button" class="btn btn--ghost btn--sm" :disabled="busy || loading || !rows.length" @click="run('print')">
          <AppIcon name="print" /> {{ site.table.print }}
        </button>
      </div>
    </div>

    <EmptyState v-if="error && !loading" tone="error" :message="error" @retry="emit('retry')" />
    <slot v-else-if="!loading && !rows.length" name="empty"><EmptyState :title="emptyTitle" :message="emptyMessage" /></slot>

    <div v-else class="dt__scroll">
      <table class="dt__table">
        <thead>
          <tr>
            <th v-for="c in columns" :key="c.key" :class="`is-${alignOf(c)}`" :style="c.width ? { width: c.width } : undefined">
              <span class="dt__th">{{ c.label }}<HelpTip v-if="c.help" :text="c.help" :label="`Ayuda: ${c.label}`" /></span>
            </th>
          </tr>
        </thead>
        <tbody v-if="loading && !rows.length">
          <tr v-for="n in 8" :key="n" aria-hidden="true">
            <td v-for="c in columns" :key="c.key" :class="`is-${alignOf(c)}`">
              <span class="skeleton" :style="{ height: '0.7rem', width: `${50 + ((n * 7) % 40)}%` }"></span>
            </td>
          </tr>
        </tbody>
        <tbody v-else class="dt__rows">
          <tr
            v-for="(row, i) in rows"
            :key="keyOf(row, i)"
            :class="[rowClass?.(row), { 'is-clickable': clickable }]"
            :tabindex="clickable ? 0 : undefined"
            @click="clickable && emit('row-click', row)"
            @keydown.enter="clickable && emit('row-click', row)"
          >
            <td v-for="c in columns" :key="c.key" :class="`is-${alignOf(c)}`">
              <slot :name="`cell-${c.key}`" :row="row" :value="rawValue(c, row)">{{ formatValue(c, rawValue(c, row)) }}</slot>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="hasTotals && rows.length">
          <tr>
            <td v-for="(c, i) in columns" :key="c.key" :class="`is-${alignOf(c)}`">
              {{ c.key in footTotals ? formatValue(c, footTotals[c.key]) : i === 0 ? site.table.totals : '' }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <TablePagination v-if="pages > 1 || total !== undefined" :page="page" :pages="pages" :total="total" @go="emit('update:page', $event)" />
  </section>
</template>

<style scoped lang="scss">
.dt {
  position: relative;
  overflow: hidden;

  // Línea que recorre el borde superior mientras se refrescan los datos.
  &--stale::before {
    content: '';
    position: absolute;
    inset: 0 auto auto 0;
    z-index: 1;
    width: 40%;
    height: 2px;
    background: $accent;
    animation: slide-across 1s ease-in-out infinite;
  }

  &--stale &__rows,
  &--stale tfoot {
    opacity: 0.55;
  }

  &__rows,
  tfoot {
    transition: opacity 0.15s ease;
  }

  // Al pasar del skeleton a las filas, entran con un fundido corto.
  &__rows {
    animation: fade-in 0.16s ease-out;
  }

  .skeleton {
    display: inline-block;
  }

  &__bar {
    @include flex(row, center, space-between, 0.5rem);
    flex-wrap: wrap;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid $line;
  }

  &__tools {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
    flex: 1 1 260px;
    min-width: 0;
  }

  &__actions {
    @include flex(row, center, flex-end, 0.4rem);
  }

  &__th {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  &__scroll {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $text-sm;
  }

  th {
    position: sticky;
    top: 0;
    padding: 0.5rem 0.75rem;
    text-align: left;
    @include eyebrow;
    background: $paper;
    border-bottom: 1px solid $line;
    white-space: nowrap;
  }

  td {
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid $line;
    vertical-align: middle;
  }

  tbody tr:hover {
    background: rgba($accent, 0.03);
  }

  tbody tr.is-clickable {
    cursor: pointer;

    &:hover,
    &:focus-visible {
      background: $accent-soft;
      outline: none;
    }
  }

  // Documentos anulados: tachados y en gris
  tbody tr.is-void td {
    color: $ink-muted;
    text-decoration: line-through;
  }

  tfoot td {
    font-weight: 700;
    background: $paper;
    border-top: 2px solid $line-strong;
    border-bottom: none;
  }

  .is-right {
    @include numeric;
  }

  .is-center {
    text-align: center;
  }
}
</style>
