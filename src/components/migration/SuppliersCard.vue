<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StatChips from '@/components/accounting/StatChips.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { migrationService } from '@/services/migration.service'
import { useToastStore } from '@/stores/toast'
import { migration } from '@/config/copy/migration'
import { fill } from './fill'
import type { ApiError, SuppliersPreview } from '@/types'

/** App de Proveedores: vista previa → importar proveedores con RUC y fotos de productos (doble confirmación). */
const c = migration.suppliers
const emit = defineEmits<{ imported: [] }>()
const toast = useToastStore()
const preview = ref<SuppliersPreview | null>(null)
const loading = ref(false)
const error = ref('')
const confirming = ref(false)

async function load() {
  error.value = ''
  try {
    preview.value = await migrationService.suppliersPreview()
  } catch (e) {
    error.value = (e as ApiError).message
  }
}

async function apply() {
  loading.value = true
  error.value = ''
  try {
    await migrationService.suppliersApply()
    toast.success(c.applied)
    confirming.value = false
    emit('imported')
    await load()
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
        { label: c.toImport, value: n.suppliers + n.marked, money: false },
        { label: c.withoutRuc, value: n.withoutRuc, money: false },
        { label: c.photos, value: n.photos, money: false },
      ]
    : []
})
const message = computed(() => (preview.value ? fill(c.applyMessage, preview.value.counts) : ''))
const k = migration.cols
const supplierCols: Column[] = [{ key: 'name', ...k.name }, { key: 'ruc', ...k.identification }, { key: 'status', ...k.status }]
const plainCols: Column[] = [{ key: 'name', ...k.name }, { key: 'reason', ...k.problem }]
const photoCols: Column[] = [{ key: 'code', ...k.code }, { key: 'name', ...k.name }]
</script>

<template>
  <article class="panel panel--pad sc">
    <header class="sc__head">
      <AppIcon name="truck" />
      <h2>{{ c.title }}</h2>
      <HelpTip :text="c.help" />
    </header>
    <div class="sc__actions">
      <BaseButton variant="primary" icon="search" :action="load">{{ c.preview }}</BaseButton>
      <BaseButton v-if="preview?.canApply" variant="dark" icon="check" @click="confirming = true">{{ c.apply }}</BaseButton>
    </div>
    <p v-if="error && !confirming" class="sc__error" role="alert"><AppIcon name="alert" /> {{ error }}</p>
    <template v-if="preview">
      <EmptyState v-if="preview.empty || preview.message" :message="preview.message" />
      <template v-else>
        <StatChips :items="stats" />
        <DataTable v-if="preview.suppliers.length" :columns="supplierCols" :rows="preview.suppliers" row-key="ruc" :title="c.toImport">
          <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
        </DataTable>
        <h3 v-if="preview.withoutRuc.length" class="sc__title">{{ c.withoutRuc }}</h3>
        <DataTable v-if="preview.withoutRuc.length" :columns="plainCols" :rows="preview.withoutRuc" row-key="name" :title="c.withoutRuc" />
        <h3 v-if="preview.photos.length" class="sc__title">{{ c.photos }}</h3>
        <DataTable v-if="preview.photos.length" :columns="photoCols" :rows="preview.photos" row-key="code" :title="c.photos" />
        <h3 v-if="preview.photosSkipped.length" class="sc__title">{{ c.photosSkipped }}</h3>
        <DataTable v-if="preview.photosSkipped.length" :columns="plainCols" :rows="preview.photosSkipped" row-key="name" :title="c.photosSkipped" />
      </template>
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
.sc {
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

  &__title {
    font-size: $text-base;
  }

  &__error {
    color: $danger;
    font-size: $text-sm;
  }
}
</style>
