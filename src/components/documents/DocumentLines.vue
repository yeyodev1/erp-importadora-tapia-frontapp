<script setup lang="ts" generic="L extends Record<string, any>">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import QtyInput from '@/components/ui/QtyInput.vue'
import ProductPicker from '@/components/pickers/ProductPicker.vue'
import AccountPicker from '@/components/pickers/AccountPicker.vue'
import { formatValue } from '@/components/table/columns'
import { roundQty } from '@/utils/money'
import { site } from '@/config/site'
import type { Account, Product } from '@/types'
import { lineKey, type LineColumn } from './lines'

/**
 * Grilla editable de líneas de un documento (factura, transacción de
 * inventario, comprobante). Agregar, insertar arriba y eliminar. En el
 * teléfono cada línea se vuelve una tarjeta. Ver src/components/README.md.
 */
const props = withDefaults(
  defineProps<{
    columns: LineColumn<L>[]
    newLine: () => L
    readonly?: boolean
    idPrefix?: string
  }>(),
  { idPrefix: 'line' },
)

const lines = defineModel<L[]>({ required: true })
const emit = defineEmits<{
  'pick-product': [line: L, product: Product | null]
  'pick-account': [line: L, account: Account | null]
}>()

const cellValue = (c: LineColumn<L>, line: L) => (c.value ? c.value(line) : line[c.key])
const totalCols = computed(() => props.columns.filter((c) => c.total))
const totals = computed(() => {
  const out: Record<string, number> = {}
  for (const c of totalCols.value) {
    const sum = lines.value.reduce((acc, l) => acc + (Number(cellValue(c, l)) || 0), 0)
    out[c.key] = c.type === 'qty' || c.format === 'qty' ? roundQty(sum) : Math.round(sum)
  }
  return out
})
const fmt = (c: LineColumn<L>) => ({ key: c.key, label: c.label, format: c.format ?? (c.type === 'money' ? 'money' : c.type === 'qty' ? 'qty' : 'text') }) as const

function add(at = lines.value.length) {
  const next = [...lines.value]
  next.splice(at, 0, props.newLine())
  lines.value = next
}

function remove(index: number) {
  lines.value = lines.value.filter((_, i) => i !== index)
}

const set = (line: L, key: string, value: unknown) => ((line as Record<string, unknown>)[key] = value)
</script>

<template>
  <div class="dl" :class="{ 'dl--readonly': readonly }">
    <div class="dl__head">
      <span class="dl__n">#</span>
      <span v-for="c in columns" :key="c.key" class="dl__cell" :class="{ 'is-num': ['money', 'qty'].includes(c.type ?? '') || c.format === 'money' }" :style="c.width ? { flexBasis: c.width } : undefined">
        {{ c.label }}
        <HelpTip v-if="c.help" :text="c.help" :label="c.label" />
      </span>
      <span v-if="!readonly" class="dl__ops"></span>
    </div>

    <div v-for="(line, i) in lines" :key="lineKey(line)" class="dl__row">
      <span class="dl__n">{{ i + 1 }}</span>
      <div v-for="c in columns" :key="c.key" class="dl__cell" :style="c.width ? { flexBasis: c.width } : undefined">
        <span class="dl__label"><label :for="`${idPrefix}-${i}-${c.key}`">{{ c.label }}</label><HelpTip v-if="c.help && i === 0" :text="c.help" :label="c.label" /></span>
        <slot :name="`cell-${c.key}`" :line="line" :index="i">
          <span v-if="c.type === 'readonly' || readonly" class="dl__static" :class="{ 'is-num': fmt(c).format !== 'text' }">
            {{ formatValue(fmt(c), cellValue(c, line)) }}
          </span>
          <MoneyInput v-else-if="c.type === 'money'" :id="`${idPrefix}-${i}-${c.key}`" :model-value="line[c.key]" @update:model-value="set(line, c.key, $event)" />
          <QtyInput v-else-if="c.type === 'qty'" :id="`${idPrefix}-${i}-${c.key}`" :model-value="line[c.key]" @update:model-value="set(line, c.key, $event)" />
          <ProductPicker
            v-else-if="c.type === 'product'"
            :id="`${idPrefix}-${i}-${c.key}`"
            :model-value="line[c.key]"
            @update:model-value="set(line, c.key, $event)"
            @pick="emit('pick-product', line, $event)"
          />
          <AccountPicker
            v-else-if="c.type === 'account'"
            :id="`${idPrefix}-${i}-${c.key}`"
            :model-value="line[c.key]"
            @update:model-value="set(line, c.key, $event)"
            @pick="emit('pick-account', line, $event)"
          />
          <input v-else :id="`${idPrefix}-${i}-${c.key}`" :value="line[c.key]" type="text" :placeholder="c.placeholder" @input="set(line, c.key, ($event.target as HTMLInputElement).value)" />
        </slot>
      </div>
      <div v-if="!readonly" class="dl__ops">
        <button type="button" class="btn btn--ghost btn--sm btn--icon" :title="site.lines.insert" :aria-label="site.lines.insert" @click="add(i)">
          <AppIcon name="insert-row" />
        </button>
        <button type="button" class="btn btn--ghost btn--sm btn--icon dl__del" :title="site.lines.remove" :aria-label="site.lines.remove" @click="remove(i)">
          <AppIcon name="trash" />
        </button>
      </div>
    </div>

    <p v-if="!lines.length" class="dl__empty">{{ site.lines.empty }}</p>

    <div v-if="totalCols.length && lines.length" class="dl__row dl__row--total">
      <span class="dl__n"></span>
      <div v-for="(c, ci) in columns" :key="c.key" class="dl__cell" :style="c.width ? { flexBasis: c.width } : undefined">
        <span v-if="c.key in totals" class="dl__static is-num"><span class="dl__label">{{ c.label }}</span>{{ formatValue(fmt(c), totals[c.key]) }}</span>
        <span v-else-if="ci === 0" class="dl__static">{{ site.table.totals }}</span>
      </div>
      <span v-if="!readonly" class="dl__ops"></span>
    </div>

    <button v-if="!readonly" type="button" class="btn btn--ghost btn--sm dl__add" @click="add()">
      <AppIcon name="plus" /> {{ site.lines.add }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.dl {
  @include flex(column, stretch, flex-start, 0);
  border: 1px solid $line;
  border-radius: $radius-sm;
  background: $surface;

  &__head {
    display: none;
    @include eyebrow;
    background: $paper;
    border-bottom: 1px solid $line;
  }

  &__row {
    @include flex(row, flex-start, flex-start, 0.5rem);
    flex-wrap: wrap;
    padding: 0.6rem;
    border-bottom: 1px solid $line;

    &--total {
      font-weight: 700;
      background: $paper;
    }
  }

  &__n {
    flex: 0 0 1.6rem;
    padding-top: 0.5rem;
    font-size: $text-xs;
    color: $ink-muted;
    font-variant-numeric: tabular-nums;
  }

  // Mobile first: cada celda con su etiqueta, en filas que se acomodan.
  &__cell {
    flex: 1 1 140px;
    min-width: 0;
  }

  &__label {
    display: block;
    font-size: $text-xs;
    color: $ink-muted;
    margin-bottom: 0.15rem;
  }

  &__static {
    display: block;
    padding: 0.45rem 0;
    font-size: $text-sm;
  }

  .is-num {
    @include numeric;
  }

  &__ops {
    @include flex(row, center, flex-end, 0.25rem);
    flex: 0 0 auto;
    margin-left: auto;
  }

  &__del:hover {
    color: $danger;
    border-color: $danger;
  }

  &__empty {
    padding: 1rem;
    text-align: center;
    font-size: $text-sm;
    color: $ink-muted;
  }

  &__add {
    align-self: flex-start;
    margin: 0.6rem;
  }

  // Escritorio: una línea por fila, encabezado arriba, sin etiquetas repetidas.
  @include from('md') {
    &__head {
      @include flex(row, center, flex-start, 0.5rem);
      padding: 0.45rem 0.6rem;
    }

    // Título y su "?" en la misma línea; en columnas de montos, alineados a la derecha.
    &__head &__cell {
      @include flex(row, center, flex-start, 0.3rem);

      &.is-num {
        justify-content: flex-end;
      }
    }

    &__row {
      flex-wrap: nowrap;
      align-items: center;
      padding: 0.3rem 0.6rem;
    }

    &__n {
      padding-top: 0;
    }

    &__label {
      @include visually-hidden;
    }

    &__head &__ops,
    &__row &__ops {
      flex-basis: 4.6rem;
    }
  }
}
</style>
