<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import StepDialog from '@/components/receivables/StepDialog.vue'
import { useAccess } from '@/composables/useAccess'
import { useStep } from '@/composables/receivables/useStep'
import { receivablesService, type Receipt } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'
import { site } from '@/config/site'
import { formatMoney } from '@/utils/money'
import { formatDay, todayISO } from '@/utils/format'
import type { ApiError } from '@/types'

/** Cheques posfechados recibidos, por fecha de cobro y estado: depositar, acreditar o devolver. */
type Action = 'deposit' | 'confirm' | 'return'
const t = cxc.checks
const { canWrite } = useAccess()
const today = todayISO()
const filters = ref(defaultFilters({ from: '', to: '' }))
const summary = ref<string[]>([])
const status = ref('')
const statusTabs = [
  { value: '', label: t.active },
  ...['en_cartera', 'depositado', 'acreditado', 'devuelto'].map((s) => ({
    value: s,
    label: site.status[s]!.label,
  })),
]
const rows = ref<Receipt[]>([])
const loading = ref(false)
const error = ref('')

async function load(s: string[] = summary.value) {
  summary.value = s
  loading.value = true
  error.value = ''
  try {
    rows.value = await receivablesService.checks({
      ...filterParams(filters.value),
      status: status.value || undefined,
    })
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}
onMounted(() => load())
watch(status, () => load())

const name = (r: Receipt) => (typeof r.partyId === 'object' ? r.partyId.name : '')
const columns: Column<Receipt>[] = [
  {
    key: 'dueDate',
    label: 'Fecha cobro',
    format: 'date',
    width: '7rem',
    value: (r) => r.check?.dueDate,
  },
  { key: 'customer', label: 'Cliente', value: name },
  { key: 'check.number', label: 'Cheque', width: '7rem' },
  { key: 'check.bank', label: 'Banco' },
  { key: 'number', label: 'Cobro', width: '10rem' },
  { key: 'amount', label: 'Valor', format: 'money', total: true },
  {
    key: 'checkStatus',
    label: 'Estado',
    width: '8rem',
    value: (r) => site.status[r.check?.status ?? '']?.label,
  },
  { key: 'actions', label: '', screenOnly: true },
]

const allowed: Record<string, Action[]> = {
  en_cartera: ['deposit', 'return'],
  depositado: ['confirm', 'return'],
  acreditado: ['return'],
}
const labels: Record<Action, string> = { deposit: t.deposit, confirm: t.confirm, return: t.return }

const step = useStep<Receipt, Action>(
  (r, action, s) => receivablesService.checkStep(r._id, action, s),
  () => t.done,
  () => load(),
)
const dialog = computed(() => {
  const a = step.target.value?.action
  const r = step.target.value?.row
  const subject = r
    ? `Cheque ${r.check?.number} ${r.check?.bank} · ${name(r)} · ${formatMoney(r.amount)}`
    : ''
  if (a === 'deposit')
    return { title: t.depositTitle, message: t.depositMessage, subject, bank: true }
  if (a === 'confirm') return { title: t.confirmTitle, message: t.confirmMessage, subject }
  return {
    title: t.returnTitle,
    message: t.returnMessage,
    subject,
    reason: true,
    danger: true,
    secondMessage: t.returnSecond,
    secondLabel: t.returnLabel,
  }
})
</script>

<template>
  <section>
    <PageHeader :subtitle="t.intro" />
    <ReportFilters
      v-model="filters"
      :fields="['range', 'party']"
      party-role="customer"
      :loading="loading"
      @apply="load"
    />

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      :filters-text="summary"
      @retry="load()"
    >
      <template #toolbar>
        <BaseSegmented v-model="status" :options="statusTabs" label="Estado" />
      </template>
      <template #cell-dueDate="{ row, value }">
        <span
          :class="{
            due:
              row.check?.status === 'en_cartera' &&
              String(row.check?.dueDate).slice(0, 10) <= today,
          }"
          :title="t.overdue"
          >{{ formatDay(String(value)) }}</span
        >
      </template>
      <template #cell-checkStatus="{ row }"><StatusBadge :status="row.check?.status" /></template>
      <template #cell-actions="{ row }">
        <div v-if="canWrite" class="acts">
          <button
            v-for="a in allowed[row.check?.status ?? ''] ?? []"
            :key="a"
            type="button"
            class="btn btn--sm"
            :class="a === 'return' ? 'btn--ghost' : 'btn--primary'"
            @click="step.ask(row, a)"
          >
            <AppIcon :name="a === 'return' ? 'arrow-left' : a === 'deposit' ? 'bank' : 'check'" />
            {{ labels[a] }}
          </button>
        </div>
      </template>
    </DataTable>

    <StepDialog
      :open="!!step.target.value"
      v-bind="dialog"
      :loading="step.saving.value"
      :error="step.error.value"
      @confirm="step.confirm"
      @cancel="step.cancel"
    />
  </section>
</template>

<style scoped lang="scss">
.due {
  color: $warning;
  font-weight: 600;
}

.acts {
  @include flex(row, center, flex-end, 0.35rem);
  flex-wrap: wrap;
}
</style>
