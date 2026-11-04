<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { banksService, type PendingCheck } from '@/services/banks.service'
import { useCatalogStore } from '@/stores/catalog'
import { site } from '@/config/site'
import { bancos } from '@/config/copy/bancos'
import { formatDay, todayISO } from '@/utils/format'
import type { ApiError } from '@/types'

const t = bancos.checks
const catalog = useCatalogStore()
const date = ref(todayISO())
const bankAccountId = ref('')
const rows = ref<PendingCheck[]>([])
const loading = ref(false)
const error = ref('')
const filters = ref<string[]>([])
const isOld = (r: PendingCheck) => r.ageDays > t.oldDays
const oldCount = computed(() => rows.value.filter(isOld).length)

async function run() {
  loading.value = true
  error.value = ''
  try {
    rows.value = (await banksService.pendingChecks({ date: date.value, bankAccountId: bankAccountId.value || undefined })).items
    const bank = catalog.bankAccounts.find((b) => b._id === bankAccountId.value)?.name
    filters.value = [`${t.date.label} ${formatDay(date.value)}`, bank ? `${site.filters.bankAccount}: ${bank}` : ''].filter(Boolean)
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}
onMounted(run)

const columns: Column<PendingCheck>[] = [
  { key: 'bankName', label: t.cols.bank },
  { key: 'date', label: t.cols.date, format: 'date', width: '7rem' },
  { key: 'checkNumber', label: t.cols.check, width: '5rem' },
  { key: 'beneficiary', label: t.cols.beneficiary },
  { key: 'description', label: t.cols.description },
  { key: 'amount', label: t.cols.amount, format: 'money', total: true },
  { key: 'ageDays', label: t.cols.age, format: 'int', width: '6rem' },
]
</script>

<template>
  <section>
    <PageHeader :subtitle="rows.length ? t.summary(rows.length, oldCount) : undefined" />
    <form class="panel panel--pad toolbar pc__bar" @submit.prevent="run">
      <FormField v-bind="t.date" for="pc-date" class="pc__field">
        <BaseDatePicker id="pc-date" v-model="date" />
      </FormField>
      <FormField :label="site.filters.bankAccount" for="pc-bank" class="pc__field">
        <BankAccountPicker id="pc-bank" v-model="bankAccountId" kind="banco" :empty-label="site.filters.all" />
      </FormField>
      <button type="submit" class="btn btn--primary" :disabled="loading"><AppIcon name="search" /> {{ site.filters.apply }}</button>
    </form>
    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      :filters-text="filters"
      landscape
      :row-class="(r) => (isOld(r) ? 'is-old' : undefined)"
      @retry="run"
    >
      <template #cell-checkNumber="{ row }"><span class="mono">{{ row.checkNumber }}</span></template>
      <template #cell-ageDays="{ row }">
        <BaseBadge v-if="isOld(row)" tone="danger" :title="t.old">{{ row.ageDays }}</BaseBadge>
        <span v-else class="num">{{ row.ageDays }}</span>
      </template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.pc__bar {
  align-items: flex-end;
}

.pc__field {
  flex: 1 1 200px;
  max-width: 280px;
}

:deep(tr.is-old td) {
  background: $danger-bg;
}
</style>
