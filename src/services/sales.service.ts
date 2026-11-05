import APIBase from './httpBase'
import type { ListParams } from './catalog.service'
import type { Paginated } from '@/types'
import type { EntryLine } from '@/components/documents/lines'

/**
 * Facturación (`/api/sales/*`). Tipos espejo de los modelos del back
 * (salesInvoice/CreditNote/DebitNote/Proforma). MONTOS EN CENTAVOS.
 */
export interface SaleLine {
  productId: string
  code: string
  name: string
  groupId: string
  qty: number
  unitPrice: number
  discount: number
  vatRate: number
  subtotal: number
  vat: number
}

export interface Totals {
  subtotal0: number
  subtotalVat: number
  discount: number
  vat: number
  total: number
}

export interface SriFields {
  accessKey: string
  sriStatus: string
  authorizationNumber: string
  authorizationDate: string | null
  sriMessages: string[]
}

interface Customer {
  identification: string
  name: string
  address: string
  email: string
  customerType: string
  parish: string
}

export interface SalesInvoice extends SriFields, Totals {
  _id: string
  number: string
  warehouseId: string
  partyId: string
  customer: Customer
  sellerName: string
  date: string
  creditDays: number
  dueDate: string
  priceList: string
  paymentMethod: string
  notes: string
  orderRef: string
  lines: SaleLine[]
  balance: number
  status: 'vigente' | 'anulado'
  voidReason: string
  journalEntryId: string | null
  createdBy: { name: string }
  movements?: { _id: string; date: string; kind: string; amount: number; description: string }[]
}

export interface CreditNote extends SriFields, Totals {
  _id: string
  number: string
  invoiceId: string
  invoiceNumber: string
  partyId: string
  /** Lo agrega el listado del API (la NC guarda solo partyId). */
  partyName?: string
  customerName?: string
  /** Vendedor del cliente al emitir: la NC se rebaja de sus comisiones. */
  sellerName?: string
  date: string
  reason: string
  returnsStock: boolean
  lines: SaleLine[]
  status: string
}

export interface DebitNote extends SriFields, Totals {
  _id: string
  number: string
  invoiceId: string
  invoiceNumber: string
  partyId: string
  date: string
  reason: string
  vatRate: number
  status: string
}

export interface Proforma extends Totals {
  _id: string
  number: string
  warehouseId: string
  partyId: string
  customer: Customer
  sellerName: string
  date: string
  lines: SaleLine[]
  status: 'abierta' | 'facturada'
  invoiceId: string | null
}

/** Lo que se manda al grabar factura o proforma. */
export interface SaleBody {
  warehouseId: string
  partyId: string
  date: string
  sellerName: string
  creditDays: number
  priceList: string
  paymentMethod: string
  notes: string
  orderRef: string
  lines: { productId: string; qty: number; unitPrice: number; discount: number }[]
}

export type DocKind = 'invoices' | 'credit-notes' | 'debit-notes'
export type RideFormat = 'a4' | 'ticket'
export type ReportType = 'summary' | 'detailed' | 'seller' | 'customer'

export interface ReportRow extends Totals {
  _id: string
  hour: string
  /** "001-001" y "000012190": como los separa el reporte del sistema de hoy. */
  series: string
  sequential: string
  number: string
  customer: string
  identification: string
  sellerName: string
  status: string
  lines?: { code: string; name: string; qty: number; unitPrice: number; discount: number; subtotal: number; vatRate: number }[]
}

export interface SalesReport {
  groups?: { warehouse: string; days: { date: string; rows: ReportRow[]; totals: Totals & { count: number } }[]; totals: Totals & { count: number } }[]
  items?: (Totals & { key: string; name: string; count: number })[]
  totals: Totals & { count: number }
}

export interface TopProduct {
  productId: string
  code: string
  name: string
  qty: number
  value: number
  invoices: number
}

class SalesService extends APIBase {
  async list<T>(kind: DocKind | 'proformas', params: ListParams = {}) {
    return (await this.get<Paginated<T>>(`sales/${kind}`, undefined, { params })).data
  }

  async getInvoice(id: string) {
    return (await this.get<SalesInvoice>(`sales/invoices/${id}`)).data
  }

  async createInvoice(body: SaleBody) {
    return (await this.post<SalesInvoice>('sales/invoices', body, undefined, { timeout: 45000 })).data
  }

  async voidInvoice(id: string, reason: string) {
    return (await this.post<SalesInvoice>(`sales/invoices/${id}/void`, { reason })).data
  }

  /** El SRI puede tardar: espera de autorización de 3 s más la red. */
  async retrySri<T extends SriFields>(kind: DocKind, id: string) {
    return (await this.post<T>(`sales/${kind}/${id}/sri-retry`, {}, undefined, { timeout: 45000 })).data
  }

  /** HTML del RIDE; el front lo pinta en un iframe para imprimir. */
  async ride(kind: DocKind, id: string, format: RideFormat) {
    return (await this.get<string>(`sales/${kind}/${id}/ride`, undefined, { params: { format }, responseType: 'text' })).data
  }

  async createCreditNote(body: { invoiceId: string; date: string; reason: string; returnsStock: boolean; lines: { productId: string; qty: number; unitPrice: number; discount: number }[] }) {
    return (await this.post<CreditNote>('sales/credit-notes', body, undefined, { timeout: 45000 })).data
  }

  async createDebitNote(body: { invoiceId: string; date: string; reason: string; amount: number; vatRate: number }) {
    return (await this.post<DebitNote>('sales/debit-notes', body, undefined, { timeout: 45000 })).data
  }

  async createProforma(body: SaleBody) {
    return (await this.post<Proforma>('sales/proformas', body)).data
  }

  async invoiceProforma(id: string) {
    return (await this.post<SalesInvoice>(`sales/proformas/${id}/invoice`, {}, undefined, { timeout: 45000 })).data
  }

  async report(params: ListParams) {
    return (await this.get<SalesReport>('sales/reports/sales', undefined, { params })).data
  }

  async topProducts(params: ListParams) {
    return (await this.get<{ by: string; items: TopProduct[] }>('sales/reports/top-products', undefined, { params })).data
  }

  /** Saldos de la bodega por producto (para avisar en la línea si no alcanza). */
  async stock(warehouseId: string) {
    const { data } = await this.get<{ items: { productId: string; qty: number }[] }>('inventory/reports/balances', undefined, {
      params: { warehouseId, includeZero: 'true' },
    })
    return new Map(data.items.map((i) => [String(i.productId), i.qty]))
  }

  /** Asiento del documento; solo Contabilidad (y gerencia) tiene acceso: los demás reciben 403. */
  async entry(id: string) {
    return (await this.get<{ number: string; lines: EntryLine[] }>(`accounting/entries/${id}`)).data
  }
}

export const salesService = new SalesService()
