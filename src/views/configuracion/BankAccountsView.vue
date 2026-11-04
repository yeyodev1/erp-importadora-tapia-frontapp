<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import FormField from '@/components/ui/FormField.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import AccountPicker from '@/components/pickers/AccountPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { formOf, useEditor, type FormOf } from '@/composables/useEditor'
import { catalogService } from '@/services/catalog.service'
import { useCatalogStore } from '@/stores/catalog'
import { site } from '@/config/site'
import type { BankAccount } from '@/types'

const t = site.catalogs.banks
const { canWrite } = useAccess()
const catalog = useCatalogStore()
const showInactive = ref(false)
const kind = ref<'' | 'banco' | 'caja'>('')
const kindTabs = [
  { value: '' as const, label: site.catalogs.parties.tabs.all },
  { value: 'banco' as const, label: 'Bancos' },
  { value: 'caja' as const, label: 'Cajas' },
]

const list = useList(
  (p) => catalogService.list('bank-accounts', p),
  () => ({ active: showInactive.value ? 'all' : 'true', kind: kind.value || undefined }),
)

const columns: Column<BankAccount>[] = [
  { key: 'kind', label: t.fields.kind.label, value: (b) => t.kinds[b.kind], width: '6rem' },
  { key: 'name', label: t.fields.name.label },
  { key: 'bank', label: t.fields.bank.label },
  { key: 'number', label: t.fields.number.label, value: (b) => [b.type && t.types[b.type], b.number].filter(Boolean).join(' ') },
  { key: 'accountCode', label: t.fields.accountCode.label },
  { key: 'nextCheck', label: t.fields.nextCheck.label, format: 'int', value: (b) => (b.kind === 'banco' ? b.nextCheck : null), width: '8rem' },
  { key: 'isActive', label: 'Estado', value: (b) => (b.isActive ? site.common.active : site.common.inactive), width: '7rem' },
]

const editor = useEditor<FormOf<BankAccount>>({
  blank: () => ({ kind: 'banco', name: '', bank: '', number: '', type: 'corriente', accountCode: '', nextCheck: 1, isActive: true }),
  validate: (f) => (!f.accountCode ? 'Elige la cuenta contable' : null),
  save: (f, id) => {
    const body = { ...f, nextCheck: Number(f.nextCheck) || 1, type: f.kind === 'caja' ? ('' as const) : f.type }
    return id ? catalogService.update('bank-accounts', id, body) : catalogService.create('bank-accounts', body)
  },
  onSaved: () => {
    list.reload()
    catalog.invalidate('bankAccounts')
  },
})
</script>

<template>
  <section>
    <PageHeader>
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
      clickable
      @update:page="list.page = $event"
      @row-click="editor.openEdit($event._id, formOf($event))"
      @retry="list.reload"
    >
      <template #toolbar>
        <BaseSegmented v-model="kind" :options="kindTabs" :label="t.fields.kind.label" />
        <SearchInput v-model="list.q" />
        <BaseSwitch v-model="showInactive" :label="site.common.showInactive" />
      </template>
      <template #cell-kind="{ row }"><BaseBadge :tone="row.kind === 'banco' ? 'info' : 'neutral'">{{ t.kinds[row.kind] }}</BaseBadge></template>
      <template #cell-accountCode="{ row }"><span class="mono">{{ row.accountCode }}</span></template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite">
      <div class="form-grid">
        <FormField v-bind="t.fields.kind" full>
          <BaseSegmented
            v-model="editor.form.kind"
            :label="t.fields.kind.label"
            :options="[{ value: 'banco', label: t.kinds.banco }, { value: 'caja', label: t.kinds.caja }]"
          />
        </FormField>
        <FormField v-bind="t.fields.name" for="ba-name" required full>
          <input id="ba-name" v-model="editor.form.name" required />
        </FormField>
        <template v-if="editor.form.kind === 'banco'">
          <FormField v-bind="t.fields.bank" for="ba-bank">
            <input id="ba-bank" v-model="editor.form.bank" />
          </FormField>
          <FormField v-bind="t.fields.type">
            <BaseSegmented
              v-model="editor.form.type"
              :label="t.fields.type.label"
              :options="[{ value: 'corriente', label: t.types.corriente }, { value: 'ahorros', label: t.types.ahorros }]"
            />
          </FormField>
          <FormField v-bind="t.fields.number" for="ba-num">
            <input id="ba-num" v-model="editor.form.number" inputmode="numeric" class="mono" />
          </FormField>
          <FormField v-bind="t.fields.nextCheck" for="ba-check" class="narrow">
            <input id="ba-check" v-model.number="editor.form.nextCheck" inputmode="numeric" class="num" />
          </FormField>
        </template>
        <FormField v-bind="t.fields.accountCode" for="ba-acc" required full>
          <AccountPicker id="ba-acc" v-model="editor.form.accountCode" :invalid="!!editor.error && !editor.form.accountCode" />
        </FormField>
        <BaseSwitch v-model="editor.form.isActive" v-bind="t.fields.isActive" />
      </div>
    </EditorDialog>
  </section>
</template>
