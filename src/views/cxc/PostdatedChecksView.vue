<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import FormField from '@/components/ui/FormField.vue'
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
import { formatDay, monthStart, todayISO } from '@/utils/format'
import type { ApiError } from '@/types'

/** Cheques posfechados recibidos, por fecha de cobro y estado: depositar, acreditar o devolver. */
type Action = 'deposit' | 'confirm' | 'return'
const t = cxc.checks
const { canWrite } = useAccess()
const today = todayISO()
// Un año atrás y uno adelante: los posfechados tienen fecha futura y ninguno debe quedar fuera.
const [y = 0, m = 1] = today.split('-').map(Number)
const filters = ref(
  defaultFilters({
    from: monthStart(`${y - 1}-${today.slice(5)}`),
    to: new Date(Date.UTC(y + 1, m, 0)).toISOString().slice(0, 10),
  }),
)
const summary = ref<string[]>([])
const status = ref('')
const statusTabs = [
  { value: '', label: t.active, help: t.statusHelp[''] },
  ...['en_cartera', 'depositado', 'acreditado', 'devuelto'].map((s) => ({
    value: s,
    label: site.status[s]!.label,
    help: t.statusHelp[s],
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

const filtersText = computed(() => [
  `${t.cols.dueDate.label}: ${formatDay(filters.value.from)} – ${formatDay(filters.value.to)}`,
  ...summary.value,
])
const name = (r: Receipt) => (typeof r.partyId === 'object' ? r.partyId.name : '')
const columns: Column<Receipt>[] = [
  {
    key: 'dueDate',
    ...t.cols.dueDate,
    format: 'date',
    width: '7rem',
    value: (r) => r.check?.dueDate,
  },
  { key: 'customer', label: 'Cliente', value: name },
  { key: 'check.number', label: 'Cheque', width: '7rem' },
  { key: 'check.bank', ...t.cols.bank },
  { key: 'number', ...t.cols.number, width: '10rem' },
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
      :fields="['party']"
      party-role="customer"
      :loading="loading"
      @apply="load"
    >
      <FormField v-bind="t.dueFrom" for="pc-from" class="narrow">
        <BaseDatePicker id="pc-from" v-model="filters.from" :range-end="filters.to" />
      </FormField>
      <FormField v-bind="t.dueTo" for="pc-to" class="narrow">
        <BaseDatePicker id="pc-to" v-model="filters.to" :range-start="filters.from" />
      </FormField>
    </ReportFilters>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      :filters-text="filtersText"
      :empty-title="t.emptyTitle"
      :empty-message="t.empty"
      @retry="load()"
    >
      <template #toolbar>
        <BaseSegmented v-model="status" :options="statusTabs" :label="t.statusLabel" />
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
