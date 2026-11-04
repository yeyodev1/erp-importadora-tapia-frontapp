<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import FormField from '@/components/ui/FormField.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import AccountPicker from '@/components/pickers/AccountPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { formOf, useEditor, type FormOf } from '@/composables/useEditor'
import { purchasesService } from '@/services/purchases.service'
import { cxp } from '@/config/copy/cxp'
import { site } from '@/config/site'
import type { WithholdingCode } from '@/types/purchases'

const t = cxp.codes
const { canWrite } = useAccess()
const showInactive = ref(false)
const tax = ref<'' | 'renta' | 'iva'>('')

const list = useList(
  (p) => purchasesService.listCodes(p),
  () => ({ active: showInactive.value ? 'all' : 'true', tax: tax.value || undefined }),
  500,
)

const columns: Column<WithholdingCode>[] = [
  { key: 'tax', label: t.fields.tax.label, value: (c) => cxp.tax[c.tax], width: '6rem' },
  { key: 'code', label: t.fields.code.label, width: '6rem' },
  { key: 'description', label: t.fields.description.label },
  { key: 'rate', label: t.fields.rate.label, format: 'qty', width: '7rem' },
  { key: 'accountCode', label: t.fields.accountCode.label, value: (c) => c.accountCode || 'Mapa contable' },
  { key: 'isActive', label: 'Estado', value: (c) => (c.isActive ? site.common.active : site.common.inactive), width: '7rem' },
]

const rateText = ref('')
const editor = useEditor<FormOf<WithholdingCode>>({
  blank: () => ({ tax: 'renta', code: '', description: '', rate: 0, accountCode: '', isActive: true }),
  validate: (f) => {
    f.rate = Number(rateText.value.replace(',', '.'))
    if (!f.code.trim()) return 'Indica el código'
    return Number.isFinite(f.rate) && f.rate >= 0 && f.rate <= 100 ? null : 'El porcentaje va de 0 a 100'
  },
  save: (f, id) => purchasesService.saveCode(f, id),
  onSaved: () => list.reload(),
})

function openNew() {
  rateText.value = ''
  editor.openNew()
}

function openEdit(c: WithholdingCode) {
  rateText.value = String(c.rate)
  editor.openEdit(c._id, formOf(c))
}
</script>

<template>
  <section>
    <PageHeader>
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="openNew"><AppIcon name="plus" /> {{ t.add }}</button>
    </PageHeader>

    <DataTable :columns="columns" :rows="list.items" :loading="list.loading" :error="list.error" clickable @row-click="openEdit" @retry="list.reload">
      <template #toolbar>
        <SearchInput v-model="list.q" class="toolbar__search" />
        <BaseSegmented
          v-model="tax"
          :options="[
            { value: '', label: 'Todos' },
            { value: 'renta', label: 'Renta' },
            { value: 'iva', label: 'IVA' },
          ]"
        />
        <BaseSwitch v-model="showInactive" :label="site.common.showInactive" />
      </template>
      <template #cell-code="{ row }"><span class="mono">{{ row.code }}</span></template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite">
      <div class="form-grid">
        <FormField v-bind="t.fields.tax" full>
          <BaseSegmented
            v-model="editor.form.tax"
            :label="t.fields.tax.label"
            :options="[
              { value: 'renta', label: 'Renta' },
              { value: 'iva', label: 'IVA' },
            ]"
          />
        </FormField>
        <FormField v-bind="t.fields.code" for="wc-code" required class="narrow">
          <input id="wc-code" v-model="editor.form.code" class="mono" maxlength="10" />
        </FormField>
        <FormField v-bind="t.fields.rate" for="wc-rate" required class="narrow">
          <input id="wc-rate" v-model="rateText" class="num" inputmode="decimal" />
        </FormField>
        <FormField v-bind="t.fields.description" for="wc-desc" full>
          <input id="wc-desc" v-model="editor.form.description" />
        </FormField>
        <FormField v-bind="t.fields.accountCode" for="wc-acc" full>
          <AccountPicker id="wc-acc" v-model="editor.form.accountCode" clearable />
        </FormField>
        <BaseSwitch v-model="editor.form.isActive" v-bind="t.fields.isActive" />
      </div>
    </EditorDialog>
  </section>
</template>
