import { monthStart, todayISO } from '@/utils/format'

/** Filtros comunes de reportes. Vacío = sin filtrar. Fechas "AAAA-MM-DD". */
export interface ReportFilterValues {
  from: string
  to: string
  warehouseId: string
  partyId: string
  productId: string
  accountCode: string
  bankAccountId: string
}

export type ReportFilterField = 'range' | 'warehouse' | 'party' | 'product' | 'account' | 'bankAccount'

/** Del primero del mes a hoy, como abren hoy los reportes. */
export function defaultFilters(over: Partial<ReportFilterValues> = {}): ReportFilterValues {
  return {
    from: monthStart(),
    to: todayISO(),
    warehouseId: '',
    partyId: '',
    productId: '',
    accountCode: '',
    bankAccountId: '',
    ...over,
  }
}

/** Solo los filtros con valor, listos para `params` del API. */
export function filterParams(values: ReportFilterValues): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v)) as Record<string, string>
}
