import APIBase from './httpBase'
import type { ListParams } from './catalog.service'
import type { Paginated } from '@/types'
import type {
  JournalEntry,
  ParsedXml,
  PayableTransaction,
  PaymentApproval,
  PurchaseInvoice,
  PurchaseInvoiceDetail,
  SupplierCreditNote,
  WithholdingCode,
  XmlBatch,
} from '@/types/purchases'

type Body = Record<string, unknown>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Report = { items: any[]; totals?: Record<string, number>; total: number; [k: string]: any }

/** Compras y Cuentas por pagar (`/api/purchases/*`). Montos en centavos. */
class PurchasesService extends APIBase {
  private async getData<T>(endpoint: string, params?: ListParams) {
    return (await this.get<T>(endpoint, undefined, { params })).data
  }

  private async postData<T>(endpoint: string, body: unknown) {
    return (await this.post<T>(endpoint, body)).data
  }

  // Códigos de retención
  listCodes = (params: ListParams = {}) => this.getData<Paginated<WithholdingCode>>('purchases/withholding-codes', params)
  async saveCode(body: Partial<WithholdingCode>, id: string | null) {
    return id
      ? (await this.put<WithholdingCode>(`purchases/withholding-codes/${id}`, body)).data
      : this.postData<WithholdingCode>('purchases/withholding-codes', body)
  }

  // XML
  importXml = (xml: string, createSupplier = false) => this.postData<ParsedXml>('purchases/invoices/xml', { xml, createSupplier })
  importBatch = (xmls: string[]) => this.postData<XmlBatch>('purchases/invoices/xml/batch', { xmls })

  // Facturas
  listInvoices = (params: ListParams) => this.getData<Paginated<PurchaseInvoice>>('purchases/invoices', params)
  getInvoice = (id: string) => this.getData<PurchaseInvoiceDetail>(`purchases/invoices/${id}`)
  createInvoice = (body: Body) => this.postData<PurchaseInvoice>('purchases/invoices', body)
  voidInvoice = (id: string, body: Body) => this.postData<PurchaseInvoice>(`purchases/invoices/${id}/void`, body)
  resendWithholding = (id: string) => this.postData<PurchaseInvoice>(`purchases/invoices/${id}/withholding/resend`, {})
  getEntry = (id: string) => this.getData<JournalEntry>(`accounting/entries/${id}`)

  // Notas de crédito
  listCreditNotes = (params: ListParams) => this.getData<Paginated<SupplierCreditNote>>('purchases/credit-notes', params)
  createCreditNote = (body: Body) => this.postData<SupplierCreditNote>('purchases/credit-notes', body)

  // Aprobaciones, pagos y anticipos
  listApprovals = (params: ListParams) => this.getData<Paginated<PaymentApproval>>('purchases/approvals', params)
  approve = (body: Body) => this.postData<PaymentApproval>('purchases/approvals', body)
  cancelApproval = (id: string) => this.postData<PaymentApproval>(`purchases/approvals/${id}/cancel`, {})
  listTransactions = (params: ListParams) => this.getData<Paginated<PayableTransaction>>('purchases/transactions', params)
  pay = (body: Body) => this.postData<PayableTransaction>('purchases/payments', body)
  createAdvance = (body: Body) => this.postData<PayableTransaction>('purchases/advances', body)
  crossAdvance = (id: string, body: Body) => this.postData<PayableTransaction>(`purchases/advances/${id}/cross`, body)
  refundAdvance = (id: string, body: Body) => this.postData<PayableTransaction>(`purchases/advances/${id}/refund`, body)
  voidTransaction = (id: string, body: Body) => this.postData<PayableTransaction>(`purchases/transactions/${id}/void`, body)

  // Reportes
  report = (name: 'balances' | 'advances' | 'by-supplier' | 'by-account' | 'by-tax-support' | 'withholdings', params: ListParams) =>
    this.getData<Report>(`purchases/reports/${name}`, params)
  statement = (supplierId: string, params: ListParams) => this.getData<Report>(`purchases/reports/statement/${supplierId}`, params)
}

export const purchasesService = new PurchasesService()
