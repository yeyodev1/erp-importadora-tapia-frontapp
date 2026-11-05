/** Nómina (`/api/payroll/*`). MONTOS EN CENTAVOS; fechas ISO del API. */

export type Department = 'administracion' | 'ventas'
export type LoanType = 'interno' | 'quirografario' | 'hipotecario'
export type PayrollStatus = 'borrador' | 'aprobado' | 'anulado'

export interface Employee {
  _id: string
  partyId: string
  identification: string
  firstName: string
  lastName: string
  address: string
  phone: string
  email: string
  hireDate: string
  department: Department
  position: string
  salary: number
  sellerName: string
  commissionRate: number
  reserveFundMonthly: boolean
  isActive: boolean
  exitDate: string | null
}

export interface EmployeeLoan {
  _id: string
  /** El listado lo trae poblado; al escribir se manda el _id. */
  employeeId: string | Employee
  type: LoanType
  date: string
  description: string
  total: number
  installment: number
  balance: number | null
  isActive: boolean
}

export interface PayrollLine {
  employeeId: string
  partyId: string
  name: string
  identification: string
  department: Department
  position: string
  hireDate: string
  salary: number
  reserveFundMonthly: boolean
  days: number
  salaryEarned: number
  extras: number
  commissions: number
  iessBase: number
  iessPersonal: number
  loanTotals: Record<LoanType, number>
  otherDeductions: number
  reserveFundPaid: number
  totalIncome: number
  totalDeductions: number
  net: number
  employer: { iess: number; secapIece: number; thirteenth: number; fourteenth: number; vacation: number; reserveFund: number }
}

export interface PayrollRates {
  sbu: number
  iessPersonalRate: number
  iessEmployerRate: number
  secapRate: number
  ieceRate: number
  reserveFundRate: number
}

export interface Payroll {
  _id: string
  period: string
  date: string
  status: PayrollStatus
  rates: PayrollRates
  lines: PayrollLine[]
  totals: { totalIncome: number; totalDeductions: number; net: number; employerCost: number }
  journalEntryId: string | null
  voidReason: string
  createdBy: { name: string }
  approvedBy?: { name?: string }
}

export type LineEdit = Pick<PayrollLine, 'employeeId' | 'days' | 'extras' | 'commissions' | 'otherDeductions'>

/** Formulario de la ficha: fechas AAAA-MM-DD, sueldo en centavos, % como texto. */
export interface EmployeeFormData {
  identification: string
  firstName: string
  lastName: string
  address: string
  phone: string
  email: string
  hireDate: string
  department: Department
  position: string
  salary: number | null
  sellerName: string
  commissionRate: string
  reserveFundMonthly: boolean
  isActive: boolean
  exitDate: string
}
