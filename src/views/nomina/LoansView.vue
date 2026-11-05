<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import FormField from '@/components/ui/FormField.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { useEditor } from '@/composables/useEditor'
import { payrollService, type Employee, type EmployeeLoan, type LoanType } from '@/services/payroll.service'
import { todayISO } from '@/utils/format'
import { site } from '@/config/site'
import { nomina } from '@/config/copy/nomina'

/** Préstamos que se descuentan en el rol: internos y del IESS. */
const t = nomina.loans
const f = t.fields
const { canWrite } = useAccess()
const showInactive = ref(false)
const employees = ref<Employee[]>([])
onMounted(async () => {
  employees.value = (await payrollService.list('employees', { limit: 500 })).items
})
const employeeOptions = computed(() => employees.value.map((e) => ({ value: e._id, label: `${e.lastName} ${e.firstName}`, hint: e.identification })))
const types = (['interno', 'quirografario', 'hipotecario'] as LoanType[]).map((value) => ({ value, label: nomina.loanTypes[value], help: nomina.loanTypeHints[value] }))

const list = useList((p) => payrollService.list('loans', p), () => ({ active: showInactive.value ? 'all' : 'true' }))

const nameOf = (l: EmployeeLoan) => (typeof l.employeeId === 'object' ? `${l.employeeId.lastName} ${l.employeeId.firstName}` : '')
const columns: Column<EmployeeLoan>[] = [
  { key: 'date', label: f.date.label, format: 'date', width: '7rem' },
  { key: 'employee', ...t.cols.employee, value: nameOf },
  { key: 'type', ...t.cols.type, value: (l) => nomina.loanTypes[l.type] },
  { key: 'description', label: f.description.label },
  { key: 'total', label: f.total.label, format: 'money', value: (l) => l.total || null },
  { key: 'installment', ...t.cols.installment, format: 'money', total: true },
  { key: 'balance', ...t.cols.balance, format: 'money', total: true },
  { key: 'isActive', label: f.isActive.label, width: '6rem', value: (l) => (l.isActive ? site.common.active : site.common.inactive) },
]

interface LoanForm {
  employeeId: string
  type: LoanType
  date: string
  description: string
  total: number | null
  installment: number | null
  balance: number | null
  isActive: boolean
}
const blank = (): LoanForm => ({ employeeId: '', type: 'interno', date: todayISO(), description: '', total: null, installment: null, balance: null, isActive: true })

const editor = useEditor<LoanForm>({
  blank,
  validate: (l, id) => (!id && !l.employeeId ? `${f.employeeId.label}: obligatorio` : !l.installment ? `${f.installment.label}: obligatorio` : null),
  save: (l, id) => {
    const body = { ...l, balance: l.balance ?? (id ? null : undefined) }
    return id ? payrollService.update('loans', id, body) : payrollService.create('loans', body)
  },
  onSaved: list.reload,
})

function edit(l: EmployeeLoan) {
  const employeeId = typeof l.employeeId === 'object' ? l.employeeId._id : l.employeeId
  editor.openEdit(l._id, { employeeId, type: l.type, date: l.date.slice(0, 10), description: l.description, total: l.total || null, installment: l.installment, balance: l.balance, isActive: l.isActive })
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle">
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="editor.openNew()"><AppIcon name="plus" /> {{ t.add }}</button>
    </PageHeader>
    <p class="note panel panel--pad"><AppIcon name="info" /> {{ t.disbursementNote }}</p>

    <DataTable
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :fetch-all="list.fetchAll"
      :empty-message="t.empty"
      clickable
      @update:page="list.page = $event"
      @row-click="edit"
      @retry="list.reload"
    >
      <template #toolbar><BaseSwitch v-model="showInactive" :label="site.common.showInactive" /></template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite" wide>
      <div class="form-grid">
        <FormField v-bind="f.employeeId" for="ln-emp" required>
          <BaseCombobox id="ln-emp" v-model="editor.form.employeeId" :options="employeeOptions" :disabled="!!editor.id" />
        </FormField>
        <FormField v-bind="f.type" required full>
          <BaseSegmented v-model="editor.form.type" :options="types" :label="f.type.label" :disabled="!!editor.id" />
        </FormField>
        <FormField v-bind="f.date" for="ln-date" required class="narrow">
          <BaseDatePicker id="ln-date" v-model="editor.form.date" />
        </FormField>
        <FormField v-bind="f.description" for="ln-desc" full>
          <input id="ln-desc" v-model="editor.form.description" maxlength="200" />
        </FormField>
        <FormField v-bind="f.total" for="ln-total" :required="editor.form.type === 'interno'">
          <MoneyInput id="ln-total" v-model="editor.form.total" :disabled="!!editor.id" />
        </FormField>
        <FormField v-bind="f.installment" for="ln-inst" required>
          <MoneyInput id="ln-inst" v-model="editor.form.installment" />
        </FormField>
        <FormField v-bind="f.balance" for="ln-bal">
          <MoneyInput id="ln-bal" v-model="editor.form.balance" />
        </FormField>
        <BaseSwitch v-model="editor.form.isActive" v-bind="f.isActive" />
      </div>
    </EditorDialog>
  </section>
</template>

<style scoped lang="scss">
.note {
  @include flex(row, center, flex-start, 0.5rem);
  margin-bottom: 0.75rem;
  color: $ink-soft;
}
</style>
