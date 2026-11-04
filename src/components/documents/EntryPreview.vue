<script setup lang="ts">
import { computed } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { formatMoney, sumCents } from '@/utils/money'
import { site } from '@/config/site'
import type { EntryLine } from './lines'

/**
 * Vista previa de un asiento: cuenta, detalle, debe, haber, totales y si
 * cuadra. Montos en CENTAVOS. Se usa antes de grabar un documento y al
 * consultar el asiento que generó.
 */
const props = defineProps<{ lines: EntryLine[]; title?: string }>()

const debit = computed(() => sumCents(props.lines, (l) => l.debit))
const credit = computed(() => sumCents(props.lines, (l) => l.credit))
const diff = computed(() => debit.value - credit.value)
const visible = computed(() => props.lines.filter((l) => l.debit || l.credit))
</script>

<template>
  <section class="ep">
    <header class="ep__head">
      <h3 class="ep__title">{{ title ?? site.entry.title }}</h3>
      <BaseBadge v-if="visible.length" :tone="diff === 0 ? 'success' : 'danger'">
        {{ diff === 0 ? site.entry.balanced : `${site.entry.unbalanced} ${formatMoney(Math.abs(diff))}` }}
      </BaseBadge>
    </header>

    <p v-if="!visible.length" class="ep__empty">{{ site.entry.empty }}</p>
    <div v-else class="ep__scroll">
      <table class="ep__table">
        <thead>
          <tr>
            <th>{{ site.entry.account }}</th>
            <th class="num">{{ site.entry.debit }}</th>
            <th class="num">{{ site.entry.credit }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(l, i) in visible" :key="i" :class="{ 'is-credit': l.credit && !l.debit }">
            <td>
              <span class="mono">{{ l.accountCode }}</span> {{ l.accountName }}
              <small v-if="l.description" class="ep__desc">{{ l.description }}</small>
            </td>
            <td class="num">{{ l.debit ? formatMoney(l.debit, false) : '' }}</td>
            <td class="num">{{ l.credit ? formatMoney(l.credit, false) : '' }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>{{ site.table.totals }}</td>
            <td class="num">{{ formatMoney(debit, false) }}</td>
            <td class="num" :class="{ 'is-bad': diff !== 0 }">{{ formatMoney(credit, false) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ep {
  border: 1px solid $line;
  border-radius: $radius-sm;
  background: $surface;

  &__head {
    @include flex(row, center, space-between, 0.5rem);
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid $line;
    background: $paper;
  }

  &__title {
    font-size: $text-sm;
  }

  &__empty {
    padding: 0.9rem;
    font-size: $text-sm;
    color: $ink-muted;
  }

  &__scroll {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $text-sm;

    th {
      @include eyebrow;
      text-align: left;
      padding: 0.4rem 0.75rem;
      border-bottom: 1px solid $line;
    }

    th.num {
      text-align: right;
    }

    td {
      padding: 0.35rem 0.75rem;
      border-bottom: 1px solid $line;
    }

    // Las cuentas del haber van con sangría, como en el libro diario
    .is-credit td:first-child {
      padding-left: 2rem;
    }

    tfoot td {
      font-weight: 700;
      border-top: 2px solid $line-strong;
      border-bottom: none;
    }
  }

  &__desc {
    display: block;
    color: $ink-muted;
  }

  .is-bad {
    color: $danger;
  }
}
</style>
