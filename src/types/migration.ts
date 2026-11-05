/** Espejo de /api/migration (montos en centavos). */
export interface MacioProductRow {
  code: string
  name: string
  unit: string
  group: string
  suggested: boolean
  status: 'nuevo' | 'existente' | 'conflicto'
  existingName: string
  gye: number
  uio: number
}

export interface MacioInvoiceRow {
  number: string
  customer: string
  identification: string
  warehouse: string
  date: string
  dueDate: string
  total: number
  paid: number
  balance: number
  ambiguous: boolean
}

export interface MacioPreview {
  counts: Record<
    | 'clientRows' | 'clients' | 'newClients' | 'existingClients' | 'repeatedInFile' | 'withoutId' | 'invalidIds' | 'sellers'
    | 'products' | 'newProducts' | 'existingProducts' | 'conflicts' | 'stockLines' | 'invoices' | 'unmatchedInvoices'
    | 'ambiguousInvoices' | 'creditNotes',
    number
  >
  totals: { receivables: number; invoiceTotals: number; paid: number; unmatched: number; creditNotes: number }
  invalidClients: { macioCode: string; name: string; identification: string; idType: string; problem: string }[]
  repeatedClients: { macioCode: string; name: string; identification: string }[]
  sellers: { code: string; name: string; customers: number }[]
  products: MacioProductRow[]
  stock: { warehouse: string; name: string; lines: number; qty: number }[]
  invoices: MacioInvoiceRow[]
  unmatchedInvoices: { number: string; customer: string; balance: number }[]
  notices: string[]
  warnings: string[]
  blockers: string[]
  canApply: boolean
}

export interface ImportBatch {
  _id: string
  number: string
  source: 'macio' | 'proveedores' | 'proveedores-excel'
  status: 'aplicado' | 'quitado'
  counts: Record<string, number>
  totals: Record<string, number>
  warnings: string[]
  createdBy: { name: string }
  createdAt: string
  undoneAt: string | null
  undoneBy?: { name: string }
  undoReason: string
}

export interface MacioApplyResult {
  batch: ImportBatch
  verification: {
    imported: number
    agingBefore: number
    agingAfter: number
    agingMatches: boolean
    agingCuadra: boolean
    trialBalanceCuadra: boolean
  }
}

export interface SuppliersPreview {
  empty: boolean
  message: string
  suppliers: { name: string; ruc: string; status: 'nuevo' | 'existente' }[]
  withoutRuc: { name: string; reason: string }[]
  photos: { name: string; code: string; url: string }[]
  photosSkipped: { name: string; reason: string }[]
  counts: Record<'suppliers' | 'marked' | 'withoutRuc' | 'photos' | 'photosSkipped', number>
  canApply: boolean
}

export interface SupplierListPreview {
  suppliers: { line: number; name: string; identification: string; status: 'nuevo' | 'existente' }[]
  problems: { line: number; name: string; identification: string; reason: string }[]
  skipped: { line: number; name: string; identification: string; reason: string }[]
  counts: Record<'toCreate' | 'toMark' | 'already' | 'problems' | 'skipped', number>
  canApply: boolean
}

export interface DemoItem {
  id: string
  kind: 'producto' | 'tercero'
  code: string
  name: string
  status: 'se_quita' | 'en_uso'
  usedBy: string[]
}

export interface DemoPreview {
  items: DemoItem[]
  counts: { remove: number; inUse: number }
  empty: boolean
  removed?: { products: number; parties: number }
}
