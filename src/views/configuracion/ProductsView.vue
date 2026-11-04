<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import ProductForm from '@/components/catalogs/ProductForm.vue'
import { blankProduct, formToProduct, productToForm, type ProductForm as Form } from '@/components/catalogs/productForm'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { useEditor } from '@/composables/useEditor'
import { catalogService } from '@/services/catalog.service'
import { useCatalogStore } from '@/stores/catalog'
import { site } from '@/config/site'
import type { Product } from '@/types'

const t = site.catalogs.products
const { canWrite } = useAccess()
const catalog = useCatalogStore()
const showInactive = ref(false)
const groupId = ref('')
onMounted(() => catalog.ensure('productGroups'))

const groupOptions = computed(() => catalog.productGroups.map((g) => ({ value: g._id, label: g.name })))
const groupName = (p: Product) => (typeof p.groupId === 'object' ? p.groupId?.name : catalog.productGroups.find((g) => g._id === p.groupId)?.name) ?? ''

const list = useList(
  (p) => catalogService.list('products', p),
  () => ({ active: showInactive.value ? 'all' : 'true', groupId: groupId.value || undefined }),
)

const columns: Column<Product>[] = [
  { key: 'code', label: t.fields.code.label, width: '7rem' },
  { key: 'name', label: t.fields.name.label },
  { key: 'group', label: t.fields.groupId.label, value: (p) => [groupName(p), p.subgroup].filter(Boolean).join(' / ') },
  { key: 'unit', label: t.fields.unit.label },
  { key: 'purchase', label: t.fields.purchaseUnitName.label, value: (p) => (p.purchaseUnit ? `${p.purchaseUnit.name} × ${p.purchaseUnit.factor}` : '') },
  { key: 'vatRate', label: t.fields.vatRate.label, value: (p) => `${p.vatRate} %`, align: 'right', width: '5rem' },
  { key: 'minQty', label: t.fields.minQty.label, format: 'qty', width: '7rem' },
  { key: 'price', label: 'Precio GENERAL', format: 'money', value: (p) => p.prices.find((x) => x.list === 'GENERAL')?.price, width: '8rem' },
  { key: 'isActive', label: 'Estado', value: (p) => (p.isActive ? site.common.active : site.common.inactive), width: '6rem' },
]

const editor = useEditor<Form>({
  blank: blankProduct,
  validate: (f) => (!f.groupId ? 'Elige el grupo del producto' : !f.purchaseUnit.factor ? 'El factor debe ser mayor que cero' : null),
  save: (f, id) => {
    const body = formToProduct(f)
    return id ? catalogService.update('products', id, body) : catalogService.create('products', body)
  },
  onSaved: list.reload,
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
      landscape
      clickable
      @update:page="list.page = $event"
      @row-click="editor.openEdit($event._id, productToForm($event))"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" :placeholder="site.pickers.searchProduct" />
        <div class="group-filter"><BaseCombobox id="pv-group" v-model="groupId" :options="groupOptions" :empty-label="t.allGroups" /></div>
        <BaseSwitch v-model="showInactive" :label="site.common.showInactive" />
      </template>
      <template #cell-code="{ row }"><span class="mono">{{ row.code }}</span></template>
      <template #cell-vatRate="{ row }"><BaseBadge :tone="row.vatRate ? 'info' : 'neutral'">{{ row.vatRate }} %</BaseBadge></template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite" wide>
      <ProductForm v-model="editor.form" :readonly="!canWrite" />
    </EditorDialog>
  </section>
</template>

<style scoped lang="scss">
.group-filter {
  flex: 0 1 220px;
}
</style>
