import { computed, reactive, ref } from 'vue'
import { defaultStockFilters, stockParams } from '@/components/inventory/stockFilters'
import { useReport } from './useReport'
import { inventoryService } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'
import { useToastStore } from '@/stores/toast'
import { roundQty } from '@/utils/money'
import { todayISO } from '@/utils/format'
import type { ApiError } from '@/types'

/**
 * Toma física: la hoja (saldo en unidad de control y de compra, conteo en
 * blanco) y la captura de conteos. "Ajustar" manda solo lo contado: el API
 * graba un ingreso con los sobrantes y un egreso con los faltantes.
 */
export function usePhysicalCount() {
  const t = copy.count
  const toast = useToastStore()
  const filters = reactive(defaultStockFilters())
  const mode = ref<'sheet' | 'capture'>('sheet')
  const report = useReport(
    () => inventoryService.physicalCount(stockParams(filters)),
    () => (filters.warehouseId ? null : copy.common.warehouseRequired),
  )

  const rows = computed(() => report.data?.items ?? [])
  const counted = computed(() => rows.value.filter((r) => r.count != null))
  const diffOf = (r: { qty: number; count: number | null }) => (r.count == null ? null : roundQty(r.count - r.qty))
  const withDiff = computed(() => counted.value.filter((r) => diffOf(r) !== 0).length)

  const adjust = reactive({ open: false, saving: false, error: '', date: todayISO(), responsible: '' })

  function askAdjust() {
    if (!counted.value.length) return toast.error(t.noCounts)
    adjust.error = ''
    adjust.open = true
  }

  async function confirmAdjust() {
    if (!report.data) return
    adjust.saving = true
    adjust.error = ''
    try {
      const res = await inventoryService.adjust({
        warehouseId: report.data.warehouse._id,
        date: adjust.date,
        responsible: adjust.responsible.trim(),
        counts: counted.value.map((r) => ({ productId: r.productId, count: r.count! })),
      })
      const docs = [res.ingreso, res.egreso].filter(Boolean).map((d) => `${copy.types[d!.type]} #${d!.number}`)
      toast.success(`${t.adjusted}: ${docs.join(' · ')}`)
      adjust.open = false
      await report.run()
    } catch (e) {
      adjust.error = (e as ApiError).message
    } finally {
      adjust.saving = false
    }
  }

  return { filters, mode, report, rows, counted, withDiff, diffOf, adjust, askAdjust, confirmAdjust }
}
