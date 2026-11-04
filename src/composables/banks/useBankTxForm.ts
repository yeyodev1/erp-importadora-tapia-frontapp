import { computed, reactive, ref, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { banksService, type BankTxLine, type BankTxType } from '@/services/banks.service'
import { bancos } from '@/config/copy/bancos'
import { todayISO } from '@/utils/format'
import { sumCents } from '@/utils/money'
import type { EntryLine } from '@/components/documents/lines'
import type { ApiError, BankAccount } from '@/types'

/** Lo que suma a la cuenta; el resto resta (igual que bankTransactions.service del API). */
export const INFLOW: BankTxType[] = ['DEPOSITO', 'NOTA_CREDITO', 'INGRESO_CAJA']
const BANK_ONLY: BankTxType[] = ['DEPOSITO', 'NOTA_DEBITO', 'NOTA_CREDITO', 'CHEQUE']
const CASH_ONLY: BankTxType[] = ['INGRESO_CAJA', 'EGRESO_CAJA']

/** Etiqueta en mayúsculas de la descripción, como la arma el API. */
const HEAD: Record<BankTxType, string> = {
  DEPOSITO: 'DEPÓSITO',
  NOTA_DEBITO: 'NOTA DE DÉBITO',
  NOTA_CREDITO: 'NOTA DE CRÉDITO',
  CHEQUE: 'CHEQUE',
  TRANSFERENCIA: 'TRANSFERENCIA',
  INGRESO_CAJA: 'INGRESO',
  EGRESO_CAJA: 'EGRESO',
}

export const kindFor = (type: BankTxType) =>
  BANK_ONLY.includes(type) ? ('banco' as const) : CASH_ONLY.includes(type) ? ('caja' as const) : undefined

const ofBank = (b: BankAccount) => `${b.kind === 'caja' ? 'de' : 'del'} ${b.name}`

/** Vista previa de la descripción. El número de cheque real lo asigna el API al grabar. */
export function describe(type: BankTxType, bank?: BankAccount, target?: BankAccount, byCheck = false, beneficiary = '', note = '') {
  if (!bank) return ''
  const check = type === 'CHEQUE' || (type === 'TRANSFERENCIA' && byCheck)
  const head = check ? `CHEQUE # ${bank.nextCheck} ${ofBank(bank)}` : `${HEAD[type]} ${ofBank(bank)}`
  const who = beneficiary.trim() || (target && check ? target.name : '')
  return [target && !check ? `${head} a ${target.name}` : head, who, note.trim()].filter(Boolean).join(' - ')
}

/** Asiento que genera la transacción: la línea del banco/caja contra las contrapartidas. */
export function entryOf(type: BankTxType, bank: BankAccount | undefined, target: BankAccount | undefined, amount: number, lines: BankTxLine[], description: string): EntryLine[] {
  if (!bank) return []
  if (type === 'TRANSFERENCIA') {
    if (!target) return []
    return [
      { accountCode: target.accountCode, accountName: target.name, description, debit: amount, credit: 0 },
      { accountCode: bank.accountCode, accountName: bank.name, description, debit: 0, credit: amount },
    ]
  }
  const inflow = INFLOW.includes(type)
  const side = (v: number, debit: boolean) => ({ debit: debit ? v : 0, credit: debit ? 0 : v })
  return [
    { accountCode: bank.accountCode, accountName: bank.name, description, ...side(amount, inflow) },
    ...lines.map((l) => ({ accountCode: l.accountCode, accountName: l.accountName, description: l.description || description, ...side(l.amount ?? 0, !inflow) })),
  ]
}

export function useBankTxForm(onSaved: (id: string) => void) {
  const catalog = useCatalogStore()
  catalog.ensure('bankAccounts')
  const blankLine = (): BankTxLine => ({ accountCode: '', amount: null, costCenter: '', description: '' })
  const form = reactive({
    type: 'CHEQUE' as BankTxType,
    date: todayISO(),
    bankAccountId: '',
    targetBankAccountId: '',
    byCheck: false,
    amount: null as number | null,
    partyId: '',
    beneficiary: '',
    note: '',
    lines: [blankLine()],
  })
  const saving = ref(false)
  const error = ref('')

  const find = (id: string) => catalog.bankAccounts.find((b) => b._id === id)
  const bank = computed(() => find(form.bankAccountId))
  const target = computed(() => find(form.targetBankAccountId))
  const isTransfer = computed(() => form.type === 'TRANSFERENCIA')
  const kind = computed(() => kindFor(form.type))
  const amount = computed(() => (isTransfer.value ? (form.amount ?? 0) : sumCents(form.lines, (l) => l.amount)))
  const description = computed(() => describe(form.type, bank.value, target.value, form.byCheck, form.beneficiary, form.note))
  const entry = computed(() => entryOf(form.type, bank.value, target.value, amount.value, form.lines, description.value))

  // Cambiar de tipo puede dejar elegida una cuenta del otro tipo (caja en un cheque).
  watch(kind, (k) => {
    if (k && bank.value && bank.value.kind !== k) form.bankAccountId = ''
  })
  watch(bank, (b) => b?.kind !== 'banco' && (form.byCheck = false))

  function validate(): string {
    const e = bancos.tx.errors
    if (!form.bankAccountId) return e.bank
    if (isTransfer.value) {
      if (!form.targetBankAccountId) return e.target
      if (!form.amount || form.amount <= 0) return e.amount
    } else if (!form.lines.length || form.lines.some((l) => !l.accountCode || !l.amount || l.amount <= 0)) return e.lines
    if (form.type === 'CHEQUE' && !form.beneficiary.trim()) return e.beneficiary
    return ''
  }

  async function save() {
    error.value = validate()
    if (error.value || saving.value) return
    saving.value = true
    try {
      const tx = await banksService.createTransaction({
        type: form.type,
        date: form.date,
        bankAccountId: form.bankAccountId,
        targetBankAccountId: isTransfer.value ? form.targetBankAccountId : undefined,
        byCheck: isTransfer.value && form.byCheck,
        amount: isTransfer.value ? (form.amount ?? 0) : undefined,
        partyId: form.partyId || undefined,
        beneficiary: form.beneficiary.trim(),
        note: form.note.trim(),
        lines: isTransfer.value
          ? []
          : form.lines.map((l) => ({ accountCode: l.accountCode, amount: l.amount ?? 0, costCenter: l.costCenter, description: l.description })),
      })
      catalog.invalidate('bankAccounts') // el talonario avanzó
      onSaved(tx._id)
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      saving.value = false
    }
  }

  return { form, blankLine, bank, target, isTransfer, kind, amount, description, entry, saving, error, save }
}
