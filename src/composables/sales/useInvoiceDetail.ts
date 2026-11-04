import { onMounted, ref } from 'vue'
import { salesService, type SalesInvoice, type SriFields } from '@/services/sales.service'
import { useToastStore } from '@/stores/toast'
import { facturacion as t } from '@/config/copy/facturacion'
import type { EntryLine } from '@/components/documents/lines'
import type { ApiError } from '@/types'

/** Factura con sus movimientos de cartera, su asiento (si el rol lo puede ver) y la anulación. */
export function useInvoiceDetail(id: string) {
  const toast = useToastStore()
  const invoice = ref<SalesInvoice | null>(null)
  const entry = ref<EntryLine[] | null>(null)
  const loading = ref(true)
  const error = ref('')
  const voidReason = ref('')
  const voiding = ref(false)
  const voidOpen = ref(false)
  const voidError = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      invoice.value = await salesService.getInvoice(id)
      const entryId = invoice.value.journalEntryId
      entry.value = entryId ? await salesService.entry(entryId).then((e) => e.lines, () => null) : null
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      loading.value = false
    }
  }

  function updateSri(doc: SriFields) {
    if (invoice.value) Object.assign(invoice.value, doc)
  }

  async function confirmVoid() {
    voiding.value = true
    voidError.value = ''
    try {
      await salesService.voidInvoice(id, voidReason.value.trim())
      toast.success(t.invoices.voided)
      voidOpen.value = false
      voidReason.value = ''
      await load()
    } catch (e) {
      voidError.value = (e as ApiError).message
    } finally {
      voiding.value = false
    }
  }

  onMounted(load)
  return { invoice, entry, loading, error, load, updateSri, voidReason, voidOpen, voiding, voidError, confirmVoid }
}
