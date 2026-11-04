<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import FormField from '@/components/ui/FormField.vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import AccountPicker from '@/components/pickers/AccountPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import type { BankMovement, MatchProposal, MatchResult, StatementLine } from '@/services/banks.service'
import { bancos } from '@/config/copy/bancos'
import { formatDay } from '@/utils/format'
import { formatMoney } from '@/utils/money'
import type { ApiError } from '@/types'

/** Propuestas de cruce y lo que quedó sin pareja a cada lado. Nada de esto graba salvo "Registrar". */
const props = defineProps<{
  result: MatchResult
  accepted: Set<string>
  running: boolean
  register: (line: StatementLine, accountCode: string) => Promise<void>
}>()
const emit = defineEmits<{ toggle: [id: string, on: boolean]; all: [on: boolean]; confirm: [] }>()

const t = bancos.statement
const c = bancos.rec.cols
const signed = (amount: number, dir: 'in' | 'out') => (dir === 'out' ? -amount : amount)
const lineText = (l: StatementLine) => [l.reference, l.description].filter(Boolean).join(' · ')

const proposalCols: Column<MatchProposal>[] = [
  { key: 'accept', label: t.accept, screenOnly: true, width: '5rem' },
  { key: 'rule', label: t.ruleLabel, help: t.ruleHelp, value: (p) => t.rules[p.rule] },
  { key: 'mov', label: t.colBook, value: (p) => `${formatDay(p.movement.date)} · ${p.movement.description}` },
  { key: 'line', label: t.colStatement, value: (p) => `${formatDay(p.line.date)} · ${lineText(p.line)}` },
  { key: 'amount', label: c.amount, format: 'money', value: (p) => signed(p.line.amount, p.line.direction) },
]
const lineCols: Column<StatementLine>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'text', label: c.description, value: lineText },
  { key: 'amount', label: c.amount, format: 'money', value: (l) => signed(l.amount, l.direction) },
  { key: 'action', label: t.actionLabel, screenOnly: true },
]
const movCols: Column<BankMovement>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'type', label: c.type, value: (m) => bancos.movType(m.type) },
  { key: 'checkNumber', label: c.check },
  { key: 'description', label: c.description },
  { key: 'amount', label: c.amount, format: 'money', value: (m) => signed(m.amount, m.direction) },
]

const noteLine = ref<StatementLine | null>(null)
const accountCode = ref('')
const saving = ref(false)
const noteError = ref('')

function openNote(line: StatementLine) {
  noteLine.value = line
  accountCode.value = ''
  noteError.value = ''
}

async function saveNote() {
  if (!noteLine.value) return
  if (!accountCode.value) return (noteError.value = t.noteAccount.label)
  saving.value = true
  try {
    await props.register(noteLine.value, accountCode.value)
    noteLine.value = null
  } catch (e) {
    noteError.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="sr">
    <div class="sr__head">
      <h3>{{ t.proposals }} ({{ accepted.size }}/{{ result.proposals.length }})</h3>
      <button type="button" class="btn btn--ghost btn--sm" :disabled="!result.proposals.length" @click="emit('all', true)">{{ t.acceptAll }}</button>
      <button type="button" class="btn btn--ghost btn--sm" :disabled="!accepted.size" @click="emit('all', false)">{{ t.discardAll }}</button>
    </div>
    <DataTable :columns="proposalCols" :rows="result.proposals" row-key="movementId" :exportable="false">
      <template #cell-accept="{ row }">
        <BaseSwitch class="sr__switch" :label="t.accept" :model-value="accepted.has(row.movementId)" @update:model-value="emit('toggle', row.movementId, $event)" />
      </template>
      <template #cell-rule="{ row }"><BaseBadge :tone="row.rule === 'cheque' ? 'info' : 'neutral'">{{ t.rules[row.rule] }}</BaseBadge></template>
      <template #empty><p class="sr__empty">{{ t.noProposals }}</p></template>
    </DataTable>
    <div class="sr__actions">
      <BaseButton variant="primary" icon="check" :loading="running" :disabled="!accepted.size" @click="emit('confirm')">{{ t.confirm }} ({{ accepted.size }})</BaseButton>
    </div>

    <div class="sr__head">
      <h3>{{ t.unmatchedLines }} ({{ result.unmatchedLines.length }})</h3>
      <HelpTip :text="t.unmatchedLinesHelp" />
    </div>
    <DataTable :columns="lineCols" :rows="result.unmatchedLines" row-key="line" :exportable="false">
      <template #cell-action="{ row }">
        <button type="button" class="btn btn--ghost btn--sm" @click="openNote(row)"><AppIcon name="plus" /> {{ t.register(row.direction) }}</button>
      </template>
      <template #empty><p class="sr__empty">{{ t.none }}</p></template>
    </DataTable>

    <div class="sr__head">
      <h3>{{ t.unmatchedMovements }} ({{ result.unmatchedMovements.length }})</h3>
      <HelpTip :text="t.unmatchedMovementsHelp" />
    </div>
    <DataTable :columns="movCols" :rows="result.unmatchedMovements" :exportable="false">
      <template #empty><p class="sr__empty">{{ t.none }}</p></template>
    </DataTable>

    <FormDialog
      :open="!!noteLine"
      :title="noteLine ? t.noteTitle(noteLine.direction) : ''"
      :submit-label="t.noteSave"
      :loading="saving"
      :error="noteError"
      @submit="saveNote"
      @close="noteLine = null"
    >
      <p v-if="noteLine" class="sr__note">
        {{ formatDay(noteLine.date) }} · {{ lineText(noteLine) }} · <strong class="num">{{ formatMoney(noteLine.amount) }}</strong>
      </p>
      <FormField v-bind="t.noteAccount" for="sr-acc" required>
        <AccountPicker id="sr-acc" v-model="accountCode" :invalid="!!noteError && !accountCode" />
      </FormField>
    </FormDialog>
  </div>
</template>

<style scoped lang="scss">
.sr {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__head {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
    margin-top: 0.5rem;

    h3 {
      margin: 0;
      font-size: 1rem;
      flex: 1 1 auto;
    }
  }

  &__switch :deep(.switch__text) {
    @include visually-hidden;
  }

  &__actions {
    @include flex(row, center, flex-end, 0.5rem);
  }

  &__empty,
  &__note {
    margin: 0;
    padding: 0.5rem 0;
    color: $ink-soft;
  }
}
</style>
