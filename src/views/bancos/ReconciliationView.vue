<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { banksService, type Reconciliation } from '@/services/banks.service'
import { useToastStore } from '@/stores/toast'
import { site } from '@/config/site'
import { bancos } from '@/config/copy/bancos'
import { monthStart, todayISO } from '@/utils/format'
import type { ApiError } from '@/types'

const t = bancos.rec
const router = useRouter()
const route = useRoute()
const toast = useToastStore()
const { canWrite } = useAccess()

const bankAccountId = ref('')
type Status = '' | 'abierta' | 'cerrada'
// `?status=abierta` del aviso de la campana "conciliaciones abiertas".
const statusOf = (q: unknown): Status => (q === 'abierta' || q === 'cerrada' ? q : '')
const status = ref<Status>(statusOf(route.query.status))
watch(() => route.query.status, (q) => (status.value = statusOf(q)))
const tabs = [
  { value: '' as const, label: t.statusTabs.all, help: t.statusHelp.all },
  { value: 'abierta' as const, label: t.statusTabs.abierta, help: t.statusHelp.abierta },
  { value: 'cerrada' as const, label: t.statusTabs.cerrada, help: t.statusHelp.cerrada },
]
const list = useList(
  (p) => banksService.listReconciliations(p),
  () => ({ bankAccountId: bankAccountId.value || undefined, status: status.value || undefined }),
)

const columns: Column<Reconciliation>[] = [
  { key: 'description', label: t.listCols.description },
  { key: 'from', label: t.listCols.from, format: 'date', width: '7rem' },
  { key: 'to', label: t.listCols.to, format: 'date', width: '7rem' },
  { key: 'statementBalance', label: t.listCols.statement, help: t.fields.statementBalance.help, format: 'money' },
  { key: 'status', label: t.listCols.status, width: '6rem' },
]

const open = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive({ bankAccountId: '', from: monthStart(), to: todayISO(), statementBalance: null as number | null })

function openNew() {
  Object.assign(form, { bankAccountId: bankAccountId.value, statementBalance: null })
  error.value = ''
  open.value = true
}

async function create() {
  if (!form.bankAccountId) return (error.value = t.pickBank)
  saving.value = true
  error.value = ''
  try {
    const rec = await banksService.createReconciliation({ ...form, statementBalance: form.statementBalance ?? 0 })
    await banksService.loadMovements(rec._id) // como "Carga movimientos" del sistema actual
    toast.success(t.created)
    router.push({ name: 'BankReconciliationWork', params: { id: rec._id } })
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle">
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="openNew"><AppIcon name="plus" /> {{ t.add }}</button>
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
      @row-click="router.push({ name: 'BankReconciliationWork', params: { id: $event._id } })"
      @retry="list.reload"
    >
      <template #toolbar>
        <FormField v-bind="t.status">
          <BaseSegmented v-model="status" :options="tabs" :label="t.status.label" />
        </FormField>
        <FormField v-bind="t.bankFilter" for="rl-bank" class="rl__bank">
          <BankAccountPicker id="rl-bank" v-model="bankAccountId" kind="banco" :empty-label="site.filters.all" />
        </FormField>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
    </DataTable>

    <FormDialog :open="open" :title="t.newTitle" :submit-label="t.add" :loading="saving" :error="error" @submit="create" @close="open = false">
      <LockedDateBanner :date="form.to" />
      <div class="form-grid">
        <FormField v-bind="t.fields.bank" for="rn-bank" required full>
          <BankAccountPicker id="rn-bank" v-model="form.bankAccountId" kind="banco" :invalid="!!error && !form.bankAccountId" />
        </FormField>
        <FormField v-bind="t.fields.from" for="rn-from" required>
          <BaseDatePicker id="rn-from" v-model="form.from" :range-end="form.to" />
        </FormField>
        <FormField v-bind="t.fields.to" for="rn-to" required>
          <BaseDatePicker id="rn-to" v-model="form.to" :range-start="form.from" />
        </FormField>
        <FormField v-bind="t.fields.statementBalance" for="rn-bal" full>
          <MoneyInput id="rn-bal" v-model="form.statementBalance" allow-negative />
        </FormField>
      </div>
    </FormDialog>
  </section>
</template>

<style scoped lang="scss">
.rl__bank {
  flex: 1 1 220px;
  max-width: 320px;
}
</style>
