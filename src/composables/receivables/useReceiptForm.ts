import { computed, reactive, ref, watch } from 'vue'
import {
  receivablesService,
  type OpenInvoice,
  type ReceiptMethod,
} from '@/services/receivables.service'
import { useCatalogStore } from '@/stores/catalog'
import { cxc } from '@/config/copy/cxc'
import { todayISO } from '@/utils/format'
import { sumCents } from '@/utils/money'
import type { EntryLine } from '@/components/documents/lines'
import type { ApiError } from '@/types'
import { applyOldestFirst } from './allocate'

const blank = () => ({
  partyId: '',
  date: todayISO(),
  method: 'DEPOSITO' as ReceiptMethod,
  bankAccountId: '',
  reference: '',
  amount: null as number | null,
  check: { number: '', bank: '', dueDate: '' },
  notes: '',
})

/** Nuevo cobro: cliente → sus facturas con saldo → medio, valor y abono a cada factura. */
export function useReceiptForm(onSaved: () => void) {
  const catalog = useCatalogStore()
  const form = reactive(blank())
  const invoices = ref<OpenInvoice[]>([])
  const applied = ref<Record<string, number | null>>({})
  const loadingInvoices = ref(false)
  const saving = ref(false)
  const error = ref('')

  const isCheck = computed(() => form.method === 'CHEQUE_POSFECHADO')
  const bankKind = computed(() => (form.method === 'EFECTIVO' ? 'caja' : 'banco'))
  const appliedTotal = computed(() => sumCents(invoices.value, (i) => applied.value[i._id]))
  const diff = computed(() => (form.amount ?? 0) - appliedTotal.value)

  async function loadInvoices() {
    invoices.value = []
    applied.value = {}
    if (!form.partyId) return
    loadingInvoices.value = true
    try {
      const res = await receivablesService.openInvoices({ partyId: form.partyId })
      invoices.value = res.items.sort(
        (a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number),
      )
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      loadingInvoices.value = false
    }
  }
  watch(() => form.partyId, loadInvoices)
  // Cambiar de banco a caja deja una cuenta que el API rechazaría.
  watch(bankKind, () => (form.bankAccountId = ''))

  function applyOldest() {
    if (form.amount == null) form.amount = sumCents(invoices.value, (i) => i.balance)
    applied.value = applyOldestFirst(form.amount, invoices.value)
  }

  const entry = computed<EntryLine[]>(() => {
    const amount = form.amount ?? 0
    const accounts = catalog.settings?.accounts
    const bank = catalog.bankAccounts.find((b) => b._id === form.bankAccountId)
    const debit = isCheck.value ? accounts?.postdatedChecks : bank?.accountCode
    return [
      {
        accountCode: debit ?? '',
        accountName: isCheck.value ? 'Cheques posfechados' : bank?.name,
        debit: amount,
        credit: 0,
      },
      { accountCode: accounts?.customers ?? '', accountName: 'Clientes', debit: 0, credit: amount },
    ]
  })

  function validate(): string | null {
    if (!form.partyId) return 'Elige el cliente'
    if (!form.amount || form.amount <= 0) return 'Escribe el valor del cobro'
    if (!isCheck.value && !form.bankAccountId)
      return `Elige ${bankKind.value === 'caja' ? 'la caja' : 'el banco'}`
    if (
      isCheck.value &&
      (!form.check.number.trim() || !form.check.bank.trim() || !form.check.dueDate)
    )
      return 'Completa los datos del cheque'
    for (const inv of invoices.value) {
      if ((applied.value[inv._id] ?? 0) > inv.balance)
        return `El abono a ${inv.number} supera su saldo`
    }
    if (appliedTotal.value === 0) return 'Aplica el cobro a una o varias facturas'
    if (diff.value !== 0) return cxc.receipts.mismatch
    return null
  }

  async function submit() {
    error.value = validate() ?? ''
    if (error.value) return
    saving.value = true
    try {
      await receivablesService.createReceipt({
        partyId: form.partyId,
        date: form.date,
        method: form.method,
        bankAccountId: isCheck.value ? undefined : form.bankAccountId,
        reference: form.reference,
        amount: form.amount!,
        applications: invoices.value
          .filter((i) => (applied.value[i._id] ?? 0) > 0)
          .map((i) => ({ invoiceId: i._id, amount: applied.value[i._id]! })),
        check: isCheck.value ? { ...form.check } : undefined,
        notes: form.notes,
      })
      onSaved()
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      saving.value = false
    }
  }

  function reset() {
    Object.assign(form, blank())
    error.value = ''
    catalog.ensure('settings')
    catalog.ensure('bankAccounts')
  }

  return {
    form,
    invoices,
    applied,
    loadingInvoices,
    saving,
    error,
    isCheck,
    bankKind,
    appliedTotal,
    diff,
    entry,
    applyOldest,
    submit,
    reset,
  }
}
