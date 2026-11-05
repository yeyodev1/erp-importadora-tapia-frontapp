<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import FormField from '@/components/ui/FormField.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import MacioPreviewPanel from './MacioPreviewPanel.vue'
import { migrationService } from '@/services/migration.service'
import { useToastStore } from '@/stores/toast'
import { migration } from '@/config/copy/migration'
import { formatMoney } from '@/utils/money'
import { fill } from './fill'
import type { ApiError, MacioApplyResult, MacioPreview } from '@/types'

/** Subir el JSON de Macio → vista previa (no graba) → importar con doble confirmación. */
const c = migration.macio
const emit = defineEmits<{ imported: [] }>()
const toast = useToastStore()

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const data = ref<unknown>(null)
const preview = ref<MacioPreview | null>(null)
const result = ref<MacioApplyResult | null>(null)
const loading = ref(false)
const error = ref('')
const confirming = ref(false)

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  preview.value = null
  result.value = null
  error.value = ''
  try {
    data.value = JSON.parse(await file.text())
    fileName.value = file.name
  } catch {
    data.value = null
    fileName.value = ''
    error.value = c.badFile
  }
}

async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
  loading.value = true
  error.value = ''
  try {
    return await fn()
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}

async function loadPreview() {
  result.value = null
  preview.value = (await run(() => migrationService.macioPreview(data.value))) ?? null
}

async function apply() {
  const r = await run(() => migrationService.macioApply(data.value))
  if (!r) return
  result.value = r
  preview.value = null
  confirming.value = false
  toast.success(c.applied)
  emit('imported')
}

const applyMessage = computed(() =>
  preview.value
    ? fill(c.applyMessage, {
        clients: preview.value.counts.newClients,
        products: preview.value.counts.newProducts,
        stock: preview.value.counts.stockLines,
        invoices: preview.value.counts.invoices,
        total: formatMoney(preview.value.totals.receivables),
      })
    : '',
)
const verified = computed(() => {
  const v = result.value?.verification
  if (!v) return null
  const ok = v.agingMatches && v.agingCuadra && v.trialBalanceCuadra
  const message = fill(c.verified, {
    aging: formatMoney(v.agingAfter),
    agingOk: v.agingMatches && v.agingCuadra ? c.ok : c.notOk,
    trialOk: v.trialBalanceCuadra ? c.ok : c.notOk,
  })
  return { ok, message }
})
</script>

<template>
  <article class="panel panel--pad mc">
    <header class="mc__head">
      <AppIcon name="file-import" />
      <h2>{{ c.title }}</h2>
      <HelpTip :text="c.help" />
    </header>
    <FormField v-bind="c.file" for="mc-file">
      <div class="mc__file">
        <input id="mc-file" ref="fileInput" type="file" accept=".json,application/json" class="mc__input" @change="onFile" />
        <button type="button" class="btn btn--ghost" @click="fileInput?.click()"><AppIcon name="upload" /> {{ c.pick }}</button>
        <span class="mc__name">{{ fileName || c.noFile }}</span>
      </div>
    </FormField>
    <div class="mc__actions">
      <BaseButton variant="primary" icon="search" :loading="loading && !confirming" :disabled="!data" @click="loadPreview">{{ c.preview }}</BaseButton>
      <BaseButton v-if="preview?.canApply" variant="dark" icon="check" @click="confirming = true">{{ c.apply }}</BaseButton>
    </div>
    <p v-if="error && !confirming" class="mc__error" role="alert"><AppIcon name="alert" /> {{ error }}</p>
    <AlertBanner v-if="verified && result" :level="verified.ok ? 'success' : 'danger'" :title="`${c.applied} · ${result.batch.number}`" :message="verified.message" />
    <MacioPreviewPanel v-if="preview" :preview="preview" />

    <ConfirmModal
      :open="confirming"
      :title="c.applyTitle"
      :subject="fileName"
      :message="applyMessage"
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
.mc {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__head {
    @include flex(row, center, flex-start, 0.5rem);

    h2 {
      font-size: $text-lg;
    }
  }

  &__file,
  &__actions {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
  }

  &__input {
    @include visually-hidden;
  }

  &__name {
    color: $ink-soft;
    font-size: $text-sm;
    overflow-wrap: anywhere;
  }

  &__error {
    color: $danger;
    font-size: $text-sm;
  }
}
</style>
