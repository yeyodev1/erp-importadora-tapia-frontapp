import { computed, reactive, ref, watch } from 'vue'
import { receivablesService, type OpenInvoice } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'
import { formatMoney, sumCents } from '@/utils/money'
import { formatDay, todayISO } from '@/utils/format'
import type { ApiError } from '@/types'

export type Tax = 'renta' | 'iva'
export interface WLine {
  tax: Tax
  rate: number
  base: number | null
}

/** Porcentajes que acepta el API (el IVA 50 % existe pero Tapia no lo usa). */
export const RATES: Record<Tax, number[]> = { renta: [1, 1.75, 2], iva: [10, 20, 30, 70, 100] }

/** Igual que percentOf del back: redondeo aritmético a centavos. */
export const pct = (base: number, rate: number) => Math.round((base * rate) / 100)

/** Retención recibida: cliente → factura con saldo → comprobante y líneas de renta/IVA con base sugerida. */
export function useWithholdingForm(onSaved: () => void) {
  const form = reactive({
    partyId: '',
    invoiceId: '',
    date: todayISO(),
    voucherNumber: '',
    authorization: '',
  })
  const lines = ref<WLine[]>([])
  const invoices = ref<OpenInvoice[]>([])
  const saving = ref(false)
  const error = ref('')

  const invoice = computed(() => invoices.value.find((i) => i._id === form.invoiceId))
  const invoiceOptions = computed(() =>
    invoices.value.map((i) => ({
      value: i._id,
      label: i.number,
      hint: `${formatDay(i.date)} · saldo ${formatMoney(i.balance)}`,
    })),
  )
  const suggested = (tax: Tax) =>
    invoice.value
      ? tax === 'renta'
        ? invoice.value.subtotal0 + invoice.value.subtotalVat
        : invoice.value.vat
      : null
  const total = computed(() => sumCents(lines.value, (l) => (l.base ? pct(l.base, l.rate) : 0)))

  watch(
    () => form.partyId,
    async (partyId) => {
      form.invoiceId = ''
      invoices.value = []
      if (!partyId) return
      try {
        invoices.value = (await receivablesService.openInvoices({ partyId })).items
      } catch (e) {
        error.value = (e as ApiError).message
      }
    },
  )
  watch(invoice, () => lines.value.forEach((l) => (l.base = suggested(l.tax))))

  function addLine(tax: Tax) {
    lines.value.push({ tax, rate: RATES[tax][0]!, base: suggested(tax) })
  }

  function validate() {
    if (!invoice.value) return 'Elige la factura'
    if (!form.voucherNumber.trim()) return 'Escribe el número del comprobante'
    if (!lines.value.length) return 'Agrega al menos una línea'
    if (lines.value.some((l) => !l.base)) return 'Cada línea necesita su base'
    if (total.value > invoice.value.balance) return cxc.withholdings.overBalance
    return null
  }

  async function submit() {
    error.value = validate() ?? ''
    if (error.value) return
    saving.value = true
    try {
      await receivablesService.createWithholding({
        ...form,
        voucherNumber: form.voucherNumber.trim(),
        lines: lines.value.map((l) => ({ tax: l.tax, rate: l.rate, base: l.base! })),
      })
      onSaved()
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      saving.value = false
    }
  }

  function reset() {
    Object.assign(form, {
      partyId: '',
      invoiceId: '',
      date: todayISO(),
      voucherNumber: '',
      authorization: '',
    })
    lines.value = []
    error.value = ''
  }

  return { form, lines, invoice, invoiceOptions, total, saving, error, addLine, submit, reset }
}
