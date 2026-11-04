<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import PartyForm from '@/components/catalogs/PartyForm.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { formOf, useEditor, type FormOf } from '@/composables/useEditor'
import { catalogService } from '@/services/catalog.service'
import { site } from '@/config/site'
import type { Party } from '@/types'

type Kind = 'customer' | 'supplier' | 'employee'

/**
 * Terceros: un mismo RUC puede ser cliente, proveedor y empleado. Desde
 * Facturación/CxC/CxP llega con `kind` fijo (solo clientes o proveedores).
 */
const props = defineProps<{ kind?: Kind }>()

const t = site.catalogs.parties
const { canWrite } = useAccess()
const showInactive = ref(false)
const tab = ref<'' | Kind>(props.kind ?? '')
const tabs = [
  { value: '' as const, label: t.tabs.all },
  { value: 'customer' as const, label: t.tabs.customer },
  { value: 'supplier' as const, label: t.tabs.supplier },
  { value: 'employee' as const, label: t.tabs.employee },
]
const FLAG = { customer: 'isCustomer', supplier: 'isSupplier', employee: 'isEmployee' } as const

const list = useList(
  (p) => catalogService.list('parties', p),
  () => ({ active: showInactive.value ? 'all' : 'true', ...(tab.value ? { [FLAG[tab.value]]: 'true' } : {}) }),
)

const columns = computed<Column<Party>[]>(() => [
  { key: 'identification', label: t.fields.identification.label, width: '9.5rem' },
  { key: 'name', label: t.fields.name.label },
  { key: 'roles', label: 'Tipo', value: (p) => kinds(p).map((k) => t.badges[k]).join(', ') },
  { key: 'phone', label: t.fields.phone.label },
  { key: 'email', label: t.fields.email.label },
  {
    key: 'creditDays',
    label: t.fields.creditDays.label,
    format: 'int',
    width: '7rem',
    value: (p) => (tab.value === 'supplier' ? p.supplier?.creditDays : p.isCustomer ? p.customer?.creditDays : p.supplier?.creditDays),
  },
  { key: 'isActive', label: 'Estado', value: (p) => (p.isActive ? site.common.active : site.common.inactive), width: '6rem' },
])

const kinds = (p: Party) => (Object.keys(FLAG) as Kind[]).filter((k) => p[FLAG[k]])

const blank = (): FormOf<Party> => ({
  identification: '',
  idType: '04',
  name: '',
  address: '',
  phone: '',
  email: '',
  isCustomer: tab.value === 'customer' || !tab.value,
  isSupplier: tab.value === 'supplier',
  isEmployee: tab.value === 'employee',
  customer: { sellerName: '', sellerCode: '', creditDays: 0, priceList: 'GENERAL', customerType: '', parish: '', branch: '', withholdsVat: false },
  supplier: { creditDays: 0, defaultExpenseAccount: '' },
  isActive: true,
})

const editor = useEditor<FormOf<Party>>({
  blank,
  validate: (f) => (!f.isCustomer && !f.isSupplier && !f.isEmployee ? 'Marca si es cliente, proveedor o empleado' : null),
  save: (f, id) => (id ? catalogService.update('parties', id, f) : catalogService.create('parties', f)),
  onSaved: list.reload,
})

// Terceros viejos pueden venir sin los subdocumentos: se completan con los valores por defecto.
function edit(p: Party) {
  const b = blank()
  editor.openEdit(p._id, { ...formOf(p), customer: { ...b.customer, ...p.customer }, supplier: { ...b.supplier, ...p.supplier } })
}
</script>

<template>
  <section>
    <PageHeader>
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="editor.openNew()"><AppIcon name="plus" /> {{ t.add }}</button>
    </PageHeader>

    <BaseSegmented v-if="!kind" v-model="tab" :options="tabs" tabs :label="t.title" class="tabs" />

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
      @row-click="edit"
      @retry="list.reload"
    >
      <template #toolbar>
        <SearchInput v-model="list.q" :placeholder="site.pickers.searchParty" />
        <BaseSwitch v-model="showInactive" :label="site.common.showInactive" />
      </template>
      <template #cell-identification="{ row }"><span class="mono">{{ row.identification }}</span></template>
      <template #cell-roles="{ row }">
        <span class="badges"><BaseBadge v-for="k in kinds(row)" :key="k" :tone="k === 'customer' ? 'info' : 'neutral'">{{ t.badges[k] }}</BaseBadge></span>
      </template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite" wide>
      <PartyForm v-model="editor.form" />
    </EditorDialog>
  </section>
</template>

<style scoped lang="scss">
.tabs {
  margin-bottom: 0.75rem;
}

.badges {
  @include flex(row, center, flex-start, 0.25rem);
  flex-wrap: wrap;
}
</style>
