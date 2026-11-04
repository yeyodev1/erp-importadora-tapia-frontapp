<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useXmlBatch } from '@/composables/purchases/useXmlBatch'
import { setXmlDraft } from '@/composables/purchases/useInvoiceForm'
import { useAccess } from '@/composables/useAccess'
import { cxp } from '@/config/copy/cxp'
import type { ParsedXml } from '@/types/purchases'

type Row = ParsedXml & { index: number }

const t = cxp.xml
const router = useRouter()
const { canWrite } = useAccess()
const b = useXmlBatch()
const tab = ref<'pending' | 'registered' | 'errors'>('pending')
const input = ref<HTMLInputElement | null>(null)

const tabs = computed(() => [
  { value: 'pending' as const, label: t.pending, help: t.tabs.pending, count: b.batch.value?.pending.length ?? 0 },
  { value: 'registered' as const, label: t.registered, help: t.tabs.registered, count: b.batch.value?.registered.length ?? 0 },
  { value: 'errors' as const, label: t.errors, help: t.tabs.errors, count: b.batch.value?.errors.length ?? 0 },
])

const pendingColumns: Column<Row>[] = [
  { key: 'file', label: 'Archivo', value: (r) => b.nameOf(r.index) },
  { key: 'date', label: 'Fecha', format: 'date', value: (r) => r.invoice.date },
  { key: 'docNumber', label: 'Número', value: (r) => r.invoice.docNumber },
  { key: 'supplier', label: 'Proveedor', value: (r) => r.supplier.name },
  { key: 'ruc', label: 'RUC', value: (r) => r.supplier.ruc },
  { key: 'total', label: 'Total', format: 'money', total: true, value: (r) => r.invoice.total },
  { key: 'notes', label: 'Avisos', screenOnly: true, help: t.notesHelp },
  { key: 'open', label: '', screenOnly: true },
]
const registeredColumns: Column<Row>[] = [
  { key: 'file', label: 'Archivo', value: (r) => b.nameOf(r.index) },
  { key: 'docNumber', label: 'Número' },
  { key: 'accessKey', label: 'Clave de acceso', help: t.accessKeyHelp },
  { key: 'open', label: '', screenOnly: true },
]
const errorColumns: Column<{ index: number; message: string }>[] = [
  { key: 'file', label: 'Archivo', value: (r) => b.nameOf(r.index) },
  { key: 'message', label: 'Error' },
]

async function onFiles(event: Event) {
  await b.add((event.target as HTMLInputElement).files)
  if (input.value) input.value.value = ''
}

function open(row: Row) {
  setXmlDraft(b.xmlOf(row.index), row)
  router.push({ name: 'NewSupplierInvoice' })
}
</script>

<template>
  <section class="ix">
    <PageHeader :subtitle="cxp.pages.xml">
      <button v-if="b.count.value" type="button" class="btn btn--ghost" :disabled="b.loading.value" @click="b.check"><AppIcon name="refresh" :spin="b.loading.value" /> Revisar de nuevo</button>
      <button v-if="b.count.value" type="button" class="btn btn--ghost" @click="b.clear"><AppIcon name="trash" /> Limpiar</button>
    </PageHeader>

    <section class="panel panel--pad ix__drop">
      <p>{{ t.hint }}</p>
      <label v-if="canWrite" class="btn btn--primary ix__pick">
        <AppIcon :name="b.loading.value ? 'spinner' : 'upload'" :spin="b.loading.value" /> {{ t.pick }}
        <input ref="input" type="file" multiple accept=".xml,text/xml,application/xml" class="ix__input" @change="onFiles" />
      </label>
      <p v-if="b.error.value" class="ix__error" role="alert">{{ b.error.value }}</p>
    </section>

    <template v-if="b.batch.value">
      <BaseSegmented v-model="tab" tabs :options="tabs" :label="$route.meta.title" />
      <DataTable v-if="tab === 'pending'" :columns="pendingColumns" :rows="b.batch.value.pending" row-key="index" :loading="b.loading.value" :empty-message="t.emptyPending">
        <template #cell-docNumber="{ row }"><span class="mono">{{ row.invoice.docNumber }}</span></template>
        <template #cell-notes="{ row }">
          <BaseBadge v-if="!row.supplier.existingId" tone="info">Proveedor nuevo</BaseBadge>
          <BaseBadge v-for="w in row.warnings" :key="w" tone="warning" :title="w">Revisar</BaseBadge>
        </template>
        <template #cell-open="{ row }">
          <button v-if="canWrite" type="button" class="btn btn--sm btn--primary" @click="open(row)">{{ t.open }}</button>
        </template>
      </DataTable>
      <DataTable v-else-if="tab === 'registered'" :columns="registeredColumns" :rows="b.batch.value.registered" row-key="index" :empty-message="t.emptyRegistered">
        <template #cell-accessKey="{ row }"><span class="mono ix__key">{{ row.accessKey }}</span></template>
        <template #cell-open="{ row }">
          <RouterLink :to="{ name: 'SupplierInvoiceDetail', params: { id: row.existingId } }" class="btn btn--sm btn--ghost">{{ t.view }}</RouterLink>
        </template>
      </DataTable>
      <DataTable v-else :columns="errorColumns" :rows="b.batch.value.errors" row-key="index" :empty-message="t.emptyErrors" />
    </template>
  </section>
</template>

<style scoped lang="scss">
.ix {
  @include flex(column, stretch, flex-start, 1rem);
}

.ix__drop {
  @include flex(column, flex-start, flex-start, 0.75rem);
  color: $ink-soft;
}

.ix__pick {
  position: relative;
  cursor: pointer;
}

// Invisible sobre el botón: el clic y el teclado abren el selector de archivos del sistema.
.ix__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.ix__error {
  color: $danger;
}

.ix__key {
  word-break: break-all;
  font-size: 0.8rem;
}
</style>
