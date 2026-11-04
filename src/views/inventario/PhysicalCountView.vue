<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import QtyInput from '@/components/ui/QtyInput.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { stockRow } from '@/components/table/indicators'
import StockFilters from '@/components/inventory/StockFilters.vue'
import { usePhysicalCount } from '@/composables/inventory/usePhysicalCount'
import { useAccess } from '@/composables/useAccess'
import { inventario as copy } from '@/config/copy/inventario'
import type { CountRow } from '@/services/inventory.service'
import { formatQty } from '@/utils/money'
import { formatDay, todayISO } from '@/utils/format'

/** Toma física en las dos unidades, con columna de conteo, captura y ajuste directo de diferencias. */
const c = copy.common
const t = copy.count
const { canWrite } = useAccess()
const { filters, mode, report, rows, counted, withDiff, diffOf, adjust, askAdjust, confirmAdjust } = usePhysicalCount()

const modes = computed(() => [
  { value: 'sheet' as const, label: t.sheet, help: t.sheetHelp },
  { value: 'capture' as const, label: t.capture, help: t.captureHelp, count: counted.value.length || undefined },
])

const columns = computed<Column<CountRow>[]>(() => [
  { key: 'subgroup', label: c.subgroup },
  { key: 'code', label: c.code, width: '6rem', help: c.codeHelp },
  { key: 'name', label: c.product },
  // Mismos encabezados que la hoja de hoy (Unidad | Cantidad | Unidad | Cantidad): la (?) dice cuál es cuál.
  { key: 'purchaseUnit', label: c.unit, help: t.purchaseUnitHelp },
  { key: 'purchaseQty', label: c.qty, format: 'qty', help: t.stockPurchaseHelp },
  { key: 'unit', label: c.unit, help: t.unitHelp },
  { key: 'qty', label: c.qty, format: 'qty-stock', min: (r) => r.minQty, help: t.stockUnitHelp },
  // En la hoja el conteo sale en blanco para anotarlo a mano en bodega.
  { key: 'count', label: t.count, format: 'qty', help: t.countHelp, width: mode.value === 'capture' ? '9rem' : '7rem', value: (r) => (mode.value === 'capture' ? r.count : '') },
  ...(mode.value === 'capture' ? ([{ key: 'diff', label: t.diff, format: 'qty', value: diffOf, help: t.diffHelp }] as Column<CountRow>[]) : []),
])
// Como la hoja impresa de hoy: "Saldos al 30/10/2026, Bodega Guayaquil".
const title = computed(() => (report.data ? `${t.title} · ${t.balancesAt} ${formatDay(todayISO())}, ${report.data.warehouse.name}` : undefined))
const signed = (v: number | null) => (v == null ? '' : `${v > 0 ? '+' : ''}${formatQty(v)}`)
const diffClass = (r: CountRow) => {
  const d = diffOf(r)
  return d == null || d === 0 ? '' : d > 0 ? 'is-over' : 'is-short'
}
</script>

<template>
  <section>
    <PageHeader :subtitle="copy.pages.count" />
    <StockFilters v-model="filters" :loading="report.loading" @apply="report.run" />

    <div v-if="report.data" class="count-bar panel panel--pad">
      <BaseSegmented v-model="mode" :options="modes" tabs />
      <template v-if="mode === 'capture' && canWrite">
        <LockedDateBanner :date="adjust.date" />
        <div class="form-grid count-bar__form">
          <FormField v-bind="t.date" for="pc-date" class="narrow">
            <BaseDatePicker id="pc-date" v-model="adjust.date" />
          </FormField>
          <FormField v-bind="t.responsible" for="pc-resp">
            <input id="pc-resp" v-model="adjust.responsible" :placeholder="t.responsiblePlaceholder" />
          </FormField>
          <div class="count-bar__action">
            <span class="count-bar__note">{{ counted.length }} {{ t.pending }} · {{ withDiff }} {{ t.diff.toLowerCase() }}</span>
            <button type="button" class="btn btn--primary" :disabled="!counted.length" @click="askAdjust">
              <AppIcon name="scale" /> {{ t.adjust }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="productId"
      :row-class="(r) => stockRow(r.qty, r.minQty)"
      :loading="report.loading"
      :error="report.error"
      :title="title"
      :filters-text="report.summary"
      :empty-message="t.empty"
      landscape
      @retry="report.run()"
    >
      <template #cell-count="{ row }">
        <QtyInput v-if="mode === 'capture'" :id="`pc-${row.productId}`" :model-value="row.count" @update:model-value="row.count = $event" />
        <span v-else class="count-blank" aria-hidden="true"></span>
      </template>
      <template #cell-diff="{ row, value }">
        <span class="num" :class="diffClass(row)">{{ signed(value as number | null) }}</span>
      </template>
    </DataTable>

    <ConfirmModal
      :open="adjust.open"
      danger
      :title="t.adjustTitle"
      :subject="`${counted.length} ${t.pending} · ${withDiff} ${t.diff.toLowerCase()}`"
      :message="t.adjustMessage"
      :second-message="t.adjustSecond"
      :second-label="t.adjustLabel"
      :loading="adjust.saving"
      :error="adjust.error"
      @confirm="confirmAdjust"
      @cancel="adjust.open = false"
    />
  </section>
</template>

<style scoped lang="scss">
.count-bar {
  @include flex(column, stretch, flex-start, 0.75rem);
  margin-bottom: 0.75rem;

  &__action {
    @include flex(row, flex-end, flex-end, 0.75rem);
    flex-wrap: wrap;
  }

  &__note {
    font-size: $text-sm;
    color: $ink-muted;
  }
}

.count-blank {
  display: inline-block;
  width: 100%;
  min-width: 5rem;
  border-bottom: 1px solid $line-strong;
}

.is-over {
  color: $info;
}

.is-short {
  color: $danger;
}
</style>
