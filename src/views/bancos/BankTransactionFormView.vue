<script setup lang="ts">
import { lineHelp } from '@/config/copy/lineHelp'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import type { LineColumn } from '@/components/documents/lines'
import { useBankTxForm } from '@/composables/banks/useBankTxForm'
import { BANK_TX_TYPES, type BankTxLine } from '@/services/banks.service'
import { useToastStore } from '@/stores/toast'
import { bancos } from '@/config/copy/bancos'
import { formatMoney } from '@/utils/money'
import type { Account, Party } from '@/types'

const t = bancos.tx
const router = useRouter()
const toast = useToastStore()
const { form, blankLine, bank, isTransfer, kind, amount, description, entry, saving, error, save } = useBankTxForm((id) => {
  toast.success(t.saved)
  router.push({ name: 'BankTransactionDetail', params: { id } })
})

const typeOptions = BANK_TX_TYPES.map((v) => ({ value: v, label: bancos.types[v].label, hint: bancos.types[v].help }))
const lineCols: LineColumn<BankTxLine>[] = [
  { key: 'accountCode', label: t.lineCols.account, type: 'account', width: '36%', help: lineHelp.account },
  { key: 'description', label: t.lineCols.description, type: 'text', help: lineHelp.detail },
  { key: 'costCenter', label: t.lineCols.costCenter, type: 'text', width: '7rem', help: lineHelp.costCenter },
  { key: 'amount', label: t.lineCols.amount, type: 'money', total: true, width: '9rem', help: lineHelp.amount },
]

function onParty(p: Party | null) {
  if (p && !form.beneficiary.trim()) form.beneficiary = p.name
}
const onAccount = (line: BankTxLine, a: Account | null) => (line.accountName = a?.name)
</script>

<template>
  <section>
    <PageHeader :title="t.newTitle" :subtitle="t.newSubtitle">
      <RouterLink :to="{ name: 'BankTransactions' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.back }}</RouterLink>
    </PageHeader>

    <form class="txf" novalidate @submit.prevent="save">
      <div class="panel panel--pad">
        <div class="form-grid">
          <FormField v-bind="t.fields.type" for="tx-type" required>
            <BaseCombobox id="tx-type" v-model="form.type" :options="typeOptions" />
          </FormField>
          <FormField v-bind="t.fields.date" for="tx-date" required>
            <BaseDatePicker id="tx-date" v-model="form.date" />
          </FormField>
          <FormField v-bind="t.fields.bank" for="tx-bank" required>
            <BankAccountPicker id="tx-bank" v-model="form.bankAccountId" :kind="kind" :invalid="error === t.errors.bank" />
          </FormField>
          <template v-if="isTransfer">
            <FormField v-bind="t.fields.target" for="tx-target" required>
              <BankAccountPicker id="tx-target" v-model="form.targetBankAccountId" :invalid="error === t.errors.target" />
            </FormField>
            <FormField v-bind="t.fields.amount" for="tx-amount" required class="narrow">
              <MoneyInput id="tx-amount" v-model="form.amount" :invalid="error === t.errors.amount" />
            </FormField>
            <BaseSwitch v-if="bank?.kind === 'banco'" v-model="form.byCheck" v-bind="t.fields.byCheck" class="full" />
          </template>
          <FormField v-bind="t.fields.party" for="tx-party">
            <PartyPicker id="tx-party" v-model="form.partyId" clearable @pick="onParty" />
          </FormField>
          <FormField v-bind="t.fields.beneficiary" for="tx-ben" :required="form.type === 'CHEQUE'">
            <input id="tx-ben" v-model="form.beneficiary" :placeholder="t.fields.beneficiaryPlaceholder" :aria-invalid="error === t.errors.beneficiary" />
          </FormField>
          <FormField v-bind="t.fields.note" for="tx-note" full>
            <input id="tx-note" v-model="form.note" maxlength="200" :placeholder="t.fields.notePlaceholder" />
          </FormField>
        </div>
        <p class="txf__desc">
          <span class="txf__label">{{ t.fields.description.label }} <HelpTip :text="t.fields.description.help" /></span>
          <span class="mono">{{ description || '—' }}</span>
        </p>
        <p class="txf__note"><AppIcon name="info" /> {{ t.noEdit }}</p>
      </div>

      <div v-if="!isTransfer" class="panel panel--pad">
        <p class="form-section">{{ t.fields.lines.label }} <HelpTip :text="t.fields.lines.help" /></p>
        <DocumentLines v-model="form.lines" :columns="lineCols" :new-line="blankLine" id-prefix="txl" @pick-account="onAccount" />
      </div>

      <EntryPreview :lines="entry" />

      <p v-if="error" class="txf__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>
      <div class="txf__actions">
        <span class="txf__total num">{{ t.fields.amount.label }}: <strong>{{ formatMoney(amount) }}</strong></span>
        <button type="submit" class="btn btn--primary" :disabled="saving">
          <AppIcon :name="saving ? 'spinner' : 'check'" :spin="saving" /> {{ t.save }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped lang="scss">
.txf {
  @include flex(column, stretch, flex-start, 1rem);

  &__desc {
    @include flex(column, flex-start, flex-start, 0.25rem);
    margin: 1rem 0 0;
    padding: 0.6rem 0.75rem;
    background: $sand;
    border-radius: 6px;
  }

  &__label {
    @include flex(row, center, flex-start, 0.35rem);
    font-size: 0.8rem;
    color: $ink-muted;
  }

  &__note {
    @include flex(row, center, flex-start, 0.4rem);
    margin: 0.75rem 0 0;
    font-size: 0.85rem;
    color: $ink-soft;
  }

  &__error {
    @include flex(row, center, flex-start, 0.4rem);
    margin: 0;
    color: $danger;
  }

  &__actions {
    @include flex(row, center, flex-end, 1rem);
    flex-wrap: wrap;
  }
}
</style>
