<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ReasonConfirm from '@/components/accounting/ReasonConfirm.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { migrationService } from '@/services/migration.service'
import { useToastStore } from '@/stores/toast'
import { migration } from '@/config/copy/migration'
import { formatDateTime } from '@/utils/format'
import type { ApiError, ImportBatch } from '@/types'

/** Historial de lotes de importación y "Quitar datos importados" (motivo + doble confirmación). */
const h = migration.history
const toast = useToastStore()
const rows = ref<ImportBatch[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)
const target = ref<ImportBatch | null>(null)
const undoing = ref(false)
const undoError = ref('')

async function reload() {
  loading.value = true
  loadError.value = null
  try {
    rows.value = await migrationService.batches()
  } catch (e) {
    loadError.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}
onMounted(reload)
defineExpose({ reload })

async function undo(reason: string) {
  if (!target.value) return
  undoing.value = true
  undoError.value = ''
  try {
    await migrationService.undo(target.value._id, reason)
    toast.success(`${h.undone}: ${target.value.number}`)
    target.value = null
    await reload()
  } catch (e) {
    undoError.value = (e as ApiError).message
  } finally {
    undoing.value = false
  }
}

const COUNT_LABELS: Record<string, string> = {
  clientsCreated: 'clientes', productsCreated: 'productos', stockLines: 'saldos de stock', invoices: 'facturas',
  suppliersCreated: 'proveedores', suppliersMarked: 'marcados proveedor', photos: 'fotos',
}
const summary = (b: ImportBatch) =>
  Object.entries(b.counts)
    .filter(([key, n]) => COUNT_LABELS[key] && n)
    .map(([key, n]) => `${n.toLocaleString('en-US')} ${COUNT_LABELS[key]}`)
    .join(' · ')
const c = h.cols
const cols: Column<ImportBatch>[] = [
  { key: 'number', ...c.number },
  { key: 'createdAt', ...c.date, value: (b) => formatDateTime(b.createdAt) },
  { key: 'source', ...c.source, value: (b) => h.sources[b.source] },
  { key: 'user', ...c.user, value: (b) => b.createdBy?.name },
  { key: 'counts', ...c.counts, value: summary },
  { key: 'total', ...c.total, format: 'money', value: (b) => b.totals?.receivables ?? 0 },
  { key: 'status', ...c.status },
  { key: 'actions', label: '', screenOnly: true },
]
</script>

<template>
  <section class="bh">
    <header class="bh__head">
      <AppIcon name="clock" />
      <h2>{{ h.title }}</h2>
      <HelpTip :text="h.help" />
    </header>
    <DataTable :columns="cols" :rows="rows" row-key="_id" :loading="loading" :error="loadError" :title="h.title" :empty-message="h.empty" :row-class="(b) => (b.status === 'quitado' ? 'is-void' : undefined)" @retry="reload">
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
        <small v-if="row.undoReason" class="bh__reason">{{ row.undoReason }}</small>
      </template>
      <template #cell-actions="{ row }">
        <BaseButton v-if="row.status === 'aplicado'" size="sm" variant="danger" icon="trash" @click="(undoError = ''), (target = row)">{{ h.undo }}</BaseButton>
      </template>
    </DataTable>

    <ReasonConfirm
      :open="!!target"
      :title="h.undo"
      :subject="target?.number"
      :message="h.undoMessage"
      :second-message="h.undoSecond"
      :reason="h.reason"
      :loading="undoing"
      :error="undoError"
      @confirm="undo"
      @cancel="target = null"
    />
  </section>
</template>

<style scoped lang="scss">
.bh {
  @include flex(column, stretch, flex-start, 0.5rem);

  &__head {
    @include flex(row, center, flex-start, 0.5rem);

    h2 {
      font-size: $text-lg;
    }
  }

  &__reason {
    display: block;
    color: $ink-muted;
  }
}
</style>
