<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FormField from '@/components/ui/FormField.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import ReasonConfirm from '@/components/banks/ReasonConfirm.vue'
import ReconciliationSummary from '@/components/banks/ReconciliationSummary.vue'
import StatementPanel from '@/components/banks/StatementPanel.vue'
import { useAccess } from '@/composables/useAccess'
import { useReconciliation } from '@/composables/banks/useReconciliation'
import type { BankMovement } from '@/services/banks.service'
import { useCatalogStore } from '@/stores/catalog'
import { bancos } from '@/config/copy/bancos'
import { formatDay } from '@/utils/format'

const t = bancos.rec
const route = useRoute()
const id = String(route.params.id)
const { canWrite } = useAccess()
const catalog = useCatalogStore()
onMounted(() => catalog.ensure('bankAccounts'))
const r = useReconciliation(id)
const { rec, summary, isOpen, busy } = r
const editable = computed(() => isOpen.value && canWrite.value)
const bank = computed(() => catalog.bankAccounts.find((b) => b._id === rec.value?.bankAccountId))

const columns: Column<BankMovement>[] = [
  { key: 'cleared', label: t.cols.cleared, value: (m) => (m.cleared ? t.cleared : ''), width: '6rem' },
  { key: 'type', label: t.cols.type, value: (m) => bancos.movType(m.type) },
  { key: 'checkNumber', label: t.cols.check, width: '5rem' },
  { key: 'doc', label: t.cols.doc, value: (m) => m.source?.docNumber ?? '' },
  { key: 'amount', label: t.cols.amount, format: 'money', value: (m) => (m.direction === 'out' ? -m.amount : m.amount) },
  { key: 'date', label: t.cols.date, format: 'date', width: '7rem' },
  { key: 'description', label: t.cols.description },
]

// 'close' cuadrada (doble confirmación), 'force' con diferencia (motivo), 'reopen' (motivo).
const dialog = ref<'' | 'close' | 'force' | 'reopen'>('')
const askClose = () => (dialog.value = summary.value?.balanced ? 'close' : 'force')
async function onConfirm(reason: string) {
  const ok = dialog.value === 'reopen' ? await r.reopen(reason) : await r.close(dialog.value === 'force' ? reason : '')
  if (ok) dialog.value = ''
}
const dialogCopy = computed(() =>
  dialog.value === 'reopen'
    ? { title: t.reopenTitle, message: t.reopenMessage, secondMessage: t.reopenSecond, confirmLabel: t.reopen, reason: t.reopenReason }
    : dialog.value === 'force'
      ? { title: t.forceTitle, message: t.forceMessage, secondMessage: t.forceSecond, confirmLabel: t.closeLabel, reason: t.forceReason }
      : { title: t.closeTitle, message: t.closeMessage, secondMessage: t.closeSecond, confirmLabel: t.closeLabel, reason: undefined },
)
</script>

<template>
  <section>
    <PageHeader :title="rec?.description" :subtitle="rec && !isOpen ? t.closedNote : undefined">
      <RouterLink :to="{ name: 'BankReconciliation' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.back }}</RouterLink>
      <template v-if="rec">
        <button type="button" class="btn btn--ghost" @click="r.print"><AppIcon name="print" /> {{ t.print }}</button>
        <template v-if="canWrite">
          <button v-if="isOpen" type="button" class="btn btn--ghost" :disabled="busy" @click="r.load"><AppIcon name="refresh" /> {{ t.load }}</button>
          <button v-if="isOpen" type="button" class="btn btn--primary" :disabled="busy" @click="askClose"><AppIcon name="lock" /> {{ t.close }}</button>
          <button v-else type="button" class="btn btn--ghost" :disabled="busy" @click="dialog = 'reopen'"><AppIcon name="unlock" /> {{ t.reopen }}</button>
        </template>
      </template>
    </PageHeader>

    <EmptyState v-if="r.loadError.value" tone="error" :message="r.loadError.value" @retry="r.fetch" />
    <div v-else-if="rec && summary" class="rw">
      <div class="panel panel--pad rw__head">
        <div class="rw__fact"><span>{{ t.fields.bank.label }}</span><strong>{{ bank?.name }} {{ bank?.number }}</strong></div>
        <div class="rw__fact"><span>{{ t.fields.from.label }}</span><strong>{{ formatDay(rec.from) }}</strong></div>
        <div class="rw__fact"><span>{{ t.fields.to.label }}</span><strong>{{ formatDay(rec.to) }}</strong></div>
        <div class="rw__fact"><span>{{ t.listCols.status }}</span><StatusBadge :status="rec.status" /></div>
        <FormField v-bind="t.fields.statementBalance" for="rw-bal" class="rw__bal">
          <MoneyInput id="rw-bal" :model-value="rec.statementBalance" allow-negative :disabled="!editable" @update:model-value="r.setStatementBalance" />
        </FormField>
      </div>

      <ReconciliationSummary :summary="summary" />

      <StatementPanel v-if="editable" :rec-id="id" @saved="r.replace" />

      <DataTable :columns="columns" :rows="rec.movements" :title="`${t.movements} · ${rec.description}`" landscape>
        <template #toolbar>
          <strong>{{ t.movements }}</strong>
          <HelpTip :text="t.clearedHelp" />
          <span class="toolbar__spacer" />
          <template v-if="editable">
            <button type="button" class="btn btn--ghost btn--sm" @click="r.markAll(true)">{{ t.allOn }}</button>
            <button type="button" class="btn btn--ghost btn--sm" @click="r.markAll(false)">{{ t.allOff }}</button>
          </template>
        </template>
        <template #cell-cleared="{ row }">
          <BaseSwitch class="rw__switch" :label="t.cleared" :model-value="!!row.cleared" :disabled="!editable" @update:model-value="r.mark(row, $event)" />
        </template>
        <template #cell-checkNumber="{ row }"><span class="mono">{{ row.checkNumber }}</span></template>
      </DataTable>
    </div>

    <ReasonConfirm
      :open="!!dialog"
      v-bind="dialogCopy"
      :subject="rec?.description"
      :loading="busy"
      @confirm="onConfirm"
      @cancel="dialog = ''"
    />
  </section>
</template>

<style scoped lang="scss">
.rw {
  @include flex(column, stretch, flex-start, 1rem);

  &__head {
    @include flex(row, flex-end, flex-start, 0.75rem 1.5rem);
    flex-wrap: wrap;
  }

  &__fact {
    @include flex(column, flex-start, flex-start, 0.2rem);

    span {
      font-size: 0.8rem;
      color: $ink-muted;
    }
  }

  &__bal {
    flex: 1 1 220px;
    max-width: 280px;
  }

  &__switch :deep(.switch__text) {
    @include visually-hidden;
  }
}
</style>
