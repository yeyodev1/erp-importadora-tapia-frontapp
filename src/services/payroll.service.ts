import APIBase from './httpBase'
import type { ListParams } from './catalog.service'
import type { Paginated } from '@/types'
import type { Employee, EmployeeLoan, LineEdit, Payroll } from '@/types/payroll'

export * from '@/types/payroll'

interface Resources {
  employees: Employee
  loans: EmployeeLoan
}

/** Nómina: empleados y préstamos (CRUD de catálogo) y el rol mensual. */
class PayrollService extends APIBase {
  async list<R extends keyof Resources>(resource: R, params: ListParams = {}) {
    return (await this.get<Paginated<Resources[R]>>(`payroll/${resource}`, undefined, { params })).data
  }

  async create<R extends keyof Resources>(resource: R, body: Record<string, unknown>) {
    return (await this.post<Resources[R]>(`payroll/${resource}`, body)).data
  }

  async update<R extends keyof Resources>(resource: R, id: string, body: Record<string, unknown>) {
    return (await this.put<Resources[R]>(`payroll/${resource}/${id}`, body)).data
  }

  /** Roles del período (sin líneas), el más nuevo primero. */
  async payrolls(period: string) {
    return (await this.get<Paginated<Omit<Payroll, 'lines'>>>('payroll/payrolls', undefined, { params: { period } })).data
  }

  async payroll(id: string) {
    return (await this.get<Payroll>(`payroll/payrolls/${id}`)).data
  }

  async generate(period: string) {
    return (await this.post<Payroll>('payroll/payrolls', { period })).data
  }

  async saveLines(id: string, lines: LineEdit[]) {
    return (await this.put<Payroll>(`payroll/payrolls/${id}`, { lines })).data
  }

  async approve(id: string) {
    return (await this.post<Payroll>(`payroll/payrolls/${id}/approve`, {})).data
  }

  async void(id: string, reason: string) {
    return (await this.post<Payroll>(`payroll/payrolls/${id}/void`, { reason })).data
  }
}

export const payrollService = new PayrollService()
