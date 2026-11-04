import { lineHelp } from '@/config/copy/lineHelp'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { LineColumn } from '@/components/documents/lines'
import { inventoryService, type TransactionType } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'
import { formatQty } from '@/utils/money'
import { todayISO } from '@/utils/format'
import type { ApiError, Product } from '@/types'

export interface TxLine {
  productId: string
  qty: number | null
  /** Centavos por unidad de control (MoneyInput); al API va en dólares. */
  // shortcut: MoneyInput limita el costo unitario a 2 decimales (el API acepta 6); pasar a un input de 4-6 decimales si piden costos por libra más finos.
  unitCost: number | null
  product: Product | null
}

/** Ingresos con costo propio (obligatorio). El ingreso por ajuste lo acepta opcional; el resto va al promedio. */
const COSTED: TransactionType[] = ['INVENTARIO_INICIAL', 'INGRESO_COMPRA', 'INGRESO_IMPORTACION']
const SUPPLIER: TransactionType[] = ['INGRESO_COMPRA', 'INGRESO_IMPORTACION']

export const newLine = (): TxLine => ({ productId: '', qty: null, unitCost: null, product: null })
const lineTotal = (l: TxLine) => Math.round((l.qty ?? 0) * (l.unitCost ?? 0))
// Cantidad también en unidad de compra: 6,613 libras = 66.13 sacos.
const inPurchase = (l: TxLine) => {
  const u = l.product?.purchaseUnit
  return l.qty && u && u.factor !== 1 ? `${formatQty(l.qty / u.factor)} ${u.name}` : ''
}

export function useTransactionForm() {
  const t = copy.transactions
  const c = copy.common
  const router = useRouter()
  const toast = useToastStore()
  const user = useUserStore()

  const doc = reactive({
    type: 'INGRESO_COMPRA' as TransactionType,
    warehouseId: user.user?.warehouseId ?? '',
    targetWarehouseId: '',
    date: todayISO(),
    partyId: '',
    responsible: '',
    costCenter: '',
    containers: 0,
    description: '',
    lines: [newLine()] as TxLine[],
  })
  const saving = ref(false)
  const error = ref('')

  const isTransfer = computed(() => doc.type === 'TRANSFERENCIA')
  const needsCost = computed(() => COSTED.includes(doc.type))
  const showsCost = computed(() => needsCost.value || doc.type === 'INGRESO_AJUSTE')
  const usesSupplier = computed(() => SUPPLIER.includes(doc.type))
  watch(isTransfer, (v) => !v && (doc.targetWarehouseId = ''))

  const columns = computed<LineColumn<TxLine>[]>(() => [
    { key: 'productId', label: c.product, type: 'product', width: '34%', help: lineHelp.product },
    { key: 'unit', label: c.unit, type: 'readonly', value: (l) => l.product?.unit ?? '', width: '6rem', help: lineHelp.unit },
    { key: 'qty', label: c.qty, type: 'qty', total: true, width: '9rem', help: lineHelp.qty },
    { key: 'purchase', label: c.purchaseQty, type: 'readonly', value: inPurchase, width: '9rem', help: lineHelp.purchaseQty },
    ...(showsCost.value
      ? ([
          { key: 'unitCost', label: t.cost, type: 'money', width: '8rem', help: lineHelp.unitCost },
          { key: 'total', label: t.lineTotal, type: 'readonly', format: 'money', total: true, value: lineTotal, width: '8rem', help: lineHelp.lineTotal },
        ] as LineColumn<TxLine>[])
      : []),
  ])

  const filled = computed(() => doc.lines.filter((l) => l.productId && l.qty))

  function validate(): string | null {
    const e = t.errors
    if (!doc.warehouseId) return e.warehouse
    if (isTransfer.value && (!doc.targetWarehouseId || doc.targetWarehouseId === doc.warehouseId)) return e.target
    if (doc.type === 'INGRESO_COMPRA' && !doc.partyId) return e.party
    if (!filled.value.length) return e.lines
    if (needsCost.value && filled.value.some((l) => !l.unitCost)) return e.cost
    return null
  }

  async function save() {
    error.value = validate() ?? ''
    if (error.value) return
    saving.value = true
    try {
      const created = await inventoryService.create({
        type: doc.type,
        warehouseId: doc.warehouseId,
        targetWarehouseId: isTransfer.value ? doc.targetWarehouseId : null,
        date: doc.date,
        partyId: usesSupplier.value ? doc.partyId || null : null,
        responsible: usesSupplier.value ? '' : doc.responsible,
        costCenter: doc.costCenter,
        containers: doc.type === 'INGRESO_IMPORTACION' ? doc.containers : 0,
        description: doc.description,
        lines: filled.value.map((l) => ({
          productId: l.productId,
          qty: l.qty!,
          ...(showsCost.value && l.unitCost != null ? { unitCost: l.unitCost / 100 } : {}),
        })),
      })
      toast.success(`${t.saved}: ${copy.types[created.type]} #${created.number}`)
      router.replace({ name: 'InventoryTransactionDetail', params: { id: created._id } })
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      saving.value = false
    }
  }

  return { doc, columns, saving, error, isTransfer, showsCost, usesSupplier, filled, lineTotal, save }
}
