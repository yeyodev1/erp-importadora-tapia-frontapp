<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import EmployeeForm from '@/components/nomina/EmployeeForm.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { useEditor } from '@/composables/useEditor'
import { payrollService, type Employee, type EmployeeFormData } from '@/services/payroll.service'
import { todayISO } from '@/utils/format'
import { site } from '@/config/site'
import { nomina } from '@/config/copy/nomina'

/** Empleados: la ficha del trabajador que alimenta el rol de pagos. */
const t = nomina.employees
const { canWrite } = useAccess()
const showInactive = ref(false)

const list = useList((p) => payrollService.list('employees', p), () => ({ active: showInactive.value ? 'all' : 'true' }))

const columns: Column<Employee>[] = [
  { key: 'identification', label: t.fields.identification.label, width: '8rem' },
  { key: 'name', ...t.cols.name, value: (e) => `${e.lastName} ${e.firstName}` },
  { key: 'department', ...t.cols.department, value: (e) => nomina.departments[e.department] },
  { key: 'position', label: t.fields.position.label },
  { key: 'hireDate', ...t.cols.hireDate, format: 'date', width: '7rem' },
  { key: 'salary', ...t.cols.salary, format: 'money', total: true },
  { key: 'isActive', ...t.cols.status, width: '6rem', value: (e) => (e.isActive ? site.common.active : site.common.inactive) },
]

const blank = (): EmployeeFormData => ({
  identification: '',
  firstName: '',
  lastName: '',
  address: '',
  phone: '',
  email: '',
  hireDate: todayISO(),
  department: 'ventas',
  position: '',
  salary: null,
  sellerName: '',
  commissionRate: '0',
  reserveFundMonthly: true,
  isActive: true,
  exitDate: '',
})

const editor = useEditor<EmployeeFormData>({
  blank,
  validate: (f) => (f.salary === null ? `${t.fields.salary.label}: obligatorio` : null),
  save: (f, id) => {
    const body = { ...f, commissionRate: Number(f.commissionRate.replace(',', '.')) || 0, exitDate: f.exitDate || null }
    return id ? payrollService.update('employees', id, body) : payrollService.create('employees', body)
  },
  onSaved: list.reload,
})

function edit(e: Employee) {
  editor.openEdit(e._id, {
    ...blank(),
    ...e,
    hireDate: e.hireDate.slice(0, 10),
    exitDate: e.exitDate?.slice(0, 10) ?? '',
    commissionRate: String(e.commissionRate ?? 0),
  })
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle">
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="editor.openNew()"><AppIcon name="plus" /> {{ t.add }}</button>
    </PageHeader>

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
      <template #toolbar>
        <SearchInput v-model="list.q" :placeholder="t.search" />
        <BaseSwitch v-model="showInactive" :label="site.common.showInactive" />
      </template>
      <template #cell-identification="{ row }"><span class="mono">{{ row.identification }}</span></template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite" wide>
      <EmployeeForm v-model="editor.form" :is-new="!editor.id" />
    </EditorDialog>
  </section>
</template>
