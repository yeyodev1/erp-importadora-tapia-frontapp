/**
 * Compras y Cuentas por pagar tal como los devuelve `/api/purchases/*`.
 * MONTOS EN CENTAVOS ENTEROS. Fechas ISO (el API las guarda a mediodía UTC).
 */

export interface WithholdingCode {
  _id: string
  tax: 'renta' | 'iva'
  code: string
  description: string
  /** Porcentaje: 1.75 = 1.75 %. */
  rate: number
  accountCode: string
  isActive: boolean
}

export interface WithholdingLine {
  codeId: string
  tax: 'renta' | 'iva'
  code: string
  description: string
  base: number
  rate: number
  amount: number
  accountCode: string
}

export interface WithholdingVoucher {
  number: string
  accessKey: string
  sriStatus: string
  authorizationNumber: string
  messages: string[]
}

export interface PurchaseInvoice {
  _id: string
  supplierId: string | { _id: string; name: string; identification: string }
  supplierRuc: string
  supplierName: string
  docType: string
  docNumber: string
  date: string
  dueDate: string
  authorization: string
  accessKey: string
  creditDays: number
  taxSupport: string
  goodsOrServices: 'bien' | 'servicio'
  paymentMethod: string
  description: string
  expenseLines: { accountCode: string; base0: number; baseVat: number; description: string; costCenter: string }[]
  productLines: { productId: string; qty: number; subtotal: number; vatRate: number; accountCode: string; description: string }[]
  warehouseId: string | null
  base0: number
  baseVat: number
  vat: number
  total: number
  withholdings: WithholdingLine[]
  withholdingTotal: number
  payable: number
  balance: number
  approved: number
  withholding: WithholdingVoucher | null
  journalEntryId: string | null
  status: 'vigente' | 'anulado'
  voidReason: string
}

export interface PayableApplication {
  _id: string
  invoiceId: string
  date: string
  kind: 'pago' | 'nc' | 'anticipo'
  amount: number
  status: 'vigente' | 'anulado'
}

export interface PurchaseInvoiceDetail extends PurchaseInvoice {
  applications: PayableApplication[]
}

/** Respuesta de importar un XML: o ya está ingresado, o trae los datos para el formulario. */
export interface ParsedXml {
  duplicate: boolean
  existingId?: string
  accessKey?: string
  docNumber?: string
  supplier: { ruc: string; name: string; tradeName: string; address: string; existingId: string | null }
  invoice: {
    docType: string
    docNumber: string
    date: string
    accessKey: string
    authorization: string
    base0: number
    baseVat: number
    vat: number
    total: number
    paymentMethod: string
    creditDays: number
    lines: { code: string; description: string; qty: number; unitPrice: number; discount: number; subtotal: number; vatRate: number }[]
  }
  warnings: string[]
}

export interface XmlBatch {
  pending: (ParsedXml & { index: number })[]
  registered: (ParsedXml & { index: number })[]
  errors: { index: number; message: string }[]
  total: number
}

export interface SupplierCreditNote {
  _id: string
  supplierId: string
  invoiceId: string
  docNumber: string
  date: string
  reason: string
  base0: number
  baseVat: number
  vat: number
  total: number
  status: 'vigente' | 'anulado'
}

type Ref = { _id: string; name: string; identification: string }

export interface PaymentApproval {
  _id: string
  number: number
  date: string
  beneficiaryId: Ref
  lines: { invoiceId: { _id: string; docNumber: string; date: string; payable: number; balance: number }; supplierId: string; amount: number }[]
  total: number
  note: string
  status: 'pendiente' | 'pagada' | 'anulada'
}

export interface PayableTransaction {
  _id: string
  kind: 'pago' | 'anticipo' | 'cruce' | 'devolucion'
  number: string
  date: string
  partyId: Ref
  bankAccountId: string | null
  method: 'CHEQUE' | 'TRANSFERENCIA' | 'DEPOSITO' | ''
  checkNumber: string
  amount: number
  applied: number
  advanceId: string | null
  description: string
  status: 'vigente' | 'anulado'
}

export interface JournalEntry {
  _id: string
  number: number
  date: string
  description: string
  lines: { accountCode: string; accountName: string; description?: string; debit: number; credit: number }[]
}

/** Valor a aprobar o a cruzar de una factura (centavos). */
export interface InvoiceAmountLine {
  invoiceId: string
  supplierId: string
  amount: number
}
