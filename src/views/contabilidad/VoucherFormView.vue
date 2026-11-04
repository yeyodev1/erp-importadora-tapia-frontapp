<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import SubtypeCards from '@/components/accounting/SubtypeCards.vue'
import BalanceBar from '@/components/accounting/BalanceBar.vue'
import type { LineColumn } from '@/components/documents/lines'
import { useAccess } from '@/composables/useAccess'
import { newVoucherLine, useVoucherForm, type VoucherLine } from '@/composables/accounting/useVoucherForm'
import { useToastStore } from '@/stores/toast'
import { accounting as t } from '@/config/copy/accounting'
import { voucherGuide as g } from '@/config/copy/voucherGuide'

/**
 * Asiento manual: diario, depreciación, importación o rol de pagos.
 * Guía en 4 pasos, cada caso explicado con un ejemplo y el cuadre dicho en
 * palabras ("falta $20 en el Haber"). No graba si no cuadra.
 */
const router = useRouter()
const toast = useToastStore()
const { canWrite } = useAccess()
const form = useVoucherForm()
const { doc } = form
const L = t.form.lines
const C = g.columns

const columns: LineColumn<VoucherLine>[] = [
  { key: 'accountCode', label: L.account, type: 'account', width: '30%', help: C.account },
  { key: 'description', label: L.description, type: 'text', width: '18%', help: C.detail, placeholder: g.placeholders.detail },
  { key: 'debit', label: L.debit, type: 'money', total: true, width: '9rem', help: C.debit },
  { key: 'credit', label: L.credit, type: 'money', total: true, width: '9rem', help: C.credit },
  { key: 'costCenter', label: L.costCenter, width: '9rem', help: C.costCenter },
  { key: 'partyId', label: L.party, width: '16%', help: C.party },
]

const descriptionPlaceholder = computed(() => g.subtypes[doc.subtype]?.descriptionPlaceholder ?? '')

async function save() {
  const entry = await form.save()
  if (!entry) return
  toast.success(`${t.form.saved}: ${entry.number}`)
  router.push({ name: 'VoucherDetail', params: { id: entry._id } })
}
</script>

<template>
  <section>
    <PageHeader :title="t.form.title" :subtitle="g.intro">
      <RouterLink :to="{ name: 'Vouchers' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.common.back }}</RouterLink>
    </PageHeader>

    <ol class="vf__steps" aria-label="Pasos">
      <li v-for="(step, i) in g.steps" :key="step"><span class="vf__n">{{ i + 1 }}</span>{{ step }}</li>
    </ol>

    <form class="vf" novalidate @submit.prevent="save">
      <fieldset class="panel panel--pad vf__head" :disabled="!canWrite">
        <div class="form-grid">
          <FormField v-bind="g.date" for="vf-date" required class="vf__date">
            <BaseDatePicker id="vf-date" v-model="doc.date" />
          </FormField>
        </div>

        <div class="vf__block">
          <p class="vf__title">{{ g.subtypeTitle }} <HelpTip :text="g.subtypeHelp" :label="g.subtypeTitle" /></p>
          <SubtypeCards v-model="doc.subtype" :disabled="!canWrite" />
        </div>

        <div class="form-grid">
          <FormField v-bind="g.description" for="vf-desc" required full>
            <input id="vf-desc" v-model="doc.description" type="text" maxlength="300" autocomplete="off" :placeholder="descriptionPlaceholder" />
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
              <input :id="`vf-${index}-costCenter`" v-model="line.costCenter" type="text" :placeholder="g.placeholders.costCenter" :aria-invalid="line.requiresCostCenter && !line.costCenter" />
              <HelpTip v-if="line.requiresCostCenter" :text="t.form.costCenterHelp" />
            </span>
          </template>
          <template #cell-partyId="{ line, index }">
            <PartyPicker :id="`vf-${index}-party`" v-model="line.partyId" clearable />
          </template>
        </DocumentLines>
      </div>

      <BalanceBar :debit="form.debit.value" :credit="form.credit.value" />

      <EntryPreview :lines="form.preview.value" />

      <p v-if="form.incomplete.value" class="vf__warn" role="alert"><AppIcon name="alert-circle" /> {{ t.form.incomplete }}</p>
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

  &__steps {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
    list-style: none;
    margin: 0 0 0.75rem;
    padding: 0;
    font-size: $text-sm;
    color: $ink-soft;

    li {
      @include flex(row, center, flex-start, 0.4rem);
      padding: 0.3rem 0.7rem 0.3rem 0.3rem;
      border-radius: $radius-pill;
      background: $surface;
      border: 1px solid $line;
    }
  }

  &__n {
    @include flex(row, center, center, 0);
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    background: $accent;
    color: #fff;
    font-size: $text-xs;
    font-weight: 700;
  }

  &__head {
    @include flex(column, stretch, flex-start, 1rem);
    border: 1px solid $line;
    margin: 0;
    min-width: 0;
  }

  &__block {
    @include flex(column, stretch, flex-start, 0.5rem);
  }

  &__title {
    @include flex(row, center, flex-start, 0.35rem);
    margin: 0;
    font-weight: 600;
    font-size: $text-sm;
  }

  &__date {
    flex: 0 1 14rem !important;
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
