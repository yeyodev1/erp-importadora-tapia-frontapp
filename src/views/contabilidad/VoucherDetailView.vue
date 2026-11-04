<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReasonConfirm from '@/components/accounting/ReasonConfirm.vue'
import PrintSignatures from '@/components/accounting/PrintSignatures.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useReport } from '@/composables/accounting/useReport'
import { accountingService, type EntryLine } from '@/services/accounting.service'
import { useToastStore } from '@/stores/toast'
import { formatDay } from '@/utils/format'
import { accounting as t } from '@/config/copy/accounting'
import { accountingScreens } from '@/config/copy/accountingScreens'
import type { ApiError } from '@/types'

/** Consulta de un comprobante: líneas, auditoría (usuario, fecha y hora), origen y anulación. */
const route = useRoute()
const toast = useToastStore()
const { canWrite } = useAccess()
const d = t.detail
const s = accountingScreens
const h = s.columns

const id = computed(() => String(route.params.id ?? ''))
const report = useReport(() => accountingService.getEntry(id.value))
const entry = report.data
watch(id, (v) => v && report.run(), { immediate: true })

const typeLabel = computed(() => {
  const e = entry.value
  if (!e) return ''
  return e.subtype ? `${t.entryTypes[e.type]} · ${t.subtypes[e.subtype]}` : (t.entryTypes[e.type] ?? e.type)
})
const moduleLabel = (m: string) => t.modules[m] ?? m

/** Por qué no se anula aquí (o '' si sí se puede). */
const blockedReason = computed(() => {
  const e = entry.value
  if (!e || e.status === 'anulado') return ''
  if (e.type === 'CIERRE') return d.closeHere
  if (e.type === 'REVERSO') return d.reversalHere
  if (!e.sourceDocument.editable) {
    const doc = [e.source.docType, e.source.docNumber].filter(Boolean).join(' ') || e.number
    return d.notHere.replace('{module}', moduleLabel(e.source.module)).replace('{doc}', doc)
  }
  return ''
})
const canVoid = computed(() => canWrite.value && entry.value?.status === 'contabilizado' && !blockedReason.value)

/** Beneficiario del encabezado, como en la consulta de hoy: las personas de las líneas. */
const beneficiary = computed(() => [...new Set((entry.value?.lines ?? []).map((l) => l.party?.name).filter(Boolean))].join(', '))

// Mismo orden que la consulta de comprobante del sistema anterior: Código | Nombre | Debe | Haber | … | Descripción.
const columns: Column<EntryLine>[] = [
  { key: 'accountCode', label: t.common.code, width: '10rem' },
  { key: 'accountName', label: t.common.name },
  { key: 'debit', label: t.common.debit, help: h.debitHelp, format: 'money', total: true, value: (l) => l.debit || null },
  { key: 'credit', label: t.common.credit, help: h.creditHelp, format: 'money', total: true, value: (l) => l.credit || null },
  { key: 'costCenter', label: t.common.costCenter, help: h.costCenterHelp },
  { key: 'description', label: t.common.description },
  { key: 'party', label: h.party, help: h.partyHelp, value: (l) => l.party?.name ?? '' },
]

const printFilters = computed(() => {
  const e = entry.value
  if (!e) return []
  return [
    `${typeLabel.value} · ${formatDay(e.date)}`,
    ...(beneficiary.value ? [`${s.detail.beneficiary}: ${beneficiary.value}`] : []),
    e.description,
    `${d.source}: ${moduleLabel(e.source.module)} ${e.source.docNumber}`.trim(),
    `${d.user}: ${e.audit.user} · ${formatDay(e.audit.date)} ${e.audit.time ?? ''}`,
  ]
})

const voiding = ref(false)
const saving = ref(false)
const error = ref('')

async function voidEntry(reason: string) {
  saving.value = true
  error.value = ''
  try {
    await accountingService.voidEntry(id.value, reason)
    toast.success(d.voided)
    voiding.value = false
    await report.run()
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <PageHeader :title="entry ? `${t.common.number} ${entry.number}` : undefined" :subtitle="s.detail.subtitle">
      <RouterLink :to="{ name: 'Vouchers' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.common.back }}</RouterLink>
      <button v-if="canVoid" type="button" class="btn btn--danger" @click="(error = ''), (voiding = true)"><AppIcon name="x" /> {{ d.void }}</button>
    </PageHeader>

    <EmptyState v-if="report.error.value" tone="error" :message="report.error.value" @retry="report.run" />

    <template v-else-if="entry">
      <div class="vd panel panel--pad">
        <div class="vd__main">
          <p class="vd__type">
            {{ typeLabel }} <StatusBadge :status="entry.status" />
            <HelpTip v-if="entry.status === 'contabilizado'" :text="s.mayorized.help" :label="s.mayorized.label" />
          </p>
          <p v-if="beneficiary" class="vd__meta">{{ s.detail.beneficiary }} <HelpTip :text="s.detail.beneficiaryHelp" />: <strong>{{ beneficiary }}</strong></p>
          <p class="vd__desc">{{ entry.description }}</p>
          <p class="vd__meta">{{ t.common.date }}: <strong>{{ formatDay(entry.date) }}</strong></p>
          <p class="vd__meta">
            {{ d.source }}: <strong>{{ moduleLabel(entry.source.module) }}</strong>
            <template v-if="entry.source.docType || entry.source.docNumber"> · {{ t.subtypes[entry.source.docType] ?? entry.source.docType }} {{ entry.source.docNumber }}</template>
          </p>
          <p v-if="entry.reversedByEntry" class="vd__meta">
            {{ d.reversedBy }}
            <RouterLink class="vd__link" :to="{ name: 'VoucherDetail', params: { id: entry.reversedByEntry._id } }">{{ entry.reversedByEntry.number }}</RouterLink>
          </p>
          <p v-if="entry.reversalOfEntry" class="vd__meta">
            {{ d.reversalOf }}
            <RouterLink class="vd__link" :to="{ name: 'VoucherDetail', params: { id: entry.reversalOfEntry._id } }">{{ entry.reversalOfEntry.number }}</RouterLink>
          </p>
        </div>
        <dl class="vd__audit">
          <dt>{{ d.audit }}</dt>
          <dd><AppIcon name="user" /> {{ d.user }}: <strong>{{ entry.audit.user || '—' }}</strong></dd>
          <dd><AppIcon name="calendar" /> {{ t.common.date }}: <strong>{{ formatDay(entry.audit.date) || '—' }}</strong></dd>
          <dd><AppIcon name="info" /> {{ d.time }}: <strong>{{ entry.audit.time || '—' }}</strong></dd>
        </dl>
      </div>

      <p v-if="blockedReason" class="vd__note"><AppIcon name="info" /> {{ blockedReason }}</p>

      <DataTable :columns="columns" :rows="entry.lines" :title="`${typeLabel} ${entry.number}`" :filters-text="printFilters" :empty-message="s.detail.empty" landscape>
        <template #cell-accountCode="{ row }"><span class="mono">{{ row.accountCode }}</span></template>
      </DataTable>
      <PrintSignatures />
    </template>

    <ReasonConfirm
      :open="voiding"
      :title="d.void"
      :subject="entry?.number"
      :message="d.voidMessage"
      :second-message="d.voidSecond"
      :reason="s.detail.reason"
      :loading="saving"
      :error="error"
      @confirm="voidEntry"
      @cancel="voiding = false"
    />
  </section>
</template>

<style scoped lang="scss">
.vd {
  @include flex(column, stretch, flex-start, 1rem);
  margin-bottom: 0.75rem;

  @include from('md') {
    flex-direction: row;
    justify-content: space-between;
  }

  &__main {
    @include flex(column, flex-start, flex-start, 0.35rem);
    flex: 1 1 auto;
    min-width: 0;
  }

  &__type {
    @include flex(row, center, flex-start, 0.5rem);
    font-weight: 600;
  }

  &__desc {
    color: $ink-soft;
  }

  &__meta {
    font-size: $text-sm;
    color: $ink-soft;
  }

  &__link {
    color: $accent;
    text-decoration: underline;
  }

  &__audit {
    @include flex(column, flex-start, flex-start, 0.3rem);
    flex: 0 0 auto;
    padding: 0.75rem 1rem;
    border: 1px solid $line;
    border-radius: $radius-sm;
    background: $paper;
    font-size: $text-sm;

    dt {
      @include eyebrow;
    }
  }

  &__note {
    @include flex(row, flex-start, flex-start, 0.5rem);
    margin-bottom: 0.75rem;
    padding: 0.6rem 0.9rem;
    border-radius: $radius-sm;
    background: $info-bg;
    color: $info;
    font-size: $text-sm;
  }
}
</style>
