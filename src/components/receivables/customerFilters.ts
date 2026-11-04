import { facturacion as t } from '@/config/copy/facturacion'

/** Filtros de cliente de ventas y cartera (texto como está en la ficha; vacío = Todos). */
export interface CustomerFilterValues {
  sellerName: string
  parish: string
  branch: string
  customerType: string
  series: string
}
export type CustomerFilterKey = keyof CustomerFilterValues

export const blankCustomerFilters = (): CustomerFilterValues => ({ sellerName: '', parish: '', branch: '', customerType: '', series: '' })

/** Solo los que tienen valor, recortados, para `params` del API. */
export function customerParams(v: CustomerFilterValues): Record<string, string> {
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.trim()]).filter(([, x]) => x))
}

const labels: Record<CustomerFilterKey, string> = {
  sellerName: t.fields.seller.label,
  parish: t.fields.parish.label,
  branch: t.fields.branch.label,
  customerType: t.fields.customerType.label,
  series: t.fields.series.label,
}

/** Líneas para la hoja impresa: "Vendedor: RUBEN PALMA". */
export function customerSummary(v: CustomerFilterValues): string[] {
  return Object.entries(customerParams(v)).map(([k, x]) => `${labels[k as CustomerFilterKey]}: ${x}`)
}

