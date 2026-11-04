<script setup lang="ts">
import { formatMoney } from '@/utils/money'
import { facturacion as t } from '@/config/copy/facturacion'
import type { Totals } from '@/services/sales.service'

/**
 * Totales de un documento de venta (centavos), en el orden del sistema de hoy:
 * No. registros, Descuento, Base cero, Base imponible, IVA, Total.
 * `count` y `balance` (saldo en cartera) son opcionales.
 */
defineProps<{ totals: Totals; balance?: number; count?: number }>()
</script>

<template>
  <dl class="st">
    <div v-if="count !== undefined" class="st__row"><dt>{{ t.totals.count }}</dt><dd class="num">{{ count }}</dd></div>
    <div v-if="totals.discount" class="st__row"><dt>{{ t.totals.discount }}</dt><dd class="num">{{ formatMoney(totals.discount) }}</dd></div>
    <div class="st__row"><dt>{{ t.totals.subtotal0 }}</dt><dd class="num">{{ formatMoney(totals.subtotal0) }}</dd></div>
    <div class="st__row"><dt>{{ t.totals.subtotalVat }}</dt><dd class="num">{{ formatMoney(totals.subtotalVat) }}</dd></div>
    <div class="st__row"><dt>{{ t.totals.vat }}</dt><dd class="num">{{ formatMoney(totals.vat) }}</dd></div>
    <div class="st__row st__row--grand"><dt>{{ t.totals.total }}</dt><dd class="num">{{ formatMoney(totals.total) }}</dd></div>
    <div v-if="balance !== undefined" class="st__row"><dt>{{ t.totals.balance }}</dt><dd class="num">{{ formatMoney(balance) }}</dd></div>
  </dl>
</template>

<style scoped lang="scss">
.st {
  @include flex(column, stretch, flex-start, 0.3rem);
  margin: 0;
  width: 100%;

  @include from('md') {
    max-width: 320px;
    margin-left: auto;
  }

  &__row {
    @include flex(row, baseline, space-between, 1rem);
    color: $ink-soft;

    dd {
      margin: 0;
      color: $ink;
    }

    &--grand {
      border-top: 1px solid $line-strong;
      padding-top: 0.35rem;
      font-weight: 600;
      font-size: 1.1rem;
      color: $ink;
    }
  }
}
</style>
