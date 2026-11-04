import APIBase from './httpBase'
import type { ListParams } from './catalog.service'
import type { Paginated } from '@/types'

/** Contabilidad (`/api/accounting/*`). Montos en CENTAVOS, saldo = debe − haber salvo que se diga. */
export type EntrySubtype = 'asiento_diario' | 'depreciacion' | 'importacion' | 'rol_pagos'

export interface EntryLine {
  accountCode: string
  accountName: string
  debit: number
  credit: number
  costCenter: string
  partyId: string | null
  party?: { _id: string; name: string; identification: string } | null
  description: string
}

export interface JournalEntry {
  _id: string
  number: string
  date: string
  period: string
  type: string
  subtype: EntrySubtype | null
  description: string
  source: { module: string; docType: string; docId: string | null; docNumber: string }
  lines?: EntryLine[]
  totalDebit: number
  totalCredit: number
  status: 'contabilizado' | 'anulado'
  reversalOf: string | null
  reversedBy: string | null
  createdBy: { userId: string | null; name: string }
  createdAt?: string
}

type LinkedEntry = { _id: string; number: string; date: string; type: string } | null

export interface EntryDetail extends JournalEntry {
  lines: EntryLine[]
  audit: { user: string; date: string | null; time: string | null; createdAt: string | null }
  sourceDocument: JournalEntry['source'] & { editable: boolean }
  reversedByEntry: LinkedEntry
  reversalOfEntry: LinkedEntry
}

export interface NewEntry {
  date: string
  subtype: EntrySubtype
  description: string
  lines: { accountCode: string; debit: number; credit: number; costCenter: string; partyId: string | null; description: string }[]
}

export interface LedgerMovement {
  entryId: string
  type: string
  number: string
  date: string
  status: string
  accountCode: string
  accountName: string
  party: string
  debit: number
  credit: number
  costCenter: string
  description: string
  balance: number
}

export interface LedgerReport {
  account: { code: string; name: string; kind: string }
  previousBalance: number
  movements: LedgerMovement[]
  totalDebit: number
  totalCredit: number
  balance: number
}

/** Fila de un reporte en árbol: `level` sale de los tramos del código. */
export interface TreeRow {
  code: string
  name: string
  kind: 'mayor' | 'movimiento'
  level: number
}

export interface TrialRow extends TreeRow {
  previous: number
  debit: number
  credit: number
  balance: number
}

export interface TrialBalance {
  period: string
  mode: 'acumulado' | 'mensual'
  from: string
  to: string
  rows: TrialRow[]
  totals: { previous: number; debit: number; credit: number; balance: number }
  cuadra: boolean
}

export interface AmountRow extends TreeRow {
  amount: number
}

export interface IncomeStatement {
  from: string
  to: string
  signConvention: string
  income: { total: number; rows: AmountRow[] }
  costsAndExpenses: { total: number; rows: AmountRow[] }
  byProductGroup: { group: string; salesAccount: string; costAccount: string; sales: number; cost: number; grossMargin: number }[]
  utility: number
}

export interface BalanceSheet {
  date: string
  signConvention: string
  assets: { total: number; rows: AmountRow[] }
  liabilities: { total: number; rows: AmountRow[] }
  equity: { total: number; rows: AmountRow[]; currentYearResult: number }
  liabilitiesAndEquity: number
  cuadra: boolean
}

export interface ComparativeRow extends TreeRow {
  balanceA: number
  balanceB: number
  difference: number
}

export interface YearCloseEntry {
  _id: string
  number: string
  date: string
  status: 'contabilizado' | 'anulado'
  source: { docNumber: string }
  createdBy: { name: string }
  createdAt: string
  reversedBy: string | null
  totalDebit: number
}

export interface ChartRow {
  line: number
  code: string
  name: string
  kind: 'mayor' | 'movimiento'
  previousName?: string
  previousKind?: string
}

export interface ChartImportResult {
  mode: 'preview' | 'apply'
  valid: boolean
  errors: string[]
  toCreate: ChartRow[]
  toUpdate: ChartRow[]
  unchanged: number
  created?: number
  updated?: number
}

class AccountingService extends APIBase {
  private async read<T>(endpoint: string, params: ListParams = {}) {
    return (await this.get<T>(`accounting/${endpoint}`, undefined, { params })).data
  }

  searchEntries = (params: ListParams) => this.read<Paginated<JournalEntry>>('entries', params)
  getEntry = (id: string) => this.read<EntryDetail>(`entries/${id}`)
  journal = (params: ListParams) => this.read<Paginated<JournalEntry> & { totalDebit: number; totalCredit: number }>('reports/journal', params)
  ledger = (params: ListParams) => this.read<LedgerReport>('reports/ledger', params)
  trialBalance = (params: ListParams) => this.read<TrialBalance>('reports/trial-balance', params)
  incomeStatement = (params: ListParams) => this.read<IncomeStatement>('reports/income-statement', params)
  balanceSheet = (params: ListParams) => this.read<BalanceSheet>('reports/balance-sheet', params)
  comparative = (params: ListParams) => this.read<{ periodA: string; periodB: string; rows: ComparativeRow[] }>('reports/comparative', params)
  listCloses = () => this.read<YearCloseEntry[]>('year-close')

  async createEntry(body: NewEntry) {
    return (await this.post<JournalEntry>('accounting/entries', body)).data
  }

  async voidEntry(id: string, reason: string) {
    return (await this.post<JournalEntry>(`accounting/entries/${id}/void`, { reason })).data
  }

  async closeYear(year: number, transferToRetained: boolean) {
    return (await this.post<{ entry: JournalEntry; result: number; lockedThrough: string }>('accounting/year-close', { year, transferToRetained })).data
  }

  async reopenYear(year: number, reason: string) {
    return (await this.post<{ reversal: JournalEntry; lockedThrough: string }>(`accounting/year-close/${year}/reopen`, { reason })).data
  }

  async importChart(csv: string, mode: 'preview' | 'apply') {
    return (await this.post<ChartImportResult>('accounting/chart/import', { csv, mode })).data
  }
}

export const accountingService = new AccountingService()
