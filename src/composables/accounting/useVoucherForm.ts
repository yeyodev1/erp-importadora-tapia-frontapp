import { computed, reactive, ref } from 'vue'
import { accountingService, type EntrySubtype, type JournalEntry } from '@/services/accounting.service'
import { sumCents } from '@/utils/money'
import { todayISO } from '@/utils/format'
import type { Account, ApiError } from '@/types'

/** Línea del comprobante manual. Debe y haber en CENTAVOS (null = vacío). */
export interface VoucherLine {
  accountCode: string
  accountName: string
  requiresCostCenter: boolean
  description: string
  debit: number | null
  credit: number | null
  costCenter: string
  partyId: string
}

export const newVoucherLine = (): VoucherLine => ({
  accountCode: '',
  accountName: '',
  requiresCostCenter: false,
  description: '',
  debit: null,
  credit: null,
  costCenter: '',
  partyId: '',
})

/** Una línea problemática: con valor y sin cuenta, con debe y haber a la vez, o sin centro de costo exigido. */
export function lineProblem(l: VoucherLine): boolean {
  const has = Boolean(l.debit || l.credit)
  if (!has) return false
  if (!l.accountCode || (l.debit && l.credit)) return true
  return l.requiresCostCenter && !l.costCenter.trim()
}

/**
 * Comprobante manual: el formulario solo deja grabar si cuadra (mismo
 * criterio que EntryPreview) y cada línea con valor tiene su cuenta.
 */
export function useVoucherForm() {
  const doc = reactive({
    date: todayISO(),
    subtype: 'asiento_diario' as EntrySubtype,
    description: '',
    lines: [newVoucherLine(), newVoucherLine()],
  })
  const saving = ref(false)
  const error = ref('')

  const debit = computed(() => sumCents(doc.lines, (l) => l.debit))
  const credit = computed(() => sumCents(doc.lines, (l) => l.credit))
  const balanced = computed(() => debit.value > 0 && debit.value === credit.value)
  const incomplete = computed(() => doc.lines.some(lineProblem))
  const canSave = computed(() => balanced.value && !incomplete.value && Boolean(doc.description.trim()) && Boolean(doc.date))

  const preview = computed(() =>
    doc.lines.map((l) => ({ accountCode: l.accountCode, accountName: l.accountName, description: l.description, debit: l.debit ?? 0, credit: l.credit ?? 0 })),
  )

  function pickAccount(line: VoucherLine, account: Account | null) {
    line.accountName = account?.name ?? ''
    line.requiresCostCenter = account?.requiresCostCenter ?? false
  }

  async function save(): Promise<JournalEntry | null> {
    if (!canSave.value || saving.value) return null
    saving.value = true
    error.value = ''
    try {
      return await accountingService.createEntry({
        date: doc.date,
        subtype: doc.subtype,
        description: doc.description.trim(),
        lines: doc.lines
          .filter((l) => l.debit || l.credit)
          .map((l) => ({
            accountCode: l.accountCode,
            debit: l.debit ?? 0,
            credit: l.credit ?? 0,
            costCenter: l.costCenter.trim(),
            partyId: l.partyId || null,
            description: l.description.trim(),
          })),
      })
    } catch (e) {
      error.value = (e as ApiError).message
      return null
    } finally {
      saving.value = false
    }
  }

  return { doc, debit, credit, balanced, incomplete, canSave, preview, saving, error, pickAccount, save }
}
