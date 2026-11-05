<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StatChips from '@/components/accounting/StatChips.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { migrationService } from '@/services/migration.service'
import { useToastStore } from '@/stores/toast'
import { migration } from '@/config/copy/migration'
import { readSheet, suppliersFromCells, type SupplierCells } from '@/utils/macioExcel'
import { fill } from './fill'
import type { ApiError, SupplierListPreview } from '@/types'

/** Listado de proveedores de Macio en Excel: subir → vista previa → importar (doble confirmación). */
const c = migration.supplierExcel
const emit = defineEmits<{ imported: [] }>()
const toast = useToastStore()
const input = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const rows = ref<SupplierCells[]>([])
const preview = ref<SupplierListPreview | null>(null)
const reading = ref(false)
const loading = ref(false)
const error = ref('')
const confirming = ref(false)

async function onFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  reading.value = true
  error.value = ''
  preview.value = null
  fileName.value = file.name
  try {
    rows.value = suppliersFromCells(await readSheet(file))
    if (!rows.value.length) throw new Error(c.notSuppliers)
    preview.value = await migrationService.supplierListPreview(rows.value)
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    reading.value = false
  }
}

async function apply() {
  loading.value = true
  error.value = ''
  try {
    await migrationService.supplierListApply(rows.value)
    toast.success(c.applied)
    confirming.value = false
    emit('imported')
    preview.value = await migrationService.supplierListPreview(rows.value)
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}

const stats = computed(() => {
  const n = preview.value?.counts
  return n
    ? [
        { label: c.toImport, value: n.toCreate + n.toMark, money: false },
        { label: c.already, value: n.already, money: false },
        { label: c.problems, value: n.problems, money: false },
        { label: c.skipped, value: n.skipped, money: false },
      ]
    : []
})
const message = computed(() => (preview.value ? fill(c.applyMessage, preview.value.counts) : ''))
const k = migration.cols
const supplierCols: Column[] = [{ key: 'name', ...k.name }, { key: 'identification', ...k.identification }, { key: 'status', ...k.status }]
const reasonCols: Column[] = [{ key: 'name', ...k.name }, { key: 'identification', ...k.identification }, { key: 'reason', ...k.problem }]
</script>

<template>
  <article class="se panel panel--pad">
    <header class="se__head">
      <AppIcon name="excel" />
      <h2>{{ c.title }}</h2>
      <HelpTip :text="c.help" />
    </header>
    <div class="se__actions">
      <input ref="input" type="file" accept=".xls,.xlsx" class="se__file" @change="onFile" />
      <BaseButton variant="primary" icon="upload" :loading="reading" @click="input?.click()">{{ reading ? c.reading : c.upload }}</BaseButton>
      <BaseButton v-if="preview?.canApply" variant="dark" icon="check" @click="confirming = true">{{ c.apply }}</BaseButton>
    </div>
    <p v-if="fileName" class="se__name"><AppIcon name="excel" /> {{ c.file }}: {{ fileName }}</p>
    <p v-if="error && !confirming" class="se__error" role="alert"><AppIcon name="alert" /> {{ error }}</p>
    <template v-if="preview">
      <StatChips :items="stats" />
      <DataTable v-if="preview.suppliers.length" :columns="supplierCols" :rows="preview.suppliers" row-key="identification" :title="c.toImport">
        <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      </DataTable>
      <h3 v-if="preview.problems.length" class="se__title">{{ c.problems }}</h3>
      <DataTable v-if="preview.problems.length" :columns="reasonCols" :rows="preview.problems" row-key="identification" :title="c.problems" />
      <h3 v-if="preview.skipped.length" class="se__title">{{ c.skipped }}</h3>
      <DataTable v-if="preview.skipped.length" :columns="reasonCols" :rows="preview.skipped" row-key="line" :title="c.skipped" />
    </template>

    <ConfirmModal
      :open="confirming"
      :title="c.applyTitle"
      :message="message"
      :second-message="c.applySecond"
      :second-label="c.apply"
      :loading="loading"
      :error="error"
      @confirm="apply"
      @cancel="confirming = false"
    />
  </article>
</template>

<style scoped lang="scss">
.se {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__head {
    @include flex(row, center, flex-start, 0.5rem);

    h2 {
      font-size: $text-lg;
    }
  }

  &__actions {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
  }

  &__file {
    @include visually-hidden;
  }

  &__name {
    @include flex(row, center, flex-start, 0.35rem);
    color: $ink-muted;
    font-size: $text-sm;
  }

  &__title {
    font-size: $text-base;
  }

  &__error {
    color: $danger;
    font-size: $text-sm;
  }
}
</style>
