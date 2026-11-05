<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import StatChips from '@/components/accounting/StatChips.vue'
import ReasonConfirm from '@/components/accounting/ReasonConfirm.vue'
import DataTable from '@/components/table/DataTable.vue'
import PayslipSheet from '@/components/nomina/PayslipSheet.vue'
import PayrollRatesDialog from '@/components/nomina/PayrollRatesDialog.vue'
import { useAccess } from '@/composables/useAccess'
import { monthLabel, monthOptions } from '@/composables/accounting/useReport'
import { usePayroll } from '@/composables/nomina/usePayroll'
import { payrollColumns } from '@/composables/nomina/payrollColumns'
import { site } from '@/config/site'
import { nomina } from '@/config/copy/nomina'
import { nominaRol as t } from '@/config/copy/nominaRol'
import type { PayrollLine } from '@/types'

/** Rol de pagos del mes: genera, ajusta (borrador), aprueba con asiento, anula e imprime. */
const { canWrite } = useAccess()
const { period, payroll, loading, busy, error, actionError, isDraft, dirty, load, generate, save, approve, voidPayroll } = usePayroll()
const months = monthOptions(24)
const editable = computed(() => canWrite.value && isDraft.value)
const confirming = ref<'approve' | 'void' | null>(null)
const ratesOpen = ref(false)
const slips = ref<InstanceType<typeof PayslipSheet> | null>(null)

const stats = computed(() => {
  const p = payroll.value
  if (!p) return []
  return [
    { label: t.stats.employees, value: p.lines.length, money: false },
    { label: t.stats.income, value: p.totals.totalIncome },
    { label: t.stats.deductions, value: p.totals.totalDeductions },
    { label: t.stats.net, value: p.totals.net },
    { label: t.stats.cost, value: p.totals.employerCost },
  ]
})
const printFilters = computed(() => (payroll.value ? [`${monthLabel(payroll.value.period)} · ${site.status[payroll.value.status]?.label}`] : []))
const days = (l: PayrollLine, v: string) => (l.days = Math.min(30, Math.max(0, Math.trunc(Number(v) || 0))))

async function confirmAction(reason?: string) {
  const ok = confirming.value === 'approve' ? await approve() : await voidPayroll(reason ?? '')
  if (ok) confirming.value = null
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle">
      <button type="button" class="btn btn--ghost" @click="ratesOpen = true"><AppIcon name="taxes" /> {{ t.rates }}</button>
      <button v-if="payroll && payroll.status !== 'anulado'" type="button" class="btn btn--ghost" @click="slips?.print(payroll.lines)"><AppIcon name="print" /> {{ t.print }}</button>
      <RouterLink v-if="payroll?.journalEntryId" class="btn btn--ghost" :to="{ name: 'VoucherDetail', params: { id: payroll.journalEntryId } }"><AppIcon name="ledger" /> {{ t.viewEntry }}</RouterLink>
    </PageHeader>

    <div class="pv__bar panel panel--pad">
      <FormField v-bind="t.period" for="pv-period" class="pv__period">
        <BaseCombobox id="pv-period" v-model="period" :options="months" />
      </FormField>
      <StatusBadge v-if="payroll" :status="payroll.status" />
      <span class="pv__actions">
        <BaseButton v-if="editable" icon="save" :loading="busy" :disabled="!dirty" :action="save">{{ t.save }}</BaseButton>
        <BaseButton v-if="editable" variant="primary" icon="check" @click="(actionError = ''), (confirming = 'approve')">{{ t.approve }}</BaseButton>
        <BaseButton v-if="canWrite && payroll && payroll.status !== 'anulado'" variant="danger" icon="void" @click="(actionError = ''), (confirming = 'void')">{{ t.void }}</BaseButton>
      </span>
    </div>

    <LockedDateBanner v-if="payroll && isDraft" :date="payroll.date.slice(0, 10)" />
    <EmptyState v-if="error" tone="error" :message="error" @retry="load" />
    <div v-else-if="loading && !payroll" class="panel panel--pad" aria-busy="true"><SkeletonBlock :lines="6" /></div>
    <EmptyState v-else-if="!payroll || payroll.status === 'anulado'" :message="payroll ? t.voidedNote : t.empty">
      <BaseButton v-if="canWrite" variant="primary" icon="plus" :loading="busy" :action="generate">{{ t.generate }} · {{ monthLabel(period) }}</BaseButton>
    </EmptyState>

    <template v-else>
      <StatChips :items="stats" />
      <p v-if="isDraft" class="pv__note"><AppIcon name="info" /> {{ dirty ? t.dirty : t.draftNote }}</p>
      <DataTable
        :columns="payrollColumns"
        :rows="payroll.lines"
        row-key="employeeId"
        :loading="loading"
        :title="`Rol de pagos ${monthLabel(payroll.period)}`"
        :filters-text="printFilters"
        landscape
      >
        <template #cell-name="{ row }">
          <span class="pv__who">
            <strong>{{ row.name }}</strong>
            <small class="mono">{{ row.identification }} · {{ nomina.departments[row.department] }}</small>
          </span>
        </template>
        <template v-if="editable" #cell-days="{ row }">
          <input :value="row.days" class="num pv__days" inputmode="numeric" :aria-label="t.cols.days.label" @input="days(row, ($event.target as HTMLInputElement).value)" />
        </template>
        <template v-if="editable" #cell-extras="{ row }"><MoneyInput v-model="row.extras" class="pv__money" /></template>
        <template v-if="editable" #cell-commissions="{ row }"><MoneyInput v-model="row.commissions" class="pv__money" /></template>
        <template v-if="editable" #cell-otherDeductions="{ row }"><MoneyInput v-model="row.otherDeductions" class="pv__money" /></template>
        <template #cell-actions="{ row }">
          <button type="button" class="btn btn--ghost btn--sm btn--icon" :title="t.printOne" :aria-label="t.printOne" @click="slips?.print([row])"><AppIcon name="print" /></button>
        </template>
      </DataTable>
      <PayslipSheet ref="slips" :payroll="payroll" />
    </template>

    <ConfirmModal
      :open="confirming === 'approve'"
      :title="t.approveTitle"
      :subject="payroll ? `${monthLabel(payroll.period)} · ${payroll.lines.length} ${t.stats.employees.toLowerCase()}` : ''"
      :message="t.approveMessage"
      :second-message="t.approveSecond"
      :second-label="t.approve"
      :loading="busy"
      :error="actionError"
      @confirm="confirmAction()"
      @cancel="confirming = null"
    />
    <ReasonConfirm
      :open="confirming === 'void'"
      :title="t.void"
      :subject="payroll ? monthLabel(payroll.period) : ''"
      :message="t.voidMessage"
      :second-message="t.voidSecond"
      :reason="t.reason"
      :loading="busy"
      :error="actionError"
      @confirm="confirmAction"
      @cancel="confirming = null"
    />
    <PayrollRatesDialog v-if="ratesOpen" :open="ratesOpen" :readonly="!canWrite" @close="ratesOpen = false" />
  </section>
</template>

<style scoped lang="scss">
.pv__bar {
  @include flex(column, stretch, flex-start, 0.75rem);
  margin-bottom: 0.75rem;

  @include from('md') {
    flex-direction: row;
    align-items: flex-end;
  }
}

.pv__period {
  flex: 1 1 auto;
  max-width: 320px;
}

.pv__actions {
  @include flex(row, center, flex-start, 0.5rem);
  flex-wrap: wrap;

  @include from('md') {
    margin-left: auto;
  }
}

.pv__note {
  @include flex(row, center, flex-start, 0.5rem);
  margin-bottom: 0.75rem;
  color: $ink-soft;
  font-size: $text-sm;
}

.pv__who {
  @include flex(column, flex-start, flex-start, 0.1rem);

  small {
    color: $ink-soft;
  }
}

.pv__days {
  width: 3.5rem;
}

.pv__money {
  min-width: 6.5rem;
}
</style>
