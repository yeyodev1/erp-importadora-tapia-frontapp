<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { migrationService } from '@/services/migration.service'
import { useToastStore } from '@/stores/toast'
import { migration } from '@/config/copy/migration'
import { fill } from './fill'
import type { ApiError, DemoItem, DemoPreview } from '@/types'

/** Datos de ejemplo del arranque: vista previa → quitar lo que nadie usa (doble confirmación). */
const c = migration.demo
const toast = useToastStore()
const preview = ref<DemoPreview | null>(null)
const loading = ref(false)
const error = ref('')
const confirming = ref(false)

async function load() {
  error.value = ''
  try {
    preview.value = await migrationService.demoPreview()
  } catch (e) {
    error.value = (e as ApiError).message
  }
}

async function apply() {
  loading.value = true
  error.value = ''
  try {
    const r = await migrationService.demoApply()
    toast.success(`${c.applied}: ${(r.removed?.products ?? 0) + (r.removed?.parties ?? 0)}`)
    confirming.value = false
    await load()
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}

const k = migration.cols
const cols: Column<DemoItem>[] = [
  { key: 'code', ...k.code, width: '8rem' },
  { key: 'name', ...k.name },
  { key: 'status', ...k.status },
  { key: 'usedBy', ...c.usedBy, value: (r) => r.usedBy.join('; ') },
]
const message = computed(() => fill(c.applyMessage, { remove: preview.value?.counts.remove ?? 0 }))
</script>

<template>
  <article class="panel panel--pad dc">
    <header class="dc__head">
      <AppIcon name="trash" />
      <h2>{{ c.title }}</h2>
      <HelpTip :text="c.help" />
    </header>
    <div class="dc__actions">
      <BaseButton variant="primary" icon="search" :action="load">{{ c.preview }}</BaseButton>
      <BaseButton v-if="preview?.counts.remove" variant="danger" icon="trash" @click="confirming = true">{{ c.apply }}</BaseButton>
    </div>
    <p v-if="error && !confirming" class="dc__error" role="alert"><AppIcon name="alert" /> {{ error }}</p>
    <template v-if="preview">
      <EmptyState v-if="preview.empty" :message="c.empty" tone="success" />
      <DataTable v-else :columns="cols" :rows="preview.items" row-key="id" :title="c.title">
        <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      </DataTable>
    </template>

    <ConfirmModal
      :open="confirming"
      danger
      :title="c.apply"
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
.dc {
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

  &__error {
    color: $danger;
    font-size: $text-sm;
  }
}
</style>
