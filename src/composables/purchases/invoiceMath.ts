import type { EntryLine } from '@/components/documents/lines'
import type { AccountMapKey } from '@/types'
import type { WithholdingCode } from '@/types/purchases'

/**
 * Cálculo de la factura de proveedor, igual que purchaseInvoiceInput del API:
 * bases, IVA 15 %, retenciones (base × tasa, redondeo aritmético) y neto.
 * Todo en CENTAVOS enteros. Puro: se prueba sin Vue.
 */
export const VAT_RATE = 15

export interface ExpenseLine {
  accountCode: string
  description: string
  base0: number | null
  baseVat: number | null
}
export interface ProductLine {
  productId: string
  description: string
  qty: number | null
  subtotal: number | null
  vatRate: number
  /** Inventario del grupo del producto (solo para la vista previa: el API lo pone). */
  accountCode: string
}
export interface WithholdingInput {
  codeId: string
  base: number | null
  rate: number | null
}

export const percentOf = (base: number, rate: number) => Math.round((base * rate) / 100 + Number.EPSILON * Math.sign(base))

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function computeInvoice(opts: {
  expenseLines: ExpenseLine[]
  productLines: ProductLine[]
  vatOverride: number | null
  withholdings: WithholdingInput[]
  codes: WithholdingCode[]
}) {
  const products = opts.productLines.filter((l) => l.productId)
  const base0 = sum(opts.expenseLines.map((l) => l.base0 ?? 0)) + sum(products.filter((l) => !l.vatRate).map((l) => l.subtotal ?? 0))
  const baseVat = sum(opts.expenseLines.map((l) => l.baseVat ?? 0)) + sum(products.filter((l) => l.vatRate).map((l) => l.subtotal ?? 0))
  const vatAuto = percentOf(baseVat, VAT_RATE)
  const vat = opts.vatOverride ?? vatAuto
  const total = base0 + baseVat + vat
  const withholdings = opts.withholdings
    .filter((w) => w.codeId)
    .map((w) => {
      const code = opts.codes.find((c) => c._id === w.codeId)
      return { ...w, code, amount: percentOf(w.base ?? 0, w.rate ?? 0) }
    })
  const withholdingTotal = sum(withholdings.map((w) => w.amount))
  return { base0, baseVat, vatAuto, vat, total, withholdings, withholdingTotal, payable: total - withholdingTotal }
}

export type InvoiceTotals = ReturnType<typeof computeInvoice>

/** Asiento COMPRA tal como lo arma el API: Debe gasto/inventario + IVA; Haber retenciones + Proveedores. */
export function invoiceEntry(
  t: InvoiceTotals,
  expenseLines: ExpenseLine[],
  productLines: ProductLine[],
  map: Partial<Record<AccountMapKey, string>>,
): EntryLine[] {
  return [
    ...expenseLines.map((l) => ({ accountCode: l.accountCode, description: l.description, debit: (l.base0 ?? 0) + (l.baseVat ?? 0), credit: 0 })),
    ...productLines
      .filter((l) => l.productId)
      .map((l) => ({ accountCode: l.accountCode, description: l.description, debit: l.subtotal ?? 0, credit: 0 })),
    { accountCode: map.vatPurchases ?? '', description: 'IVA pagado', debit: t.vat, credit: 0 },
    ...t.withholdings.map((w) => ({
      accountCode: w.code?.accountCode || (w.code?.tax === 'iva' ? map.vatWithholdingPayable : map.incomeWithholdingPayable) || '',
      description: `Ret. ${w.code?.code ?? ''} ${w.rate ?? 0}%`,
      debit: 0,
      credit: w.amount,
    })),
    { accountCode: map.suppliers ?? '', description: 'Proveedores', debit: 0, credit: t.payable },
  ]
}

/** Cuadra y toda línea con valor tiene cuenta: recién ahí se deja grabar. */
export function entryReady(lines: EntryLine[]): boolean {
  const moving = lines.filter((l) => l.debit || l.credit)
  const diff = sum(moving.map((l) => l.debit)) - sum(moving.map((l) => l.credit))
  return moving.length > 1 && diff === 0 && moving.every((l) => l.accountCode)
}
