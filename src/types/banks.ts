/** Tipos del API de Caja Bancos (/api/banks). Montos en CENTAVOS; fechas ISO. */
export const BANK_TX_TYPES = ['DEPOSITO', 'NOTA_DEBITO', 'NOTA_CREDITO', 'CHEQUE', 'TRANSFERENCIA', 'INGRESO_CAJA', 'EGRESO_CAJA'] as const
export type BankTxType = (typeof BANK_TX_TYPES)[number]
export type Direction = 'in' | 'out'

export interface BankTxLine {
  accountCode: string
  amount: number | null
  costCenter: string
  description: string
  /** Solo en pantalla, para la vista previa del asiento. */
  accountName?: string
}

export interface BankTransaction {
  _id: string
  number: string
  type: BankTxType
  date: string
  bankAccountId: string
  targetBankAccountId: string | null
  checkNumber: string
  partyId: string | null
  beneficiary: string
  description: string
  amount: number
  lines: BankTxLine[]
  status: 'vigente' | 'anulado'
  voidReason: string
  voidedAt: string | null
  createdBy: { name: string }
  createdAt: string
}

export interface BankMovement {
  _id: string
  bankAccountId: string
  date: string
  type: string
  direction: Direction
  amount: number
  checkNumber: string
  beneficiary: string
  description: string
  status: 'vigente' | 'anulado'
  source: { module: string; docType: string; docNumber: string }
  reconciledAt: string | null
  cleared?: boolean
}

export interface BankTxInput {
  type: BankTxType
  date: string
  bankAccountId: string
  targetBankAccountId?: string
  byCheck?: boolean
  amount?: number
  partyId?: string
  beneficiary: string
  note: string
  lines: { accountCode: string; amount: number; costCenter: string; description: string }[]
}

export interface BalanceRow {
  bankAccountId: string
  kind: 'banco' | 'caja'
  name: string
  number: string
  accountCode: string
  accountingBalance: number
  movementBalance: number
}

export interface BankBook {
  opening: number
  closing: number
  items: (BankMovement & { balance: number })[]
}

export interface PendingCheck extends BankMovement {
  bankName: string
  ageDays: number
}

export const SUMMARY_TYPES = ['DEPOSITO', 'NOTA_CREDITO', 'NOTA_DEBITO', 'CHEQUE'] as const
export type SummaryType = (typeof SUMMARY_TYPES)[number]

export interface SummaryRow {
  type: SummaryType
  previousMonths: number
  pendingInPeriod: number
  bookInPeriod: number
  records: { pending: number; cleared: number }
}

export interface ReconSummary {
  statementBalance: number
  bookBalance: number
  rows: SummaryRow[]
  adjustedBalance: number
  difference: number
  balanced: boolean
  message: string
  totalRecords: number
}

export interface Reconciliation {
  _id: string
  bankAccountId: string
  description: string
  from: string
  to: string
  statementBalance: number
  status: 'abierta' | 'cerrada'
  forceReason: string
  closedAt: string | null
  closedBy?: { name: string }
  reopenLog?: { at: string; reason: string; name: string }[]
  movements: BankMovement[]
  summary: ReconSummary
}

interface ReportDetail {
  items: { _id: string; date: string; type: string; checkNumber: string; description: string; amount: number }[]
  total: number
}

export interface ReconReport {
  title: string
  status: string
  statementBalance: number
  outstandingChecks: ReportDetail
  depositsInTransit: ReportDetail
  reconciledBankBalance: number
  accountingBalance: number
  adjustedBalance: number
  difference: number
  message: string
  totalRecords: number
  forceReason: string
}

export interface StatementLine {
  line: number
  date: string
  description: string
  reference: string
  amount: number
  direction: Direction
}

export type ColumnKey = 'date' | 'description' | 'reference' | 'debit' | 'credit' | 'amount'
export type ColumnMapping = Partial<Record<ColumnKey, string>>

export interface MatchProposal {
  movementId: string
  movement: BankMovement
  line: StatementLine
  rule: 'cheque' | 'monto_fecha'
}

export interface MatchResult {
  separator: string
  headers: string[]
  columns: Partial<Record<ColumnKey, number>>
  totalLines: number
  proposals: MatchProposal[]
  unmatchedLines: StatementLine[]
  unmatchedMovements: BankMovement[]
}
