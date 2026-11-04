<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import FormField from '@/components/ui/FormField.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { formOf, useEditor, type FormOf } from '@/composables/useEditor'
import { catalogService } from '@/services/catalog.service'
import { useCatalogStore } from '@/stores/catalog'
import { site } from '@/config/site'
import type { Warehouse } from '@/types'

const t = site.catalogs.warehouses
const { canWrite } = useAccess()
const catalog = useCatalogStore()
const showInactive = ref(false)

const list = useList(
  (p) => catalogService.list('warehouses', p),
  () => ({ active: showInactive.value ? 'all' : 'true' }),
)

const columns: Column<Warehouse>[] = [
  { key: 'code', label: t.fields.code.label, width: '6rem' },
  { key: 'name', label: t.fields.name.label },
  { key: 'serie', label: 'Serie SRI', value: (w) => `${w.establishment}-${w.emissionPoint}`, width: '8rem' },
  { key: 'address', label: t.fields.address.label },
  { key: 'isActive', label: 'Estado', value: (w) => (w.isActive ? site.common.active : site.common.inactive), width: '7rem' },
]

const editor = useEditor<FormOf<Warehouse>>({
  blank: () => ({ code: '', name: '', establishment: '001', emissionPoint: '001', address: '', isActive: true }),
  validate: (f) => (!/^\d{3}$/.test(f.establishment) || !/^\d{3}$/.test(f.emissionPoint) ? 'Establecimiento y punto de emisión llevan 3 dígitos' : null),
  save: (f, id) => (id ? catalogService.update('warehouses', id, f) : catalogService.create('warehouses', f)),
  onSaved: () => {
    list.reload()
    catalog.invalidate('warehouses')
  },
})
</script>

<template>
  <section>
    <PageHeader :subtitle="canWrite ? undefined : t.adminOnly">
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
        <SearchInput v-model="list.q" />
        <BaseSwitch v-model="showInactive" :label="site.common.showInactive" />
      </template>
      <template #cell-code="{ row }"><span class="mono">{{ row.code }}</span></template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite">
      <div class="form-grid">
        <FormField v-bind="t.fields.code" for="wh-code" required class="narrow">
          <input id="wh-code" v-model="editor.form.code" required maxlength="10" />
        </FormField>
        <FormField v-bind="t.fields.name" for="wh-name" required>
          <input id="wh-name" v-model="editor.form.name" required />
        </FormField>
        <FormField v-bind="t.fields.establishment" for="wh-est" required class="narrow">
          <input id="wh-est" v-model="editor.form.establishment" inputmode="numeric" maxlength="3" class="mono" />
        </FormField>
        <FormField v-bind="t.fields.emissionPoint" for="wh-pto" required class="narrow">
          <input id="wh-pto" v-model="editor.form.emissionPoint" inputmode="numeric" maxlength="3" class="mono" />
        </FormField>
        <FormField v-bind="t.fields.address" for="wh-addr" full>
          <input id="wh-addr" v-model="editor.form.address" />
        </FormField>
        <BaseSwitch v-model="editor.form.isActive" v-bind="t.fields.isActive" />
      </div>
    </EditorDialog>
  </section>
</template>
