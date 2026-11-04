<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import type { LineColumn } from '@/components/documents/lines'
import { useAccess } from '@/composables/useAccess'
import { newVoucherLine, useVoucherForm, type VoucherLine } from '@/composables/accounting/useVoucherForm'
import { useToastStore } from '@/stores/toast'
import { accounting as t } from '@/config/copy/accounting'
import type { EntrySubtype } from '@/services/accounting.service'

/** Asiento manual: diario, depreciación, importación o rol de pagos. No graba si no cuadra. */
const router = useRouter()
const toast = useToastStore()
const { canWrite } = useAccess()
const form = useVoucherForm()
const { doc } = form
const L = t.form.lines

const subtypes = Object.entries(t.subtypes).map(([value, label]) => ({ value: value as EntrySubtype, label }))
const columns: LineColumn<VoucherLine>[] = [
  { key: 'accountCode', label: L.account, type: 'account', width: '30%' },
  { key: 'description', label: L.description, type: 'text', width: '18%' },
  { key: 'debit', label: L.debit, type: 'money', total: true, width: '9rem' },
  { key: 'credit', label: L.credit, type: 'money', total: true, width: '9rem' },
  { key: 'costCenter', label: L.costCenter, width: '9rem' },
  { key: 'partyId', label: L.party, width: '16%' },
]

async function save() {
  const entry = await form.save()
  if (!entry) return
  toast.success(`${t.form.saved}: ${entry.number}`)
  router.push({ name: 'VoucherDetail', params: { id: entry._id } })
}
</script>

<template>
  <section>
    <PageHeader :title="t.form.title" :subtitle="t.form.intro">
      <RouterLink :to="{ name: 'Vouchers' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.common.back }}</RouterLink>
    </PageHeader>

    <form class="vf" novalidate @submit.prevent="save">
      <fieldset class="panel panel--pad vf__head" :disabled="!canWrite">
        <div class="form-grid">
          <FormField v-bind="t.form.fields.date" for="vf-date" required class="vf__date">
            <BaseDatePicker id="vf-date" v-model="doc.date" />
          </FormField>
          <FormField v-bind="t.form.fields.subtype" full>
            <BaseSegmented v-model="doc.subtype" :options="subtypes" :label="t.form.fields.subtype.label" />
          </FormField>
          <FormField v-bind="t.form.fields.description" for="vf-desc" required full>
            <input id="vf-desc" v-model="doc.description" type="text" maxlength="300" autocomplete="off" />
          </FormField>
        </div>
      </fieldset>

      <div class="panel panel--pad">
        <DocumentLines
          v-model="doc.lines"
          :columns="columns"
          :new-line="newVoucherLine"
          :readonly="!canWrite"
          id-prefix="vf"
          @pick-account="form.pickAccount"
        >
          <template #cell-costCenter="{ line, index }">
            <span class="vf__cc">
              <input :id="`vf-${index}-costCenter`" v-model="line.costCenter" type="text" :aria-invalid="line.requiresCostCenter && !line.costCenter" />
              <HelpTip v-if="line.requiresCostCenter" :text="t.form.costCenterHelp" />
            </span>
          </template>
          <template #cell-partyId="{ line, index }">
            <PartyPicker :id="`vf-${index}-party`" v-model="line.partyId" clearable />
          </template>
        </DocumentLines>
      </div>

      <EntryPreview :lines="form.preview.value" />

      <p v-if="form.incomplete.value" class="vf__warn" role="alert"><AppIcon name="alert-circle" /> {{ t.form.incomplete }}</p>
      <p v-else-if="!form.balanced.value && form.debit.value + form.credit.value > 0" class="vf__warn" role="alert">
        <AppIcon name="alert-circle" /> {{ t.form.blocked }}
      </p>
      <p v-if="form.error.value" class="vf__warn" role="alert"><AppIcon name="alert" /> {{ form.error.value }}</p>

      <div v-if="canWrite" class="vf__actions">
        <button type="submit" class="btn btn--primary" :disabled="!form.canSave.value || form.saving.value">
          <AppIcon :name="form.saving.value ? 'spinner' : 'check'" :spin="form.saving.value" /> {{ t.form.save }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped lang="scss">
.vf {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__head {
    border: 1px solid $line;
    margin: 0;
    min-width: 0;
  }

  &__date {
    flex: 0 1 12rem !important;
  }

  &__cc {
    @include flex(row, center, flex-start, 0.25rem);
  }

  &__warn {
    @include flex(row, center, flex-start, 0.4rem);
    color: $danger;
    font-size: $text-sm;
  }

  &__actions {
    @include flex(row, center, flex-end, 0.5rem);
  }
}
</style>
