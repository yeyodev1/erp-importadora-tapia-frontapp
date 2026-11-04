<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { banksService, BANK_TX_TYPES, type BankTransaction } from '@/services/banks.service'
import { useCatalogStore } from '@/stores/catalog'
import { bancos } from '@/config/copy/bancos'

const t = bancos.tx
const router = useRouter()
const { canWrite } = useAccess()
const catalog = useCatalogStore()
onMounted(() => catalog.ensure('bankAccounts'))

const draft = ref(defaultFilters())
const draftType = ref('')
// Se consulta al apretar "Consultar", no a cada tecla.
const applied = ref({ ...filterParams(draft.value), type: '' })
const summary = ref<string[]>([])
const typeOptions = BANK_TX_TYPES.map((v) => ({ value: v, label: bancos.types[v].label }))

const list = useList(
  (p) => banksService.listTransactions(p),
  () => ({ ...applied.value, type: applied.value.type || undefined }),
)

function apply(lines: string[]) {
  applied.value = { ...filterParams(draft.value), type: draftType.value }
  summary.value = draftType.value ? [...lines, `${t.filterType}: ${bancos.types[draftType.value as keyof typeof bancos.types].label}`] : lines
}

const bankName = (id: string | null) => catalog.bankAccounts.find((b) => b._id === id)?.name ?? ''
const columns: Column<BankTransaction>[] = [
  { key: 'number', label: t.cols.number, width: '6rem' },
  { key: 'date', label: t.cols.date, format: 'date', width: '7rem' },
  { key: 'type', label: t.cols.type, value: (r) => bancos.types[r.type].label },
  { key: 'bank', label: t.cols.bank, value: (r) => bankName(r.bankAccountId) },
  { key: 'checkNumber', label: t.cols.check, width: '5rem' },
  { key: 'description', label: t.cols.description },
  { key: 'amount', label: t.cols.amount, format: 'money', total: true },
  { key: 'status', label: t.cols.status, width: '6rem' },
]
</script>

<template>
  <section>
    <PageHeader>
      <RouterLink v-if="canWrite" :to="{ name: 'BankTransactionNew' }" class="btn btn--primary"><AppIcon name="plus" /> {{ t.add }}</RouterLink>
    </PageHeader>

    <ReportFilters v-model="draft" :fields="['range', 'bankAccount']" :loading="list.loading" @apply="apply">
      <FormField :label="t.filterType" for="tx-ftype">
        <BaseCombobox id="tx-ftype" v-model="draftType" :options="typeOptions" :empty-label="t.allTypes" />
      </FormField>
    </ReportFilters>

    <DataTable
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :fetch-all="list.fetchAll"
      :filters-text="summary"
      :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)"
      clickable
      landscape
      @update:page="list.page = $event"
      @row-click="router.push({ name: 'BankTransactionDetail', params: { id: $event._id } })"
      @retry="list.reload"
    >
      <template #cell-checkNumber="{ row }"><span class="mono">{{ row.checkNumber }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
    </DataTable>
  </section>
</template>
