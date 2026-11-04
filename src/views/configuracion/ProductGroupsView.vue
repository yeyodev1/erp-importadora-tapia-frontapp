<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
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
import type { ProductGroup } from '@/types'

const t = site.catalogs.groups
const { canWrite } = useAccess()
const catalog = useCatalogStore()
const showInactive = ref(false)
const newSubgroup = ref('')

const list = useList(
  (p) => catalogService.list('product-groups', p),
  () => ({ active: showInactive.value ? 'all' : 'true' }),
)

const columns: Column<ProductGroup>[] = [
  { key: 'name', label: t.fields.name.label },
  { key: 'subgroups', label: t.fields.subgroups.label, value: (g) => g.subgroups.join(', ') },
  { key: 'accounts.inventory', label: 'Inventario' },
  { key: 'accounts.sales', label: 'Ventas' },
  { key: 'accounts.cost', label: 'Costo' },
  { key: 'isActive', label: 'Estado', value: (g) => (g.isActive ? site.common.active : site.common.inactive), width: '7rem' },
]
const accountKeys = ['inventory', 'sales', 'cost'] as const

const editor = useEditor<FormOf<ProductGroup>>({
  blank: () => ({ name: '', subgroups: [], accounts: { inventory: '', sales: '', cost: '' }, isActive: true }),
  validate: (f) => (accountKeys.some((k) => !f.accounts[k]) ? 'El grupo necesita sus tres cuentas' : null),
  save: (f, id) => (id ? catalogService.update('product-groups', id, f) : catalogService.create('product-groups', f)),
  onSaved: () => {
    list.reload()
    catalog.invalidate('productGroups')
  },
})

function addSubgroup() {
  const name = newSubgroup.value.trim()
  if (name && !editor.form.subgroups.includes(name)) editor.form.subgroups.push(name)
  newSubgroup.value = ''
}
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
        <SearchInput v-model="list.q" />
        <BaseSwitch v-model="showInactive" :label="site.common.showInactive" />
      </template>
      <template v-for="k in accountKeys" :key="k" #[`cell-accounts.${k}`]="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite">
      <div class="form-grid">
        <FormField v-bind="t.fields.name" for="pg-name" required full>
          <input id="pg-name" v-model="editor.form.name" required />
        </FormField>
        <FormField v-bind="t.fields.subgroups" for="pg-sub" full>
          <div class="chips">
            <span v-for="(s, i) in editor.form.subgroups" :key="s" class="chips__item">
              {{ s }}
              <button v-if="canWrite" type="button" :aria-label="`Quitar ${s}`" @click="editor.form.subgroups.splice(i, 1)"><AppIcon name="x" /></button>
            </span>
          </div>
          <div class="chips__add">
            <input id="pg-sub" v-model="newSubgroup" @keydown.enter.prevent="addSubgroup" />
            <button type="button" class="btn btn--ghost" @click="addSubgroup"><AppIcon name="plus" /> {{ t.addSubgroup }}</button>
          </div>
        </FormField>
        <FormField v-for="k in accountKeys" :key="k" v-bind="t.fields[k]" :for="`pg-${k}`" required full>
          <AccountPicker :id="`pg-${k}`" v-model="editor.form.accounts[k]" />
        </FormField>
        <BaseSwitch v-model="editor.form.isActive" v-bind="t.fields.isActive" />
      </div>
    </EditorDialog>
  </section>
</template>

<style scoped lang="scss">
.chips {
  @include flex(row, center, flex-start, 0.35rem);
  flex-wrap: wrap;

  &__item {
    @include flex(row, center, flex-start, 0.3rem);
    padding: 0.15rem 0.3rem 0.15rem 0.6rem;
    border-radius: $radius-sm;
    background: $sand;
    font-size: $text-sm;

    button {
      color: $ink-muted;
      padding: 0 0.2rem;
    }
  }

  &__add {
    @include flex(row, center, flex-start, 0.4rem);
    margin-top: 0.35rem;
  }
}
</style>
