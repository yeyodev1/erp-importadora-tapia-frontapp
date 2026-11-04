import APIBase from './httpBase'
import type { ListParams } from './catalog.service'
import type { Paginated } from '@/types'

/** Tipos de `/api/inventory/*`. Cantidades en unidad de control; `unitCost` en DÓLARES (6 decimales); totales en centavos. */
export const TRANSACTION_TYPES = [
  'INVENTARIO_INICIAL',
  'INGRESO_COMPRA',
  'INGRESO_IMPORTACION',
  'INGRESO_AJUSTE',
  'EGRESO_AJUSTE',
  'TRANSFERENCIA',
] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

type Ref = { _id: string; code: string; name: string }
type PartyRef = { _id: string; identification: string; name: string }

export interface InventoryLine {
  productId: string | (Ref & { unit: string })
  qty: number
  unitCost: number
  totalCost: number
  lot: string
}

export interface InventoryTransaction {
  _id: string
  number: string
  type: TransactionType
  warehouseId: Ref
  targetWarehouseId: Ref | null
  date: string
  partyId: PartyRef | null
  responsible: string
  costCenter: string
  containers: number
  lines: InventoryLine[]
  totalCost: number
  description: string
  status: 'contabilizado' | 'anulado'
  journalEntryId: string | null
  voidReason: string
  voidedAt: string | null
  createdBy: { name: string }
}

export interface TransactionBody {
  type: TransactionType
  warehouseId: string
  targetWarehouseId?: string | null
  date: string
  partyId?: string | null
  responsible?: string
  costCenter?: string
  containers?: number
  description?: string
  lines: { productId: string; qty: number; unitCost?: number }[]
}

export interface KardexSide {
  qty: number
  unitCost: number
  total: number
}

export interface KardexRow {
  _id: string
  voucher: string
  type: string
  date: string | null
  inbound: KardexSide | null
  outbound: KardexSide | null
  balance: KardexSide
  party: string
}

export interface Kardex {
  product: Ref & { unit: string }
  warehouse: Ref
  opening: KardexSide
  items: KardexRow[]
  closing: KardexSide
  count: number
}

export interface StockRow {
  productId: string
  code: string
  name: string
  group: string
  subgroup: string
  unit: string
  purchaseUnit: { name: string; factor: number }
  minQty: number
  qty: number
  avgCost?: number
  totalValue?: number
  missing?: number
}

export interface CountRow {
  productId: string
  code: string
  name: string
  group: string
  subgroup: string
  unit: string
  qty: number
  purchaseUnit: string
  purchaseQty: number
  count: number | null
}

export interface NegativeRow {
  _id: string
  date: string
  type: string
  qty: number
  balanceQty: number
  productId: Ref & { unit: string }
  warehouseId: Ref
  source: { docNumber: string; docType: string }
}

export interface JournalEntry {
  _id: string
  number?: string
  lines: { accountCode: string; accountName: string; description?: string; debit: number; credit: number }[]
}

export interface StockParams {
  warehouseId: string
  groupId?: string
  subgroup?: string
  supplierId?: string
}

type WithWarehouse<T> = { warehouse: Ref; items: T[] }

class InventoryService extends APIBase {
  private async read<T>(endpoint: string, params: object = {}) {
    const { data } = await this.get<T>(`inventory/${endpoint}`, undefined, { params })
    return data
  }

  list(params: ListParams) {
    return this.read<Paginated<InventoryTransaction>>('transactions', params)
  }

  getOne(id: string) {
    return this.read<InventoryTransaction>(`transactions/${id}`)
  }

  async create(body: TransactionBody) {
    const { data } = await this.post<InventoryTransaction>('inventory/transactions', body)
    return data
  }

  async voidTransaction(id: string, reason: string) {
    const { data } = await this.post<InventoryTransaction>(`inventory/transactions/${id}/void`, { reason })
    return data
  }

  kardex(params: { productId: string; warehouseId: string; from?: string; to?: string }) {
    return this.read<Kardex>('reports/kardex', params)
  }

  balances(params: StockParams & { valued?: boolean; includeZero?: boolean }) {
    return this.read<WithWarehouse<StockRow> & { total?: number }>('reports/balances', params)
  }

  physicalCount(params: StockParams) {
    return this.read<WithWarehouse<CountRow>>('reports/physical-count', params)
  }

  async adjust(body: { warehouseId: string; date: string; responsible?: string; counts: { productId: string; count: number }[] }) {
    const { data } = await this.post<{ ingreso: InventoryTransaction | null; egreso: InventoryTransaction | null }>(
      'inventory/reports/physical-count/adjust',
      body,
    )
    return data
  }

  negatives(params: { warehouseId?: string; from?: string; to?: string }) {
    return this.read<{ items: NegativeRow[] }>('reports/negatives', params)
  }

  belowMinimum(params: StockParams) {
    return this.read<WithWarehouse<StockRow>>('reports/below-minimum', params)
  }

  /** El asiento vive en contabilidad: solo los roles que la ven pueden leerlo (bodega no). */
  async entry(id: string) {
    const { data } = await this.get<JournalEntry>(`accounting/entries/${id}`)
    return data
  }
}

export const inventoryService = new InventoryService()
