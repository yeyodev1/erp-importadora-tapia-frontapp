<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import FormField from '@/components/ui/FormField.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import WarehousePicker from '@/components/pickers/WarehousePicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useEditor } from '@/composables/useEditor'
import { settingsService, type UserInput } from '@/services/settings.service'
import { useCatalogStore } from '@/stores/catalog'
import { site } from '@/config/site'
import { ROLES, type ApiError, type ErpUser } from '@/types'

const t = site.catalogs.users
const catalog = useCatalogStore()
const users = ref<ErpUser[]>([])
const loading = ref(true)
const error = ref('')
const q = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    users.value = await settingsService.listUsers()
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  load()
  catalog.ensure('warehouses')
})

// Pocos usuarios: la búsqueda es local.
const rows = computed(() => {
  const term = q.value.trim().toLowerCase()
  return term ? users.value.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(term)) : users.value
})
const roleOptions = ROLES.map((r) => ({ value: r, label: site.roles[r] }))

const columns: Column<ErpUser>[] = [
  { key: 'name', label: t.fields.name.label },
  { key: 'email', label: t.fields.email.label },
  { key: 'role', label: t.fields.role.label, value: (u) => site.roles[u.role] },
  { key: 'warehouseId', label: t.fields.warehouseId.label, value: (u) => catalog.warehouseName(u.warehouseId) },
  { key: 'lastLoginAt', label: t.fields.lastLoginAt.label, format: 'date', width: '8rem' },
  { key: 'isActive', label: 'Estado', value: (u) => (u.isActive ? site.common.active : site.common.inactive), width: '7rem' },
]

const editor = useEditor<UserInput>({
  blank: () => ({ email: '', password: '', name: '', phone: '', role: 'facturacion', warehouseId: null, isActive: true }),
  validate: (f, id) => (!id && f.password.length < 8 ? 'La contraseña debe tener al menos 8 caracteres' : null),
  save: (f, id) => {
    const body = { ...f, warehouseId: f.warehouseId || null }
    if (id) {
      const { email: _e, password: _p, ...changes } = body
      return settingsService.updateUser(id, changes)
    }
    const { isActive: _a, ...created } = body
    return settingsService.createUser(created)
  },
  onSaved: load,
})

function edit(u: ErpUser) {
  editor.openEdit(u._id, { ...u, password: '' })
}
</script>

<template>
  <section>
    <PageHeader>
      <button type="button" class="btn btn--primary" @click="editor.openNew()"><AppIcon name="plus" /> {{ t.add }}</button>
    </PageHeader>

    <DataTable :columns="columns" :rows="rows" :loading="loading" :error="error" clickable @row-click="edit" @retry="load">
      <template #toolbar><SearchInput v-model="q" /></template>
      <template #cell-role="{ row }"><BaseBadge tone="info">{{ site.roles[row.role] }}</BaseBadge></template>
      <template #cell-lastLoginAt="{ row }">{{ row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('es-EC') : t.never }}</template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle">
      <div class="form-grid">
        <FormField v-bind="t.fields.name" for="us-name" required>
          <input id="us-name" v-model="editor.form.name" required />
        </FormField>
        <FormField v-bind="t.fields.email" for="us-email" required>
          <input id="us-email" v-model="editor.form.email" type="email" :disabled="!!editor.id" required autocomplete="off" />
        </FormField>
        <FormField v-if="!editor.id" v-bind="t.fields.password" for="us-pass" required>
          <input id="us-pass" v-model="editor.form.password" type="password" autocomplete="new-password" minlength="8" required />
        </FormField>
        <FormField v-bind="t.fields.phone" for="us-phone">
          <input id="us-phone" v-model="editor.form.phone" inputmode="tel" />
        </FormField>
        <FormField v-bind="t.fields.role" for="us-role" required>
          <BaseCombobox id="us-role" v-model="editor.form.role" :options="roleOptions" />
        </FormField>
        <FormField v-bind="t.fields.warehouseId" for="us-wh">
          <WarehousePicker id="us-wh" :model-value="editor.form.warehouseId ?? ''" empty-label="Sin bodega" @update:model-value="editor.form.warehouseId = $event || null" />
        </FormField>
        <BaseSwitch v-if="editor.id" v-model="editor.form.isActive" v-bind="t.fields.isActive" />
      </div>
    </EditorDialog>
  </section>
</template>
