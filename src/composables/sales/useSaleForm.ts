import { computed, reactive, ref, watch } from 'vue'
import { salesService, type SaleBody } from '@/services/sales.service'
import { useUserStore } from '@/stores/user'
import { todayISO } from '@/utils/format'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError, Party, Product } from '@/types'
import { lineSubtotal, saleTotals } from './saleMath'

/** Línea en edición. Montos en centavos; `product` guarda precios e IVA para recalcular al cambiar de lista. */
export interface FormLine {
  productId: string
  product: Product | null
  qty: number | null
  unitPrice: number | null
  discount: number | null
  vatRate: number
}

export const blankLine = (): FormLine => ({ productId: '', product: null, qty: null, unitPrice: null, discount: null, vatRate: 0 })

/**
 * Cabecera + líneas de factura o proforma: bodega por defecto la del
 * usuario, el cliente autollena vendedor/crédito/lista, el precio sale de
 * la lista y el stock de la bodega se consulta para avisar en cada línea.
 */
export function useSaleForm(submit: (body: SaleBody) => Promise<void>) {
  const user = useUserStore()
  const head = reactive({
    warehouseId: user.user?.warehouseId ?? '',
    partyId: '',
    date: todayISO(),
    sellerName: '',
    creditDays: 0 as number | null,
    priceList: 'GENERAL',
    paymentMethod: '20',
    notes: '',
    orderRef: '',
  })
  const lines = ref<FormLine[]>([blankLine()])
  const stock = ref(new Map<string, number>())
  const saving = ref(false)
  const error = ref('')

  watch(
    () => head.warehouseId,
    async (id) => {
      stock.value = new Map()
      if (!id) return
      try {
        stock.value = await salesService.stock(id)
      } catch {
        // Sin permiso o sin red: la factura igual se graba y el API valida el stock.
      }
    },
    { immediate: true },
  )

  const priceOf = (p: Product | null) => p?.prices.find((x) => x.list === head.priceList)?.price ?? null

  function pickParty(p: Party | null) {
    if (!p) return
    head.sellerName = p.customer?.sellerName ?? ''
    head.creditDays = p.customer?.creditDays ?? 0
    head.priceList = p.customer?.priceList || 'GENERAL'
  }

  function pickProduct(line: FormLine, p: Product | null) {
    line.product = p
    line.vatRate = p?.vatRate ?? 0
    line.unitPrice = priceOf(p)
  }

  // Cambiar la lista repone los precios de las líneas que tienen precio en esa lista.
  watch(
    () => head.priceList,
    () => lines.value.forEach((l) => (l.unitPrice = priceOf(l.product) ?? l.unitPrice)),
  )

  const filled = computed(() => lines.value.filter((l) => l.productId && l.qty))
  const totals = computed(() => saleTotals(filled.value))
  const stockOf = (l: FormLine) => (l.product?.controlsStock && head.warehouseId ? (stock.value.get(l.productId) ?? 0) : null)
  const short = (l: FormLine) => {
    const s = stockOf(l)
    return s != null && (l.qty ?? 0) > s
  }

  async function save() {
    error.value = ''
    if (!filled.value.length || filled.value.some((l) => l.unitPrice == null || lineSubtotal(l) < 0)) {
      error.value = t.invoices.noLines
      return
    }
    saving.value = true
    try {
      await submit({
        ...head,
        creditDays: Number(head.creditDays) || 0,
        lines: filled.value.map((l) => ({ productId: l.productId, qty: l.qty!, unitPrice: l.unitPrice!, discount: l.discount ?? 0 })),
      })
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      saving.value = false
    }
  }

  return { head, lines, totals, stockOf, short, pickParty, pickProduct, save, saving, error }
}

export type SaleForm = ReturnType<typeof useSaleForm>
