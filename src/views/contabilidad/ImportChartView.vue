<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { accountingService, type ChartImportResult, type ChartRow } from '@/services/accounting.service'
import { useToastStore } from '@/stores/toast'
import { accounting as t } from '@/config/copy/accounting'
import { accountingScreens } from '@/config/copy/accountingScreens'
import type { ApiError } from '@/types'
import { chartCsvFromCells, isExcel, readSheet } from '@/utils/macioExcel'

/** Importar plan de cuentas: pegar o subir CSV → previsualizar (errores) → aplicar con doble confirmación. */
const c = t.importChart
const s = accountingScreens.importChart
const { canWrite } = useAccess()
const toast = useToastStore()

const csv = ref('')
const result = ref<ChartImportResult | null>(null)
const loading = ref(false)
const error = ref('')
const confirming = ref(false)
const file = ref<HTMLInputElement | null>(null)
const replace = ref(false)
const reading = ref(false)
const excelCount = ref(0)

async function onFile(event: Event) {
  const f = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!f) return
  result.value = null
  error.value = ''
  excelCount.value = 0
  if (!isExcel(f)) {
    csv.value = await f.text()
    return
  }
  reading.value = true
  try {
    const parsed = chartCsvFromCells(await readSheet(f))
    if (!parsed.count) throw new Error(c.notChart)
    csv.value = parsed.csv
    excelCount.value = parsed.count
    await send('preview')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    reading.value = false
  }
}

async function send(mode: 'preview' | 'apply') {
  loading.value = true
  error.value = ''
  try {
    result.value = await accountingService.importChart(csv.value, mode, replace.value)
    if (mode === 'apply') {
      toast.success(`${c.applied}: ${result.value.created ?? 0} / ${result.value.updated ?? 0} / ${result.value.removed ?? 0}`)
      confirming.value = false
    }
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}

const changes = computed(() => (result.value ? result.value.toCreate.length + result.value.toUpdate.length + (result.value.toRemove?.length ?? 0) : 0))
const canApply = computed(() => canWrite.value && result.value?.mode === 'preview' && result.value.valid && changes.value > 0)
const applyMessage = computed(() =>
  c.applyMessage
    .replace('{create}', String(result.value?.toCreate.length ?? 0))
    .replace('{update}', String(result.value?.toUpdate.length ?? 0))
    .replace('{remove}', String(result.value?.toRemove?.length ?? 0)),
)

const kind = (k?: string) => (k === 'mayor' ? 'Mayor' : k === 'movimiento' ? 'Movimiento' : '')
const createCols: Column<ChartRow>[] = [
  { key: 'line', label: s.line, help: s.lineHelp, format: 'int', width: '4rem' },
  { key: 'code', label: t.common.code },
  { key: 'name', label: t.common.name },
  { key: 'kind', label: s.kind, help: s.kindHelp, value: (r) => kind(r.kind) },
]
const removeCols: Column<ChartRow>[] = [
  { key: 'code', label: t.common.code },
  { key: 'name', label: t.common.name },
  { key: 'kind', label: s.kind, help: s.kindHelp, value: (r) => kind(r.kind) },
]
const keptCols: Column<ChartRow & { reason: string }>[] = [...removeCols, { key: 'reason', label: c.reason }]
const updateCols: Column<ChartRow>[] = [
  ...createCols,
  { key: 'before', label: c.before, help: s.beforeHelp, value: (r) => `${r.previousName} · ${kind(r.previousKind)}` },
]
</script>

<template>
  <section class="ic">
    <PageHeader :subtitle="c.intro" />

    <div class="panel panel--pad ic__form">
      <FormField v-bind="c.csv" for="ic-csv">
        <textarea id="ic-csv" v-model="csv" class="mono" rows="10" spellcheck="false" placeholder="1.1.01;CAJA;mayor&#10;1.1.01.01;CAJA GENERAL;movimiento" @input="result = null" />
      </FormField>
      <div class="ic__actions">
        <input ref="file" type="file" accept=".xls,.xlsx,.csv,.txt,text/csv,text/plain" class="ic__file" @change="onFile" />
        <BaseButton variant="ghost" icon="excel" :loading="reading" @click="file?.click()">{{ reading ? c.reading : c.upload }}</BaseButton>
        <BaseButton variant="primary" icon="search" :loading="loading" :disabled="!csv.trim()" @click="send('preview')">{{ c.preview }}</BaseButton>
        <button v-if="canApply" type="button" class="btn btn--dark" @click="confirming = true"><AppIcon name="check" /> {{ c.apply }}</button>
      </div>
      <BaseSwitch v-model="replace" :label="c.replace.label" :help="c.replace.help" @update:model-value="result = null" />
      <p v-if="excelCount" class="ic__note"><AppIcon name="excel" /> {{ c.fromExcel }}: <strong>{{ excelCount }}</strong></p>
      <p v-if="error && !confirming" class="ic__error" role="alert"><AppIcon name="alert" /> {{ error }}</p>
    </div>

    <template v-if="result">
      <p class="ic__status">
        <BaseBadge :tone="result.valid ? 'success' : 'danger'">{{ result.valid ? c.valid : c.invalid }}</BaseBadge>
        {{ c.toCreate }}: <strong>{{ result.toCreate.length }}</strong> · {{ c.toUpdate }}: <strong>{{ result.toUpdate.length }}</strong> ·
        {{ result.unchanged }} {{ c.unchanged }}<template v-if="replace"> · {{ c.toRemove }}: <strong>{{ result.toRemove?.length ?? 0 }}</strong></template>
      </p>
      <div v-if="result.errors.length" class="panel panel--pad ic__errors">
        <h3><AppIcon name="alert-circle" /> {{ c.errors }} ({{ result.errors.length }})</h3>
        <ul>
          <li v-for="e in result.errors" :key="e">{{ e }}</li>
        </ul>
      </div>
      <h3 v-if="result.toCreate.length" class="ic__title">{{ c.toCreate }}</h3>
      <DataTable v-if="result.toCreate.length" :columns="createCols" :rows="result.toCreate" row-key="code" :title="c.toCreate" />
      <h3 v-if="result.toUpdate.length" class="ic__title">{{ c.toUpdate }}</h3>
      <DataTable v-if="result.toUpdate.length" :columns="updateCols" :rows="result.toUpdate" row-key="code" :title="c.toUpdate" />
      <h3 v-if="result.toRemove?.length" class="ic__title">{{ c.toRemove }}</h3>
      <DataTable v-if="result.toRemove?.length" :columns="removeCols" :rows="result.toRemove" row-key="code" :title="c.toRemove" />
      <h3 v-if="result.kept?.length" class="ic__title">{{ c.kept }}</h3>
      <DataTable v-if="result.kept?.length" :columns="keptCols" :rows="result.kept" row-key="code" :title="c.kept" />
    </template>

    <ConfirmModal
      :open="confirming"
      :title="c.apply"
      :message="applyMessage"
      :second-message="c.applySecond"
      :second-label="c.apply"
      :loading="loading"
      :error="error"
      @confirm="send('apply')"
      @cancel="confirming = false"
    />
  </section>
</template>

<style scoped lang="scss">
.ic {
  &__form {
    @include flex(column, stretch, flex-start, 0.75rem);
    margin-bottom: 0.75rem;
  }

  &__actions {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
  }

  &__file {
    @include visually-hidden;
  }

  &__note {
    @include flex(row, center, flex-start, 0.35rem);
    color: $ink-muted;
    font-size: $text-sm;
  }

  &__error {
    color: $danger;
    font-size: $text-sm;
  }

  &__status {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
    font-size: $text-sm;
  }

  &__errors {
    margin-bottom: 0.75rem;
    color: $danger;
    font-size: $text-sm;

    ul {
      margin-top: 0.5rem;
      padding-left: 1.1rem;
    }
  }

  &__title {
    margin: 0.75rem 0 0.5rem;
    font-size: $text-base;
  }
}
</style>
