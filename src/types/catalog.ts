/**
 * Catálogos tal como los devuelve el API (`/api/catalog/*`, `/api/settings`).
 * MONTOS EN CENTAVOS ENTEROS; cantidades con hasta 4 decimales.
 */

interface Doc {
  _id: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type AccountKind = 'mayor' | 'movimiento'

export interface Account extends Doc {
  /** 9.9.99.99.99.999 — no cambia nunca: los asientos lo guardan. */
  code: string
  name: string
  parentCode: string | null
  level: number
  kind: AccountKind
  requiresCostCenter: boolean
  isExpense: boolean
}

/** Códigos SRI de tipo de identificación. */
export type IdType = '04' | '05' | '06' | '07'

export interface Party extends Doc {
  identification: string
  idType: IdType
  name: string
  address: string
  phone: string
  email: string
  isCustomer: boolean
  isSupplier: boolean
  isEmployee: boolean
  customer: {
    sellerName: string
    sellerCode: string
    creditDays: number
    priceList: string
    customerType: string
    parish: string
    branch: string
    /** Contribuyente especial: nos retiene IVA. */
    withholdsVat: boolean
  }
  supplier: { creditDays: number; defaultExpenseAccount: string }
}

export interface Warehouse extends Doc {
  code: string
  name: string
  establishment: string
  emissionPoint: string
  address: string
}

export interface ProductGroup extends Doc {
  name: string
  subgroups: string[]
  accounts: { inventory: string; sales: string; cost: string }
}

export interface ProductPrice {
  list: string
  /** Centavos por unidad de control. */
  price: number
}

export interface Product extends Doc {
  code: string
  barcode: string
  name: string
  kind: 'bien' | 'servicio'
  /** El listado lo trae poblado; al escribir se manda el _id. */
  groupId: string | ProductGroup
  subgroup: string
  supplierId: string | null
  location: string
  /** Unidad de control del stock (LIBRAS). */
  unit: string
  /** Unidad de compra: cuántas `unit` trae (saco de 100 lb → factor 100). */
  purchaseUnit: { name: string; factor: number }
  minQty: number
  controlsStock: boolean
  controlsLot: boolean
  vatRate: 0 | 5 | 15
  prices: ProductPrice[]
  imageUrl: string
}

export interface BankAccount extends Doc {
  kind: 'banco' | 'caja'
  name: string
  bank: string
  number: string
  type: 'corriente' | 'ahorros' | ''
  accountCode: string
  nextCheck: number
}

export const ACCOUNT_MAP_KEYS = [
  'customers',
  'suppliers',
  'vatSales',
  'vatPurchases',
  'withheldIncomeReceivable',
  'withheldVatReceivable',
  'incomeWithholdingPayable',
  'vatWithholdingPayable',
  'supplierAdvances',
  'customerAdvances',
  'postdatedChecks',
  'depositsInTransit',
  'inventoryAdjustment',
  'salesDiscounts',
  'yearResult',
  'retainedEarnings',
  'payrollSalesSalaries',
  'payrollSalesOvertime',
  'payrollSalesCommissions',
  'payrollSalesEmployerIess',
  'payrollSalesSecapIece',
  'payrollSalesReserveFund',
  'payrollSalesThirteenth',
  'payrollSalesFourteenth',
  'payrollSalesVacation',
  'payrollAdminSalaries',
  'payrollAdminOvertime',
  'payrollAdminCommissions',
  'payrollAdminEmployerIess',
  'payrollAdminSecapIece',
  'payrollAdminReserveFund',
  'payrollAdminThirteenth',
  'payrollAdminFourteenth',
  'payrollAdminVacation',
  'payrollIessPersonal',
  'payrollIessPayable',
  'payrollNetPayable',
  'payrollThirteenthProvision',
  'payrollFourteenthProvision',
  'payrollVacationProvision',
  'payrollReserveFundProvision',
  'employeeLoans',
  'payrollOtherDeductions',
] as const
export type AccountMapKey = (typeof ACCOUNT_MAP_KEYS)[number]

export interface Settings {
  _id: 'main'
  company: {
    ruc: string
    legalName: string
    tradeName: string
    address: string
    keepsAccounting: boolean
    specialTaxpayer: string
  }
  /** 1 = pruebas, 2 = producción. */
  sriEnvironment: 1 | 2
  accounts: Record<AccountMapKey, string>
  /** Último mes cerrado "AAAA-MM": nada se graba en o antes de él. */
  lockedThrough: string | null
  /** SBU (centavos) y tasas de la nómina en %. */
  payroll: import('./payroll').PayrollRates
}

export interface ErpUser {
  _id: string
  email: string
  name: string
  phone: string
  role: import('./index').Role
  warehouseId: string | null
  isActive: boolean
  lastLoginAt: string | null
}
