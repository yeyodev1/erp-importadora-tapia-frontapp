<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import WarehousePicker from '@/components/pickers/WarehousePicker.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import { newLine, useTransactionForm } from '@/composables/inventory/useTransactionForm'
import { useAccess } from '@/composables/useAccess'
import { TRANSACTION_TYPES } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'
import { site } from '@/config/site'
import { formatMoney, sumCents } from '@/utils/money'

/** Nuevo documento de inventario: cabecera según el tipo y líneas producto / cantidad / costo. */
const t = copy.transactions
const f = t.fields
const { canWrite } = useAccess()
const { doc, columns, saving, error, isTransfer, showsCost, usesSupplier, filled, lineTotal, save } = useTransactionForm()

const typeOptions = TRANSACTION_TYPES.map((value) => ({ value, label: copy.types[value] ?? value, hint: copy.typeHelp[value] }))
const ph = t.placeholders
const total = computed(() => sumCents(filled.value, lineTotal))
const setContainers = (e: Event) => (doc.containers = Math.max(0, Math.trunc(Number((e.target as HTMLInputElement).value) || 0)))
</script>

<template>
  <section>
    <PageHeader :subtitle="copy.pages.form">
      <RouterLink :to="{ name: 'InventoryTransactions' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.back }}</RouterLink>
    </PageHeader>

    <EmptyState v-if="!canWrite" tone="error" :message="site.access.denied" />
    <form v-else class="tx" @submit.prevent="save">
      <div class="panel panel--pad">
        <div class="form-grid">
          <FormField v-bind="f.type" for="tx-type" :hint="copy.typeHelp[doc.type]" required>
            <BaseCombobox id="tx-type" :model-value="doc.type" :options="typeOptions" @update:model-value="doc.type = $event as typeof doc.type" />
          </FormField>
          <FormField v-bind="f.warehouseId" for="tx-wh" required>
            <WarehousePicker id="tx-wh" v-model="doc.warehouseId" />
          </FormField>
          <FormField v-if="isTransfer" v-bind="f.targetWarehouseId" for="tx-target" required>
            <WarehousePicker id="tx-target" v-model="doc.targetWarehouseId" />
          </FormField>
          <FormField v-bind="f.date" for="tx-date" class="narrow" required>
            <BaseDatePicker id="tx-date" v-model="doc.date" />
          </FormField>
          <FormField v-if="usesSupplier" v-bind="f.partyId" for="tx-party" :required="doc.type === 'INGRESO_COMPRA'">
            <PartyPicker id="tx-party" v-model="doc.partyId" role="supplier" clearable />
          </FormField>
          <FormField v-else v-bind="f.responsible" for="tx-resp">
            <input id="tx-resp" v-model="doc.responsible" :placeholder="ph.responsible" />
          </FormField>
          <FormField v-bind="f.costCenter" for="tx-cc">
            <input id="tx-cc" v-model="doc.costCenter" :placeholder="ph.costCenter" />
          </FormField>
          <FormField v-if="doc.type === 'INGRESO_IMPORTACION'" v-bind="f.containers" for="tx-cont" class="narrow">
            <input id="tx-cont" class="num" inputmode="numeric" :placeholder="ph.containers" :value="doc.containers" @change="setContainers" />
          </FormField>
          <FormField v-bind="f.description" for="tx-desc" full>
            <input id="tx-desc" v-model="doc.description" :placeholder="ph.description" />
          </FormField>
        </div>
      </div>

      <div class="panel panel--pad">
        <h2 class="form-section">{{ t.lines }}</h2>
        <p v-if="!showsCost" class="tx__note"><AppIcon name="info" /> {{ t.avgCostNote }}</p>
        <DocumentLines
          v-model="doc.lines"
          :columns="columns"
          :new-line="newLine"
          id-prefix="tx-line"
          @pick-product="(line, p) => (line.product = p)"
        />
      </div>

      <div class="tx__foot">
        <p v-if="error" class="tx__error" role="alert">{{ error }}</p>
        <span v-if="showsCost" class="tx__total">{{ t.total }}: <strong class="num">{{ formatMoney(total) }}</strong></span>
        <button type="submit" class="btn btn--primary" :disabled="saving">
          <AppIcon :name="saving ? 'spinner' : 'check'" :spin="saving" /> {{ t.save }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped lang="scss">
.tx {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__note {
    @include flex(row, center, flex-start, 0.4rem);
    margin: 0.5rem 0;
    font-size: $text-sm;
    color: $ink-muted;
  }

  &__foot {
    @include flex(row, center, flex-end, 0.75rem);
    flex-wrap: wrap;
  }

  &__total {
    font-size: $text-sm;
    color: $ink-soft;
  }

  &__error {
    flex: 1 1 100%;
    color: $danger;
    font-size: $text-sm;

    @include from('md') {
      flex: 1 1 auto;
    }
  }
}
</style>
