<script setup lang="ts">
import { lineHelp } from '@/config/copy/lineHelp'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/ui/FormField.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import BankAccountPicker from '@/components/pickers/BankAccountPicker.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import type { LineColumn } from '@/components/documents/lines'
import { kindFor, useBankTxForm } from '@/composables/banks/useBankTxForm'
import { BANK_TX_TYPES, type BankTxLine } from '@/services/banks.service'
import { useToastStore } from '@/stores/toast'
import { bancos } from '@/config/copy/bancos'
import { formatMoney } from '@/utils/money'
import { site } from '@/config/site'
import { accountingScreens } from '@/config/copy/accountingScreens'
import type { Account, Party } from '@/types'

const t = bancos.tx
const router = useRouter()
const toast = useToastStore()
const { form, blankLine, bank, isTransfer, kind, amount, description, entry, saving, error, save } = useBankTxForm((id) => {
  toast.success(t.saved)
  router.push({ name: 'BankTransactionDetail', params: { id } })
})

// "Tipo: Caja / Banco" del sistema anterior: decide qué transacciones se ofrecen.
const tipo = ref<'banco' | 'caja'>('banco')
const tipoOptions = (['caja', 'banco'] as const).map((v) => ({ value: v, label: site.catalogs.banks.kinds[v] }))
const typeOptions = computed(() =>
  BANK_TX_TYPES.filter((v) => (kindFor(v) ?? tipo.value) === tipo.value).map((v) => ({ value: v, label: bancos.types[v].label, hint: bancos.types[v].help })),
)
watch(tipo, () => {
  if (!typeOptions.value.some((o) => o.value === form.type)) form.type = typeOptions.value[0]!.value
})
// Mismo orden que la grilla de asiento de hoy: Código/Nombre | Valor | Centro costo | Descripción.
const lineCols: LineColumn<BankTxLine>[] = [
  { key: 'accountCode', label: t.lineCols.account, type: 'account', width: '36%', help: lineHelp.account },
  { key: 'amount', label: t.lineCols.amount, type: 'money', total: true, width: '9rem', help: lineHelp.amount },
  { key: 'costCenter', label: t.lineCols.costCenter, type: 'text', width: '7rem', help: lineHelp.costCenter },
  { key: 'description', label: t.lineCols.description, type: 'text', help: lineHelp.detail },
]

function onParty(p: Party | null) {
  if (p && !form.beneficiary.trim()) form.beneficiary = p.name
}
const onAccount = (line: BankTxLine, a: Account | null) => (line.accountName = a?.name)
const issuesCheck = computed(() => bank.value?.kind === 'banco' && (form.type === 'CHEQUE' || (isTransfer.value && form.byCheck)))
</script>

<template>
  <section>
    <PageHeader :title="t.newTitle" :subtitle="t.newSubtitle">
      <RouterLink :to="{ name: 'BankTransactions' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.back }}</RouterLink>
      <span class="txf__link">
        <RouterLink :to="{ name: 'SupplierAdvances' }" class="btn btn--ghost">{{ t.devLink }}</RouterLink>
        <HelpTip :text="t.devLinkHelp" :label="t.devLink" />
      </span>
      <span class="txf__link">
        <RouterLink :to="{ name: 'SupplierPayments' }" class="btn btn--ghost">{{ t.cxpLink }}</RouterLink>
        <HelpTip :text="t.cxpLinkHelp" :label="t.cxpLink" />
      </span>
    </PageHeader>

    <form class="txf" novalidate @submit.prevent="save">
      <LockedDateBanner :date="form.date" />
      <div class="panel panel--pad">
        <div class="form-grid">
          <FormField v-bind="t.fields.kind" class="narrow">
            <BaseSegmented v-model="tipo" :options="tipoOptions" :label="t.fields.kind.label" />
          </FormField>
          <FormField v-bind="t.fields.type" for="tx-type" required>
            <BaseCombobox id="tx-type" v-model="form.type" :options="typeOptions" />
          </FormField>
          <FormField v-bind="t.fields.bank" for="tx-bank" required>
            <BankAccountPicker id="tx-bank" v-model="form.bankAccountId" :kind="kind ?? tipo" :invalid="error === t.errors.bank" />
          </FormField>
          <FormField v-bind="t.fields.date" for="tx-date" required class="narrow">
            <BaseDatePicker id="tx-date" v-model="form.date" />
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
          <AlertBanner v-if="issuesCheck" level="info" icon="wallet" class="full" :title="t.checkTitle(bank?.nextCheck)" :message="t.checkMessage" />
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

      <section class="txf__entry">
        <p class="form-section">{{ t.entryTitle }} <HelpTip :text="t.entryHelp" :label="t.entryTitle" /></p>
        <EntryPreview :lines="entry" />
      </section>

      <p v-if="error" class="txf__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>
      <div class="txf__actions">
        <span class="txf__mayor">{{ accountingScreens.mayorizedNote }} <HelpTip :text="accountingScreens.mayorized.help" :label="accountingScreens.mayorized.label" /></span>
        <span class="txf__total num">{{ t.fields.amount.label }}: <strong>{{ formatMoney(amount) }}</strong></span>
        <BaseButton type="submit" variant="primary" icon="check" :loading="saving">{{ t.save }}</BaseButton>
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

  &__entry {
    @include flex(column, stretch, flex-start, 0.5rem);
  }

  &__mayor {
    @include flex(row, center, flex-start, 0.35rem);
    margin-right: auto;
    font-size: 0.85rem;
    color: $ink-soft;
  }
}

.txf__link {
  @include flex(row, center, flex-start, 0.25rem);
}
</style>
