<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/inventory/useReport'
import { inventoryService, type KardexSide } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'
import { useUserStore } from '@/stores/user'
import { formatQty, formatMoney } from '@/utils/money'

/**
 * Kardex de un producto en una bodega, como el impreso de hoy: Comprobante |
 * Fecha | INGRESOS | EGRESOS | SALDO (cantidad, valor unitario y total), con
 * el saldo anterior al rango en la primera fila.
 */
const t = copy.kardex
const route = useRoute()
const user = useUserStore()
// ?productId=&warehouseId= permite abrir el kardex desde otra pantalla.
const filters = ref(
  defaultFilters({
    productId: String(route.query.productId ?? ''),
    warehouseId: String(route.query.warehouseId ?? user.user?.warehouseId ?? ''),
  }),
)
const report = useReport(
  () => {
    const { productId, warehouseId, from, to } = filters.value
    return inventoryService.kardex({ productId, warehouseId, from: from || undefined, to: to || undefined })
  },
  () => (filters.value.productId && filters.value.warehouseId ? null : t.required),
)
if (filters.value.productId && filters.value.warehouseId) report.run()

interface Row {
  _id: string
  voucher: string
  date: string | null
  party: string
  in: KardexSide | null
  out: KardexSide | null
  bal: KardexSide
}

const rows = computed<Row[]>(() => {
  const k = report.data
  if (!k) return []
  const opening: Row = { _id: 'opening', voucher: t.opening, date: filters.value.from || null, party: '', in: null, out: null, bal: k.opening }
  return [opening, ...k.items.map((m) => ({ _id: m._id, voucher: m.voucher, date: m.date, party: m.party, in: m.inbound, out: m.outbound, bal: m.balance }))]
})

// Valor unitario en dólares con 4 decimales (el API lo guarda con 6): no es un monto en centavos.
const h = t.help
const side = (key: 'in' | 'out' | 'bal', label: [string, string, string], total: boolean): Column<Row>[] => [
  { key: `${key}Qty`, label: label[0], format: 'qty', value: (r) => r[key]?.qty, total, help: h[`${key}Qty`] },
  { key: `${key}Cost`, label: label[1], format: 'qty', value: (r) => r[key]?.unitCost, help: h[`${key}Cost`] },
  { key: `${key}Total`, label: label[2], format: 'money', value: (r) => r[key]?.total, total, help: h[`${key}Total`] },
]
// Como el impreso de hoy, quién movió el stock va debajo del comprobante (en Excel, en la misma celda).
const columns: Column<Row>[] = [
  { key: 'voucher', label: t.voucher, help: h.voucher, value: (r) => (r.party ? `${r.voucher} · ${r.party}` : r.voucher) },
  { key: 'date', label: t.date, format: 'date', width: '6.5rem' },
  ...side('in', [t.inQty, t.inCost, t.inTotal], true),
  ...side('out', [t.outQty, t.outCost, t.outTotal], true),
  ...side('bal', [t.balQty, t.balCost, t.balTotal], false),
]

const title = computed(() => (report.data ? `${report.data.product.name} Cod:${report.data.product.code}` : undefined))
const filtersText = computed(() => (report.data ? [...report.summary, `${t.records}: ${report.data.count}`] : report.summary))
const closing = computed(() => report.data?.closing)
</script>

<template>
  <section>
    <PageHeader :subtitle="copy.pages.kardex" />
    <ReportFilters v-model="filters" :fields="['range', 'warehouse', 'product']" :loading="report.loading" @apply="report.run" />

    <p v-if="closing" class="closing">
      {{ t.balQty }}: <strong class="num">{{ formatQty(closing.qty) }} {{ report.data?.product.unit }}</strong>
      · {{ t.balTotal }}: <strong class="num">{{ formatMoney(closing.total) }}</strong>
      · {{ t.records }}: <strong class="num">{{ report.data?.count }}</strong>
    </p>

    <DataTable
      v-if="report.data || report.loading || report.error"
      :columns="columns"
      :rows="rows"
      :loading="report.loading"
      :error="report.error"
      :title="title"
      :filters-text="filtersText"
      :row-class="(r) => (r._id === 'opening' ? 'is-opening' : undefined)"
      landscape
      @retry="report.run()"
    >
      <template #cell-voucher="{ row }">
        <span class="voucher">{{ row.voucher }}</span>
        <small v-if="row.party" class="voucher__party">{{ row.party }}</small>
      </template>
    </DataTable>
    <EmptyState v-else :message="t.prompt" />

    <p class="recalc">
      <AppIcon name="info" /> {{ t.recalcNote }}
      <RouterLink :to="{ name: 'InventoryRecalc' }">{{ t.recalcLink }}</RouterLink>
    </p>
  </section>
</template>

<style scoped lang="scss">
.closing {
  margin-bottom: 0.75rem;
  font-size: $text-sm;
  color: $ink-soft;
}

.voucher {
  display: block;
  font-weight: 500;

  &__party {
    display: block;
    color: $ink-muted;
  }
}

.recalc {
  @include flex(row, center, flex-start, 0.4rem);
  flex-wrap: wrap;
  margin-top: 0.75rem;
  font-size: $text-sm;
  color: $ink-muted;
}

:deep(.is-opening td) {
  font-weight: 600;
  background: $paper;
}
</style>
