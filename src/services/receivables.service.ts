import APIBase from './httpBase'
import { catalogService, type ListParams } from './catalog.service'
import type { Paginated } from '@/types'
import type * as T from './receivables.types'

export * from './receivables.types'

// El API ya trae partyName; esto solo cubre respuestas viejas sin él.
const partyNames = new Map<string, Promise<string>>()
const partyName = (id: string) => {
  if (!partyNames.has(id))
    partyNames.set(
      id,
      catalogService.getOne('parties', id).then(
        (p) => p.name,
        () => '',
      ),
    )
  return partyNames.get(id)!
}
async function withNames<T extends { partyId: unknown; partyName?: string }>(res: Paginated<T>) {
  const names = await Promise.all(res.items.map((r) => r.partyName ?? partyName(String(r.partyId))))
  res.items.forEach((r, i) => (r.partyName = names[i]))
  return res
}

class ReceivablesService extends APIBase {
  private async read<T>(endpoint: string, params: ListParams = {}) {
    return (await this.get<T>(`receivables/${endpoint}`, undefined, { params })).data
  }

  private async send<T>(endpoint: string, body: unknown) {
    return (await this.post<T>(`receivables/${endpoint}`, body)).data
  }

  openInvoices(params: ListParams) {
    return this.read<Paginated<T.OpenInvoice>>('open-invoices', { limit: 500, ...params })
  }

  async receipts(params: ListParams) {
    return withNames(await this.read<Paginated<T.Receipt>>('receipts', params))
  }

  createReceipt(body: T.ReceiptBody) {
    return this.send<T.Receipt>('receipts', body)
  }

  voidReceipt(id: string, body: { reason: string; date?: string }) {
    return this.send<T.Receipt>(`receipts/${id}/void`, body)
  }

  checks(params: ListParams) {
    return this.read<T.Receipt[]>('postdated-checks', params)
  }

  checkStep(id: string, action: 'deposit' | 'confirm' | 'return', body: T.CheckStep) {
    return this.send<T.Receipt>(`postdated-checks/${id}/${action}`, body)
  }

  async withholdings(params: ListParams) {
    return withNames(await this.read<Paginated<T.Withholding>>('withholdings', params))
  }

  createWithholding(body: T.WithholdingBody) {
    return this.send<T.Withholding>('withholdings', body)
  }

  aging(params: ListParams) {
    return this.read<T.AgingReport>('reports', { ...params, type: 'aging' })
  }

  invoicesReport(params: ListParams) {
    return this.read<T.InvoicesReport>('reports', { ...params, type: 'invoices' })
  }

  statement(params: ListParams) {
    return this.read<T.StatementReport>('reports', { ...params, type: 'statement' })
  }

  withholdingsReport(params: ListParams) {
    return this.read<T.WithholdingsReport>('reports/withholdings', params)
  }

  commissions(params: ListParams) {
    return this.read<T.CommissionsReport>('reports/commissions', params)
  }
}

export const receivablesService = new ReceivablesService()
