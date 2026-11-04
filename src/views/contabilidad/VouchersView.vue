<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import LedgerAccountPicker from '@/components/accounting/LedgerAccountPicker.vue'
import { defaultFilters } from '@/components/report/filters'
import type { Column } from '@/components/table/columns'
import { useList } from '@/composables/useList'
import { useAccess } from '@/composables/useAccess'
import { accountingService, type JournalEntry } from '@/services/accounting.service'
import { accounting as t } from '@/config/copy/accounting'
import { accountingScreens } from '@/config/copy/accountingScreens'

/** Búsqueda de comprobantes de todo el sistema; los filtros se aplican al pulsar Consultar. */
const router = useRouter()
const { canWrite } = useAccess()
const s = accountingScreens
const f = s.vouchers.fields
const h = s.columns

const range = ref(defaultFilters())
const extra = reactive({ type: '', module: '', number: '', account: '', q: '', amount: null as number | null, excludeVoided: false })
const applied = ref<Record<string, string | number | boolean | undefined>>({})
const summary = ref<string[]>([])

const options = (map: Record<string, string>, hints: Record<string, string>) => Object.entries(map).map(([value, label]) => ({ value, label, hint: hints[value] }))
const typeOptions = options(t.entryTypes, s.entryTypeHints)
const moduleOptions = options(t.modules, s.moduleHints)

function apply(lines: string[]) {
  const r = range.value
  applied.value = {
    from: r.from || undefined,
    to: r.to || undefined,
    type: extra.type || undefined,
    module: extra.module || undefined,
    number: extra.number.trim() || undefined,
    account: extra.account || undefined,
    q: extra.q.trim() || undefined,
    amount: extra.amount ?? undefined,
    excludeVoided: extra.excludeVoided || undefined,
  }
  summary.value = [
    ...lines,
    ...[
      extra.type && `${f.type.label}: ${t.entryTypes[extra.type]}`,
      extra.module && `${f.module.label}: ${t.modules[extra.module]}`,
      extra.number && `${f.number.label}: ${extra.number}`,
      extra.account && `${f.account.label}: ${extra.account}`,
      extra.q && `${f.q.label}: ${extra.q}`,
    ].filter((x): x is string => Boolean(x)),
  ]
}
apply([])

const list = useList(accountingService.searchEntries, () => applied.value)

const columns: Column<JournalEntry>[] = [
  { key: 'date', label: t.common.date, format: 'date', width: '7rem' },
  { key: 'number', label: t.common.number, width: '9rem' },
  { key: 'type', label: h.entryType, help: h.entryTypeHelp, value: (r) => (r.subtype ? t.subtypes[r.subtype] : (t.entryTypes[r.type] ?? r.type)) },
  { key: 'source', label: t.common.module, help: h.sourceHelp, value: (r) => [t.modules[r.source.module] ?? r.source.module, r.source.docNumber].filter(Boolean).join(' · ') },
  { key: 'description', label: t.common.description },
  { key: 'totalDebit', label: t.common.amount, help: h.amountHelp, format: 'money' },
  { key: 'status', label: t.common.status, help: h.statusHelp },
]

const open = (row: JournalEntry) => router.push({ name: 'VoucherDetail', params: { id: row._id } })
</script>

<template>
  <section>
    <PageHeader :subtitle="t.vouchers.intro">
      <RouterLink v-if="canWrite" :to="{ name: 'VoucherNew' }" class="btn btn--primary"><AppIcon name="plus" /> {{ t.vouchers.new }}</RouterLink>
    </PageHeader>

    <ReportFilters v-model="range" :loading="list.loading" @apply="apply">
      <FormField v-bind="f.type" for="v-type">
        <BaseCombobox id="v-type" v-model="extra.type" :options="typeOptions" :empty-label="t.common.all" />
      </FormField>
      <FormField v-bind="f.module" for="v-module">
        <BaseCombobox id="v-module" v-model="extra.module" :options="moduleOptions" :empty-label="t.common.all" />
      </FormField>
      <FormField v-bind="f.number" for="v-number" class="narrow">
        <input id="v-number" v-model="extra.number" type="text" autocomplete="off" :placeholder="f.number.placeholder" />
      </FormField>
      <FormField v-bind="f.account" for="v-account">
        <LedgerAccountPicker id="v-account" v-model="extra.account" />
      </FormField>
      <FormField v-bind="f.q" for="v-q">
        <input id="v-q" v-model="extra.q" type="search" autocomplete="off" :placeholder="f.q.placeholder" />
      </FormField>
      <FormField v-bind="f.amount" for="v-amount" class="narrow">
        <MoneyInput id="v-amount" v-model="extra.amount" />
      </FormField>
      <FormField :label="f.excludeVoided.label" :help="f.excludeVoided.help">
        <BaseSwitch v-model="extra.excludeVoided" :label="f.excludeVoided.label" />
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
      :empty-message="s.vouchers.empty"
      :row-class="(r) => (r.status === 'anulado' ? 'is-void' : undefined)"
      clickable
      landscape
      @update:page="list.page = $event"
      @row-click="open"
      @retry="list.reload"
    >
      <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
    </DataTable>
  </section>
</template>
