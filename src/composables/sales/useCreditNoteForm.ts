import { computed, reactive, ref } from 'vue'
import { salesService, type CreditNote, type SalesInvoice } from '@/services/sales.service'
import { roundQty } from '@/utils/money'
import { todayISO } from '@/utils/format'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'
import { lineSubtotal, saleTotals } from './saleMath'

export interface NcLine {
  productId: string
  code: string
  name: string
  sold: number
  /** Lo que queda por devolver (vendido − devuelto en NC vigentes con devolución). */
  left: number
  qty: number | null
  unitPrice: number | null
  discount: number | null
  vatRate: number
}

/**
 * Nota de crédito sobre una factura: líneas limitadas a lo vendido. Con
 * devolución, la cantidad no pasa de lo que queda por devolver (el API
 * valida lo mismo); en ningún caso el total pasa del saldo de la factura.
 */
export function useCreditNoteForm(onSaved: (note: CreditNote) => void) {
  const form = reactive({ partyId: '', invoiceId: '', date: todayISO(), reason: '', returnsStock: true })
  const invoice = ref<SalesInvoice | null>(null)
  const lines = ref<NcLine[]>([])
  const saving = ref(false)
  const error = ref('')

  async function pickInvoice(inv: SalesInvoice | null) {
    invoice.value = inv
    lines.value = []
    if (!inv) return
    const prev = await salesService.list<CreditNote>('credit-notes', { invoiceId: inv._id, limit: 500 }).catch((e: ApiError) => {
      error.value = e.message
      return { items: [] as CreditNote[] }
    })
    const returned = new Map<string, number>()
    for (const n of prev.items.filter((n) => n.status === 'vigente' && n.returnsStock)) {
      for (const l of n.lines) returned.set(l.productId, (returned.get(l.productId) ?? 0) + l.qty)
    }
    const byProduct = new Map<string, NcLine>()
    for (const l of inv.lines) {
      const cur = byProduct.get(l.productId)
      if (cur) cur.sold = roundQty(cur.sold + l.qty)
      else byProduct.set(l.productId, { productId: l.productId, code: l.code, name: l.name, sold: l.qty, left: 0, qty: null, unitPrice: l.unitPrice, discount: null, vatRate: l.vatRate })
    }
    lines.value = [...byProduct.values()].map((l) => ({ ...l, left: roundQty(l.sold - (returned.get(l.productId) ?? 0)) }))
  }

  const filled = computed(() => lines.value.filter((l) => l.qty))
  const totals = computed(() => saleTotals(filled.value))
  const tooMuch = (l: NcLine) => form.returnsStock && (l.qty ?? 0) > l.left

  async function save() {
    error.value = ''
    if (!invoice.value) return (error.value = t.creditNotes.pickInvoice)
    if (!filled.value.length) return (error.value = t.creditNotes.noLines)
    if (filled.value.some(tooMuch)) return (error.value = t.creditNotes.tooMuch)
    if (filled.value.some((l) => lineSubtotal(l) < 0)) return (error.value = t.creditNotes.noLines)
    if (totals.value.total > invoice.value.balance) return (error.value = t.creditNotes.overBalance)
    saving.value = true
    try {
      const note = await salesService.createCreditNote({
        invoiceId: invoice.value._id,
        date: form.date,
        reason: form.reason.trim(),
        returnsStock: form.returnsStock,
        lines: filled.value.map((l) => ({ productId: l.productId, qty: l.qty!, unitPrice: l.unitPrice ?? 0, discount: l.discount ?? 0 })),
      })
      onSaved(note)
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      saving.value = false
    }
  }

  return { form, invoice, lines, totals, tooMuch, pickInvoice, save, saving, error }
}
