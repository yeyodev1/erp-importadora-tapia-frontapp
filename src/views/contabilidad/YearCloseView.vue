<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReasonConfirm from '@/components/accounting/ReasonConfirm.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useReport } from '@/composables/accounting/useReport'
import { accountingService, type YearCloseEntry } from '@/services/accounting.service'
import { useCatalogStore } from '@/stores/catalog'
import { useToastStore } from '@/stores/toast'
import { formatDateTime, todayISO } from '@/utils/format'
import { formatMoney } from '@/utils/money'
import { accounting as t } from '@/config/copy/accounting'
import type { ApiError } from '@/types'

/** Cierre anual: asiento CIERRE al 31-dic y bloqueo del año; reabrir lo reversa. */
const c = t.yearClose
const { canWrite } = useAccess()
const toast = useToastStore()
const catalog = useCatalogStore()

const thisYear = Number(todayISO().slice(0, 4))
const years = Array.from({ length: 6 }, (_, i) => String(thisYear - i)).map((y) => ({ value: y, label: y }))
const year = ref(String(thisYear - 1))
const transfer = ref(false)

const list = useReport(() => accountingService.listCloses())
list.run()

const closing = ref(false)
const reopening = ref<YearCloseEntry | null>(null)
const saving = ref(false)
const error = ref('')

async function act(job: () => Promise<string>) {
  saving.value = true
  error.value = ''
  try {
    toast.success(await job())
    closing.value = false
    reopening.value = null
    list.run()
    catalog.invalidate('settings') // el cierre mueve el bloqueo de meses
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}

const close = () =>
  act(async () => {
    const res = await accountingService.closeYear(Number(year.value), transfer.value)
    return `${c.closed} ${year.value}: ${res.entry.number} · ${c.result} ${formatMoney(res.result)}`
  })

const reopen = (reason: string) =>
  act(async () => {
    const y = Number(reopening.value!.source.docNumber)
    await accountingService.reopenYear(y, reason)
    return `${c.reopened} ${y}`
  })

const columns: Column<YearCloseEntry>[] = [
  { key: 'year', label: c.year.label, value: (r) => r.source.docNumber },
  { key: 'number', label: t.common.number },
  { key: 'date', label: t.common.date, format: 'date' },
  { key: 'totalDebit', label: t.common.amount, format: 'money' },
  { key: 'by', label: c.by, value: (r) => `${r.createdBy?.name ?? ''} · ${r.createdAt ? formatDateTime(r.createdAt) : ''}` },
  { key: 'status', label: t.common.status },
  { key: 'actions', label: '', screenOnly: true },
]
</script>

<template>
  <section>
    <PageHeader :subtitle="c.intro" />

    <div v-if="canWrite" class="panel panel--pad yc">
      <div class="form-grid">
        <FormField v-bind="c.year" for="yc-year" class="narrow">
          <BaseCombobox id="yc-year" v-model="year" :options="years" />
        </FormField>
        <FormField :label="c.transfer.label" :help="c.transfer.help">
          <BaseSwitch v-model="transfer" :label="c.transfer.label" />
        </FormField>
        <div class="yc__submit">
          <button type="button" class="btn btn--primary" @click="(error = ''), (closing = true)"><AppIcon name="lock" /> {{ c.close }} {{ year }}</button>
        </div>
      </div>
    </div>

    <h2 class="yc__title">{{ c.list }}</h2>
    <DataTable :columns="columns" :rows="list.data.value ?? []" :loading="list.loading.value" :error="list.error.value" :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)" @retry="list.run">
      <template #cell-number="{ row }">
        <RouterLink class="yc__link mono" :to="{ name: 'VoucherDetail', params: { id: row._id } }">{{ row.number }}</RouterLink>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-actions="{ row }">
        <button v-if="canWrite && row.status === 'contabilizado'" type="button" class="btn btn--ghost btn--sm" @click="(error = ''), (reopening = row)">
          <AppIcon name="unlock" /> {{ c.reopen }}
        </button>
      </template>
      <template #empty><p class="yc__empty">{{ c.none }}</p></template>
    </DataTable>

    <ConfirmModal
      :open="closing"
      danger
      :title="`${c.close} ${year}`"
      :subject="year"
      :message="c.closeMessage"
      :second-message="c.closeSecond"
      :second-label="c.close"
      :loading="saving"
      :error="error"
      @confirm="close"
      @cancel="closing = false"
    />
    <ReasonConfirm
      :open="!!reopening"
      :title="`${c.reopen} ${reopening?.source.docNumber ?? ''}`"
      :subject="reopening?.number"
      :message="c.reopenMessage"
      :second-message="c.reopenSecond"
      :reason="c.reason"
      :loading="saving"
      :error="error"
      @confirm="reopen"
      @cancel="reopening = null"
    />
  </section>
</template>

<style scoped lang="scss">
.yc {
  margin-bottom: 1rem;
  max-width: 760px;

  &__submit {
    @include flex(row, flex-end, flex-start);
    flex: 0 0 auto !important;
  }

  &__title {
    margin: 0.5rem 0;
    font-size: $text-base;
  }

  &__link {
    color: $accent;
    text-decoration: underline;
  }

  &__empty {
    padding: 1rem;
    color: $ink-muted;
    font-size: $text-sm;
  }
}
</style>
