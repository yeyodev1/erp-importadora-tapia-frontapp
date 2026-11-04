<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import FormField from '@/components/ui/FormField.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DataTable from '@/components/table/DataTable.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import type { Column } from '@/components/table/columns'
import SaleTotals from '@/components/sales/SaleTotals.vue'
import SriPanel from '@/components/sales/SriPanel.vue'
import { useAccess } from '@/composables/useAccess'
import { useInvoiceDetail } from '@/composables/sales/useInvoiceDetail'
import { useCatalogStore } from '@/stores/catalog'
import { formatDay } from '@/utils/format'
import { facturacion as t } from '@/config/copy/facturacion'
import type { SaleLine, SalesInvoice } from '@/services/sales.service'

/** Detalle de factura: datos, líneas, saldo, SRI/RIDE, asiento y anulación con doble confirmación. */
const route = useRoute()
const router = useRouter()
const { canWrite } = useAccess()
const catalog = useCatalogStore()
catalog.ensure('warehouses')

const d = useInvoiceDetail(String(route.params.id))
const { invoice, entry, voidReason, voidOpen } = d

const c = t.cols
const lineCols: Column<SaleLine>[] = [
  { key: 'code', label: c.code, width: '6rem' },
  { key: 'name', label: c.product },
  { key: 'qty', label: c.qty, format: 'qty', total: true },
  { key: 'unitPrice', label: c.price, format: 'money' },
  { key: 'discount', label: c.discount, format: 'money', total: true },
  { key: 'vatRate', label: c.vatRate, help: t.colHelp.vatRate, format: 'int', width: '4rem' },
  { key: 'subtotal', label: c.lineTotal, format: 'money', total: true },
]
type Movement = NonNullable<SalesInvoice['movements']>[number]
const movementCols: Column<Movement>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'kind', label: c.movement, help: t.colHelp.movement, value: (r) => t.movementKinds[r.kind] ?? r.kind, width: '9rem' },
  { key: 'description', label: c.reason },
  { key: 'amount', label: c.value, format: 'money', total: true },
]
</script>

<template>
  <section class="inv">
    <PageHeader :title="invoice ? `${route.meta.title} ${invoice.number}` : undefined" :subtitle="t.pages.invoiceDetail.subtitle">
      <button type="button" class="btn btn--ghost" @click="router.push({ name: 'Invoices' })"><AppIcon name="arrow-left" /> {{ t.actions.back }}</button>
    </PageHeader>

    <EmptyState v-if="d.error.value" tone="error" :message="d.error.value" @retry="d.load" />
    <section v-else-if="d.loading.value && !invoice" class="panel panel--pad" aria-busy="true"><SkeletonBlock :lines="4" /></section>

    <template v-else-if="invoice">
      <div class="panel panel--pad inv__head">
        <div class="inv__kv"><span>{{ c.customer }}</span><b>{{ invoice.customer.name }}</b><small class="mono">{{ invoice.customer.identification }}</small></div>
        <div class="inv__kv"><span>{{ c.date }}</span><b>{{ formatDay(invoice.date) }}</b><small>{{ t.invoices.due }} {{ formatDay(invoice.dueDate) }} · {{ invoice.creditDays }} d</small></div>
        <div class="inv__kv"><span>{{ c.warehouse }}</span><b>{{ catalog.warehouseName(invoice.warehouseId) }}</b><small>{{ invoice.priceList }}</small></div>
        <div class="inv__kv"><span>{{ c.seller }}</span><b>{{ invoice.sellerName || '—' }}</b><small>{{ t.invoices.createdBy }}: {{ invoice.createdBy?.name }}</small></div>
        <div class="inv__kv"><span>{{ c.status }}</span><StatusBadge :status="invoice.status" /><small v-if="invoice.voidReason">{{ invoice.voidReason }}</small></div>
      </div>

      <SriPanel kind="invoices" :doc="invoice" :can-write="canWrite" @updated="d.updateSri" />

      <h3 class="inv__h">{{ t.invoices.lines }}</h3>
      <DataTable :columns="lineCols" :rows="invoice.lines" :title="`${route.meta.title} ${invoice.number}`" :empty-message="t.pages.noLines" />
      <div class="panel panel--pad"><SaleTotals :totals="invoice" :balance="invoice.balance" /></div>

      <template v-if="invoice.movements?.length">
        <h3 class="inv__h">{{ t.invoices.movements }}</h3>
        <DataTable :columns="movementCols" :rows="invoice.movements" :exportable="false" />
      </template>

      <EntryPreview v-if="entry" :lines="entry" />
      <p v-else class="inv__muted">{{ t.invoices.entryHidden }}</p>

      <div v-if="canWrite && invoice.status === 'vigente'" class="panel panel--pad inv__void">
        <FormField v-bind="t.fields.voidReason" for="inv-void" full>
          <input id="inv-void" v-model="voidReason" maxlength="200" :placeholder="t.placeholders.voidReason" />
        </FormField>
        <button type="button" class="btn btn--danger" :disabled="!voidReason.trim()" @click="voidOpen = true">
          <AppIcon name="x" /> {{ t.actions.void }}
        </button>
      </div>

      <ConfirmModal
        :open="voidOpen"
        danger
        :title="t.invoices.voidTitle"
        :subject="`${invoice.number} · ${voidReason}`"
        :message="t.invoices.voidMessage"
        :second-message="t.invoices.voidSecond"
        :second-label="t.invoices.voidLabel"
        :loading="d.voiding.value"
        :error="d.voidError.value"
        @confirm="d.confirmVoid"
        @cancel="voidOpen = false"
      />
    </template>
  </section>
</template>

<style scoped lang="scss">
.inv {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__head {
    @include flex-cards(180px, 1rem);
  }

  &__kv {
    @include flex(column, flex-start, flex-start, 0.15rem);

    span {
      color: $ink-muted;
      font-size: 0.85rem;
    }

    small {
      color: $ink-soft;
    }
  }

  &__h {
    margin: 0.5rem 0 0;
    font-size: 1rem;
  }

  &__muted {
    margin: 0;
    color: $ink-muted;
    font-size: 0.9rem;
  }

  &__void {
    @include flex(column, stretch, flex-start, 0.75rem);

    @include from('md') {
      flex-direction: row;
      align-items: flex-end;

      > :first-child {
        flex: 1;
      }
    }
  }
}
</style>
