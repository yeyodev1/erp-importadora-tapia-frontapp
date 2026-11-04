/** Tipos de `/api/receivables/*`. Montos en CENTAVOS; fechas ISO. */
export type ReceiptMethod = 'DEPOSITO' | 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE_POSFECHADO'
export type CheckStatus = 'en_cartera' | 'depositado' | 'acreditado' | 'devuelto'

export interface OpenInvoice {
  _id: string
  number: string
  date: string
  dueDate: string
  partyId: string
  customer: { name: string; identification: string }
  sellerName: string
  subtotal0: number
  subtotalVat: number
  vat: number
  total: number
  balance: number
}

export interface Receipt {
  _id: string
  number: string
  date: string
  partyId: string | { _id: string; name: string; identification: string }
  /** Nombre del cliente, resuelto en el front (el listado del API no lo trae). */
  partyName?: string
  method: ReceiptMethod
  bankAccountId: string | null
  reference: string
  amount: number
  applications: { invoiceId: string; invoiceNumber: string; amount: number }[]
  check?: {
    number: string
    bank: string
    dueDate: string | null
    status: CheckStatus | ''
    returnReason: string
  }
  notes: string
  status: 'vigente' | 'anulado'
  voidReason: string
}

export interface ReceiptBody {
  partyId: string
  date: string
  method: ReceiptMethod
  bankAccountId?: string
  reference?: string
  amount: number
  applications: { invoiceId: string; amount: number }[]
  check?: { number: string; bank: string; dueDate: string }
  notes?: string
}

export interface WithholdingLine {
  tax: 'renta' | 'iva'
  rate: number
  base: number
  amount: number
}

export interface Withholding {
  _id: string
  invoiceId: string
  invoiceNumber: string
  partyId: string
  partyName?: string
  sellerName: string
  date: string
  voucherNumber: string
  authorization: string
  lines: WithholdingLine[]
  total: number
}

export interface WithholdingBody {
  invoiceId: string
  date: string
  voucherNumber: string
  authorization?: string
  lines: { tax: 'renta' | 'iva'; rate: number; base: number }[]
}

export interface CheckStep {
  date: string
  bankAccountId?: string
  reason?: string
}

export const AGING_BUCKETS = ['notDue', 'd0_30', 'd31_60', 'd61_90', 'd91_120', 'over120'] as const
export type AgingBucket = (typeof AGING_BUCKETS)[number]
type Buckets = Record<AgingBucket, number>

export interface AgingReport {
  cutoff: string
  totals: Buckets & { total: number }
  summaryTotal: number
  detailTotal: number
  ledgerTotal: number
  cuadra: boolean
  summary?: ({ partyId: string; name: string; identification: string; total: number } & Buckets)[]
  detail?: {
    invoiceId: string
    number: string
    date: string
    dueDate: string
    customer: string
    total: number
    balance: number
    daysOverdue: number
    bucket: AgingBucket
  }[]
}

export interface InvoicesReport {
  customers: {
    partyId: string
    name: string
    identification: string
    invoices: {
      invoiceId: string
      number: string
      date: string
      dueDate: string
      total: number
      paid: number
      balance: number
      movements?: {
        date: string
        kind: string
        amount: number
        description: string
        docNumber: string
      }[]
    }[]
    total: number
    paid: number
    balance: number
  }[]
  total: number
  paid: number
  balance: number
}

export interface StatementReport {
  opening: number
  closing: number
  rows: {
    date: string
    kind: string
    invoiceNumber: string
    docNumber: string
    description: string
    debit: number
    credit: number
    balance: number
  }[]
}

export interface WithholdingsReport {
  rows?: {
    date: string
    invoiceDate: string
    invoiceNumber: string
    customer: string
    identification: string
    sellerName: string
    voucherNumber: string
    authorization: string
    lines: WithholdingLine[]
    total: number
  }[]
  types?: { tax: string; rate: number; count: number; base: number; amount: number }[]
  totals: { renta: number; iva: number; total: number }
}

export interface CommissionsReport {
  rate: number
  items: { sellerName: string; collected: number; rate: number; commission: number }[]
  collected: number
  commission: number
}
