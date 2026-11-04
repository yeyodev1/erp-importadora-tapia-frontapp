import APIBase from './httpBase'
import type { Role } from '@/types'

/** Tablero de Inicio (`/api/dashboard?month=AAAA-MM`). El API manda solo las secciones del rol. */
export interface MonthSales {
  period: string
  sales: number
  total: number
  count: number
  byWarehouse: { warehouseId: string; name: string; sales: number; count: number }[]
  bySeller: { sellerName: string; sales: number; count: number }[]
}

export interface Dashboard {
  period: string
  today: string
  role: Role
  sales?: { current: MonthSales; previous: MonthSales; series: { period: string; sales: number; count: number }[] }
  topProducts?: { productId?: string; code?: string; name?: string; qty?: number; value?: number; [k: string]: unknown }[]
  topCustomers?: { partyId: string; name: string; identification: string; sales: number; count: number }[]
  receivables?: { total: number; overdue: number; cuadra: boolean }
  payables?: { overdue: { amount: number; count: number } }
  lowStock?: { products: number }
  postdatedChecks?: { amount: number; count: number }
  sriPending?: { invoices: number; creditNotes: number; debitNotes: number; withholdings: number; total: number }
}

class DashboardService extends APIBase {
  async load(month?: string) {
    return (await this.get<Dashboard>('dashboard', undefined, { params: { month } })).data
  }
}

export const dashboardService = new DashboardService()
