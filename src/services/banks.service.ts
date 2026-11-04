import APIBase from './httpBase'
import type { BankAccount, Paginated } from '@/types'
import type { BankBook, BankMovement, BankTransaction, BankTxInput, BalanceRow, ColumnMapping, MatchResult, PendingCheck, ReconReport, Reconciliation, StatementLine } from '@/types/banks'
import type { ListParams } from './catalog.service'

export * from '@/types/banks'

class BanksService extends APIBase {
  async listTransactions(params: ListParams) {
    return (await this.get<Paginated<BankTransaction>>('banks/transactions', undefined, { params })).data
  }

  async getTransaction(id: string) {
    return (await this.get<BankTransaction & { movements: BankMovement[] }>(`banks/transactions/${id}`)).data
  }

  async createTransaction(body: BankTxInput) {
    return (await this.post<BankTransaction>('banks/transactions', body)).data
  }

  async voidTransaction(id: string, reason: string) {
    return (await this.post<BankTransaction>(`banks/transactions/${id}/void`, { reason })).data
  }

  async balances(date: string) {
    return (await this.get<{ items: BalanceRow[]; total: number }>('banks/balances', undefined, { params: { date } })).data
  }

  async book(id: string, from: string, to: string) {
    return (await this.get<BankBook & { bankAccount: BankAccount }>(`banks/accounts/${id}/book`, undefined, { params: { from, to } })).data
  }

  async pendingChecks(params: ListParams) {
    return (await this.get<{ items: PendingCheck[]; total: number; count: number }>('banks/reports/pending-checks', undefined, { params })).data
  }

  async listReconciliations(params: ListParams) {
    return (await this.get<Paginated<Reconciliation>>('banks/reconciliations', undefined, { params })).data
  }

  async createReconciliation(body: { bankAccountId: string; from: string; to: string; statementBalance: number }) {
    return (await this.post<Reconciliation>('banks/reconciliations', body)).data
  }

  async getReconciliation(id: string) {
    return (await this.get<Reconciliation>(`banks/reconciliations/${id}`)).data
  }

  async updateReconciliation(id: string, body: { statementBalance?: number; clearedIds?: string[] }) {
    return (await this.patch<Reconciliation>(`banks/reconciliations/${id}`, body)).data
  }

  async loadMovements(id: string) {
    return (await this.post<Reconciliation>(`banks/reconciliations/${id}/load`, {})).data
  }

  async closeReconciliation(id: string, body: { force?: boolean; reason?: string }) {
    return (await this.post<Reconciliation>(`banks/reconciliations/${id}/close`, body)).data
  }

  async reopenReconciliation(id: string, reason: string) {
    return (await this.post<Reconciliation>(`banks/reconciliations/${id}/reopen`, { reason })).data
  }

  async reconciliationReport(id: string) {
    return (await this.get<ReconReport>(`banks/reconciliations/${id}/report`)).data
  }

  async matchStatement(id: string, csv: string, mapping: ColumnMapping) {
    return (await this.post<MatchResult>(`banks/reconciliations/${id}/statement/match`, { csv, mapping })).data
  }

  async confirmMatches(id: string, movementIds: string[]) {
    return (await this.post<Reconciliation>(`banks/reconciliations/${id}/statement/confirm`, { movementIds })).data
  }

  async noteFromLine(id: string, line: StatementLine, accountCode: string) {
    return (await this.post<Reconciliation>(`banks/reconciliations/${id}/statement/note`, { line, accountCode })).data
  }
}

export const banksService = new BanksService()
