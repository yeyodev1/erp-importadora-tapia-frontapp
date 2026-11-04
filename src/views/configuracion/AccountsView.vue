<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import FormField from '@/components/ui/FormField.vue'
import EditorDialog from '@/components/ui/EditorDialog.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useAccess } from '@/composables/useAccess'
import { useAccountTree } from '@/composables/useAccountTree'
import { useEditor } from '@/composables/useEditor'
import { catalogService } from '@/services/catalog.service'
import { site } from '@/config/site'
import type { Account, AccountKind } from '@/types'

const t = site.catalogs.accounts
const { canWrite } = useAccess()
const tree = useAccountTree()

const columns: Column<Account>[] = [
  { key: 'code', label: t.fields.code.label, width: '11rem' },
  // En Excel e impresión la sangría va con espacios duros.
  { key: 'name', label: t.fields.name.label, value: (a) => '  '.repeat(a.level - 1) + a.name },
  { key: 'kind', label: t.fields.kind.label, help: t.fields.kind.help, value: (a) => t[a.kind], width: '7rem' },
  { key: 'flags', label: t.cols.flags.label, help: t.cols.flags.help, value: (a) => [a.isExpense && t.cols.expense, a.requiresCostCenter && t.cols.costCenter].filter(Boolean).join(', ') },
  { key: 'isActive', label: t.cols.status.label, help: t.cols.status.help, value: (a) => (a.isActive ? site.common.active : site.common.inactive), width: '6rem' },
  { key: 'actions', label: '', screenOnly: true, width: '7rem' },
]
const kinds: { value: AccountKind; label: string; help: string }[] = [
  { value: 'mayor', label: t.mayor, help: t.kindHelp.mayor },
  { value: 'movimiento', label: t.movimiento, help: t.kindHelp.movimiento },
]

interface AccountForm {
  code: string
  name: string
  kind: AccountKind
  requiresCostCenter: boolean
  isExpense: boolean
  isActive: boolean
}

const editor = useEditor<AccountForm>({
  blank: () => ({ code: '', name: '', kind: 'movimiento', requiresCostCenter: false, isExpense: false, isActive: true }),
  validate: (f, id) => (!id && !/^\d(\.\d{1,3})*$/.test(f.code) ? site.catalogs.accounts.fields.code.help : null),
  save: (f, id) => {
    // El código no viaja al editar: el API tampoco lo cambiaría.
    const { code, ...rest } = f
    return id ? catalogService.update('accounts', id, rest) : catalogService.create('accounts', { code: code.trim(), ...rest })
  },
  onSaved: tree.load,
})

function edit(a: Account) {
  editor.openEdit(a._id, {
    code: a.code,
    name: a.name,
    kind: a.kind,
    requiresCostCenter: a.requiresCostCenter,
    isExpense: a.isExpense,
    isActive: a.isActive,
  })
}

const addChild = (parent: Account) => editor.openNew({ code: `${parent.code}.` })
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle">
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="editor.openNew()"><AppIcon name="plus" /> {{ t.add }}</button>
    </PageHeader>

    <DataTable
      :columns="columns"
      :rows="tree.rows.value"
      :loading="tree.state.loading"
      :error="tree.state.error"
      :total="tree.rows.value.length"
      :empty-message="t.empty"
      clickable
      @row-click="edit"
      @retry="tree.load"
    >
      <template #toolbar>
        <SearchInput v-model="tree.state.q" :placeholder="site.pickers.searchAccount" />
        <button type="button" class="btn btn--ghost btn--sm" @click="tree.expandAll">{{ t.expandAll }}</button>
        <button type="button" class="btn btn--ghost btn--sm" @click="tree.collapseAll">{{ t.collapseAll }}</button>
        <BaseSwitch v-model="tree.state.showInactive" :label="site.common.showInactive" />
      </template>
      <template #cell-code="{ row }"><span class="mono">{{ row.code }}</span></template>
      <template #cell-name="{ row }">
        <span class="node" :style="{ paddingLeft: `${(row.level - 1) * 1.1}rem` }" :class="{ 'node--mayor': row.kind === 'mayor' }">
          <button
            v-if="tree.parents.value.has(row.code) && !tree.state.q"
            type="button"
            class="node__toggle"
            :aria-label="tree.collapsed.value.has(row.code) ? 'Expandir' : 'Contraer'"
            @click.stop="tree.toggle(row.code)"
          >
            <AppIcon :name="tree.collapsed.value.has(row.code) ? 'caret-right' : 'caret-down'" />
          </button>
          <span v-else class="node__toggle"></span>
          {{ row.name }}
        </span>
      </template>
      <template #cell-kind="{ row }"><BaseBadge :tone="row.kind === 'mayor' ? 'neutral' : 'info'">{{ t[row.kind as AccountKind] }}</BaseBadge></template>
      <template #cell-isActive="{ row }"><StatusBadge :status="row.isActive ? 'activo' : 'inactivo'" /></template>
      <template #cell-actions="{ row }">
        <button v-if="canWrite && row.kind === 'mayor'" type="button" class="btn btn--ghost btn--sm" @click.stop="addChild(row)">
          <AppIcon name="plus" /> {{ t.addChild }}
        </button>
      </template>
    </DataTable>

    <EditorDialog :editor="editor" :title-new="t.newTitle" :title-edit="t.editTitle" :readonly="!canWrite">
      <div class="form-grid">
        <FormField v-bind="t.fields.code" for="ac-code" required :hint="editor.id ? t.codeLocked : undefined">
          <input id="ac-code" v-model="editor.form.code" class="mono" :disabled="!!editor.id" :placeholder="t.ph.code" required />
        </FormField>
        <FormField v-bind="t.fields.kind">
          <BaseSegmented v-model="editor.form.kind" :options="kinds" :label="t.fields.kind.label" />
        </FormField>
        <FormField v-bind="t.fields.name" for="ac-name" required full>
          <input id="ac-name" v-model="editor.form.name" required :placeholder="t.ph.name" />
        </FormField>
        <BaseSwitch v-model="editor.form.isExpense" v-bind="t.fields.isExpense" />
        <BaseSwitch v-model="editor.form.requiresCostCenter" v-bind="t.fields.requiresCostCenter" />
        <BaseSwitch v-model="editor.form.isActive" v-bind="t.fields.isActive" />
      </div>
    </EditorDialog>
  </section>
</template>

<style scoped lang="scss">
.node {
  @include flex(row, center, flex-start, 0.25rem);

  &--mayor {
    font-weight: 600;
  }

  &__toggle {
    @include flex(row, center, center);
    width: 1.2rem;
    height: 1.2rem;
    color: $ink-muted;
    flex-shrink: 0;
  }
}
</style>
