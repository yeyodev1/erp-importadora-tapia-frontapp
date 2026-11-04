<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { banksService, type BalanceRow } from '@/services/banks.service'
import { site } from '@/config/site'
import { bancos } from '@/config/copy/bancos'
import { formatDay, todayISO } from '@/utils/format'
import type { ApiError } from '@/types'

const t = bancos.balances
const date = ref(todayISO())
const rows = ref<BalanceRow[]>([])
const loading = ref(false)
const error = ref('')
const filters = ref<string[]>([])

async function run() {
  loading.value = true
  error.value = ''
  try {
    rows.value = (await banksService.balances(date.value)).items
    filters.value = [`${t.date.label} ${formatDay(date.value)}`]
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}
onMounted(run)

const columns: Column<BalanceRow>[] = [
  { key: 'accountCode', label: t.cols.code, width: '10rem' },
  { key: 'name', label: t.cols.name },
  { key: 'accountingBalance', label: t.cols.accounting, help: t.colHelp.accounting, format: 'amount-signed', total: true },
  { key: 'kind', label: t.cols.kind, value: (r) => site.catalogs.banks.kinds[r.kind], width: '6rem' },
  { key: 'number', label: t.cols.number },
  { key: 'movementBalance', label: t.cols.movements, help: t.colHelp.movements, format: 'amount-signed', total: true },
]
</script>

<template>
  <section>
    <PageHeader :subtitle="t.help" />
    <form class="panel panel--pad toolbar" @submit.prevent="run">
      <FormField v-bind="t.date" for="bb-date" class="bb__date">
        <BaseDatePicker id="bb-date" v-model="date" />
      </FormField>
      <button type="submit" class="btn btn--primary" :disabled="loading"><AppIcon name="search" /> {{ site.filters.apply }}</button>
    </form>
    <DataTable :columns="columns" :rows="rows" row-key="bankAccountId" :loading="loading" :error="error" :filters-text="filters" :empty-message="t.empty" @retry="run">
      <template #cell-accountCode="{ row }"><span class="mono">{{ row.accountCode }}</span></template>
    </DataTable>
  </section>
</template>

<style scoped lang="scss">
.toolbar {
  align-items: flex-end;
}

.bb__date {
  flex: 0 1 200px;
}
</style>
