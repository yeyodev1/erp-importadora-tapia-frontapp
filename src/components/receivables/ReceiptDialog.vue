<script setup lang="ts">
import { watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import { useReceiptForm } from '@/composables/receivables/useReceiptForm'
import { cxc } from '@/config/copy/cxc'
import { formatMoney } from '@/utils/money'
import { formatDay, todayISO } from '@/utils/format'
import type { ReceiptMethod } from '@/services/receivables.service'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const t = cxc.receipts
const r = useReceiptForm(() => emit('saved'))
const methods = Object.entries(cxc.methods).map(([value, label]) => ({
  value: value as ReceiptMethod,
  label,
}))
const today = todayISO()

watch(
  () => props.open,
  (open) => open && r.reset(),
)
</script>

<template>
  <FormDialog
    :open="open"
    :title="t.newTitle"
    wide
    :loading="r.saving.value"
    :error="r.error.value"
    @submit="r.submit"
    @close="emit('close')"
  >
    <div class="form-grid">
      <FormField v-bind="t.fields.party" for="rc-party" required>
        <PartyPicker id="rc-party" v-model="r.form.partyId" role="customer" />
      </FormField>
      <FormField v-bind="t.fields.date" for="rc-date" required>
        <BaseDatePicker id="rc-date" v-model="r.form.date" />
      </FormField>
      <FormField v-bind="t.fields.method" full>
        <BaseSegmented v-model="r.form.method" :options="methods" :label="t.fields.method.label" />
      </FormField>

      <template v-if="r.isCheck.value">
        <FormField v-bind="t.fields.checkNumber" for="rc-chk" required class="narrow">
          <input id="rc-chk" v-model="r.form.check.number" inputmode="numeric" class="mono" />
        </FormField>
        <FormField v-bind="t.fields.checkBank" for="rc-chkbank" required>
          <input id="rc-chkbank" v-model="r.form.check.bank" />
        </FormField>
        <FormField v-bind="t.fields.checkDue" for="rc-due" required>
          <BaseDatePicker id="rc-due" v-model="r.form.check.dueDate" :range-start="r.form.date" />
        </FormField>
      </template>
      <template v-else>
        <FormField v-bind="t.fields.bank" for="rc-bank" required>
          <BankAccountPicker id="rc-bank" v-model="r.form.bankAccountId" :kind="r.bankKind.value" />
        </FormField>
        <FormField v-bind="t.fields.reference" for="rc-ref">
          <input id="rc-ref" v-model="r.form.reference" class="mono" />
        </FormField>
      </template>

      <FormField v-bind="t.fields.amount" for="rc-amount" required class="narrow">
        <MoneyInput id="rc-amount" v-model="r.form.amount" />
      </FormField>
      <FormField v-bind="t.fields.notes" for="rc-notes" full>
        <input id="rc-notes" v-model="r.form.notes" />
      </FormField>
    </div>

    <div class="apps">
      <div class="apps__head">
        <h4 class="form-section">{{ t.invoices }}</h4>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          :disabled="!r.invoices.value.length"
          @click="r.applyOldest"
        >
          <AppIcon name="check" /> {{ t.oldest }}
        </button>
        <HelpTip :text="t.oldestHelp" />
      </div>
      <p v-if="!r.form.partyId" class="apps__empty">{{ t.pickParty }}</p>
      <p v-else-if="r.loadingInvoices.value" class="apps__empty"><AppIcon name="spinner" spin /></p>
      <p v-else-if="!r.invoices.value.length" class="apps__empty">{{ t.noInvoices }}</p>
      <ul v-else class="apps__list">
        <li v-for="inv in r.invoices.value" :key="inv._id" class="app">
          <div class="app__doc">
            <strong class="mono">{{ inv.number }}</strong>
            <span class="app__meta">
              {{ formatDay(inv.date) }} · vence {{ formatDay(inv.dueDate) }}
              <span v-if="inv.dueDate.slice(0, 10) < today" class="app__late">vencida</span>
            </span>
          </div>
          <span class="app__num num">{{ formatMoney(inv.total) }}</span>
          <span class="app__num num"><small>Saldo</small> {{ formatMoney(inv.balance) }}</span>
          <MoneyInput
            :id="`rc-app-${inv._id}`"
            v-model="r.applied.value[inv._id]"
            class="app__input"
            :invalid="(r.applied.value[inv._id] ?? 0) > inv.balance"
            :aria-label="`Abono a ${inv.number}`"
          />
        </li>
      </ul>
      <p class="apps__sum" :class="{ 'is-off': r.diff.value !== 0 }">
        <span
          >{{ t.applied }}:
          <strong class="num">{{ formatMoney(r.appliedTotal.value) }}</strong></span
        >
        <span v-if="r.diff.value > 0"
          >{{ t.pending }}: <strong class="num">{{ formatMoney(r.diff.value) }}</strong></span
        >
        <span v-else-if="r.diff.value < 0"
          >{{ t.over }}: <strong class="num">{{ formatMoney(-r.diff.value) }}</strong></span
        >
        <AppIcon v-else-if="r.appliedTotal.value" name="check-circle" />
      </p>
    </div>

    <EntryPreview :lines="r.entry.value" />
  </FormDialog>
</template>

<style scoped lang="scss">
.apps {
  @include flex(column, stretch, flex-start, 0.5rem);
  margin: 1rem 0;

  &__head {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;

    .form-section {
      flex: 1;
      margin: 0;
    }
  }

  &__empty {
    color: $ink-soft;
    padding: 0.75rem 0;
  }

  &__list {
    @include flex(column, stretch, flex-start, 0);
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid $line;
    border-radius: 8px;
  }

  &__sum {
    @include flex(row, center, flex-end, 1rem);
    flex-wrap: wrap;

    &.is-off {
      color: $danger;
    }
  }
}

.app {
  @include flex(row, center, flex-start, 0.5rem 1rem);
  flex-wrap: wrap;
  padding: 0.6rem 0.75rem;

  & + & {
    border-top: 1px solid $line;
  }

  &__doc {
    @include flex(column, flex-start, flex-start, 0.1rem);
    flex: 1 1 100%;

    @include from('md') {
      flex-basis: 12rem;
    }
  }

  &__meta {
    color: $ink-soft;
    font-size: 0.85rem;
  }

  &__late {
    color: $danger;
    margin-left: 0.35rem;
  }

  &__num {
    flex: 1 1 6rem;
  }

  &__input {
    flex: 1 1 8rem;
    max-width: 10rem;
  }
}
</style>
