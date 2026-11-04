<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import { useTransactionDetail } from '@/composables/inventory/useTransactionDetail'
import { useAccess } from '@/composables/useAccess'
import { inventario as copy } from '@/config/copy/inventario'
import { site } from '@/config/site'
import type { InventoryLine } from '@/services/inventory.service'
import { formatDay } from '@/utils/format'

/** Detalle de una transacción: cabecera, líneas, su asiento y anulación con motivo (doble confirmación). */
const t = copy.transactions
const d = copy.detail
const c = copy.common
const route = useRoute()
const { canWrite } = useAccess()
const { doc, entryLines, seesEntry, loading, error, load, voiding, askVoid, confirmVoid } = useTransactionDetail(() => String(route.params.id))

const title = computed(() => (doc.value ? `${copy.types[doc.value.type]} #${doc.value.number}` : d.title))
const product = (l: InventoryLine) => (typeof l.productId === 'object' ? l.productId : null)
const columns: Column<InventoryLine>[] = [
  { key: 'code', label: c.code, value: (l) => product(l)?.code, width: '6rem', help: c.codeHelp },
  { key: 'product', label: c.product, value: (l) => product(l)?.name },
  { key: 'unit', label: c.unit, value: (l) => product(l)?.unit },
  { key: 'qty', label: c.qty, format: 'qty', total: true },
  // Costo aplicado en dólares con 4 decimales (el API lo guarda con 6).
  { key: 'unitCost', label: t.cost, format: 'qty', help: t.costHelp },
  { key: 'totalCost', label: t.lineTotal, format: 'money', total: true },
]
const facts = computed(() => {
  const x = doc.value
  if (!x) return []
  return [
    [t.date, formatDay(x.date)],
    [t.warehouse, x.warehouseId?.name],
    [t.fields.targetWarehouseId.label, x.targetWarehouseId?.name],
    [t.fields.partyId.label, x.partyId ? `${x.partyId.name} (${x.partyId.identification})` : ''],
    [t.fields.responsible.label, x.responsible],
    [t.fields.costCenter.label, x.costCenter],
    [t.fields.containers.label, x.containers ? String(x.containers) : ''],
    [t.fields.description.label, x.description],
    [d.createdBy, x.createdBy?.name],
    [d.voidReason, x.voidReason],
  ].filter(([, v]) => v) as [string, string][]
})
</script>

<template>
  <section>
    <PageHeader :title="title" :subtitle="copy.pages.detail">
      <RouterLink :to="{ name: 'InventoryTransactions' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.back }}</RouterLink>
      <button v-if="canWrite && doc && doc.status !== 'anulado'" type="button" class="btn btn--danger" @click="voiding.show = !voiding.show">
        <AppIcon name="x" /> {{ d.void }}
      </button>
    </PageHeader>

    <EmptyState v-if="error && !loading" tone="error" :message="error" @retry="load" />
    <div v-else-if="doc" class="txd">
      <div v-if="voiding.show" class="panel panel--pad txd__void">
        <FormField v-bind="d.reason" for="txd-reason" required full>
          <input id="txd-reason" v-model="voiding.reason" :placeholder="t.placeholders.reason" />
        </FormField>
        <div class="txd__void-actions">
          <button type="button" class="btn btn--ghost" @click="voiding.show = false">{{ site.common.cancel }}</button>
          <button type="button" class="btn btn--danger" @click="askVoid"><AppIcon name="x" /> {{ d.void }}</button>
        </div>
      </div>

      <div class="panel panel--pad txd__head">
        <StatusBadge :status="doc.status" />
        <dl class="txd__facts">
          <div v-for="[k, v] in facts" :key="k" class="txd__fact">
            <dt>{{ k }}</dt>
            <dd>{{ v }}</dd>
          </div>
        </dl>
      </div>

      <DataTable :columns="columns" :rows="doc.lines" :title="title" :filters-text="facts.map(([k, v]) => `${k}: ${v}`)" />

      <EntryPreview v-if="entryLines.length" :lines="entryLines" :title="d.entry" />
      <p v-else class="txd__note"><AppIcon name="info" /> {{ seesEntry || !doc.journalEntryId ? d.noEntry : d.entryHidden }}</p>
    </div>

    <ConfirmModal
      :open="voiding.confirm"
      danger
      :title="d.voidTitle"
      :subject="title"
      :message="d.voidMessage"
      :second-message="d.voidSecond"
      :second-label="d.voidLabel"
      :loading="voiding.saving"
      :error="voiding.error"
      @confirm="confirmVoid"
      @cancel="voiding.confirm = false"
    />
  </section>
</template>

<style scoped lang="scss">
.txd {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__void {
    @include flex(column, stretch, flex-start, 0.75rem);
  }

  &__void-actions {
    @include flex(row, center, flex-end, 0.5rem);
  }

  &__head {
    @include flex(column, flex-start, flex-start, 0.75rem);
  }

  &__facts {
    @include flex(row, flex-start, flex-start, 0.75rem 1.5rem);
    flex-wrap: wrap;
    margin: 0;
  }

  &__fact {
    flex: 1 1 180px;

    dt {
      @include eyebrow;
    }

    dd {
      margin: 0.15rem 0 0;
    }
  }

  &__note {
    @include flex(row, center, flex-start, 0.4rem);
    font-size: $text-sm;
    color: $ink-muted;
  }
}
</style>
