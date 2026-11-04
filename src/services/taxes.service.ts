import APIBase from './httpBase'
import type { ListParams } from './catalog.service'

/** Impuestos (`/api/taxes/*`). `period` = "AAAA-MM"; montos en CENTAVOS. */
export interface AtsPurchase {
  docId: string
  supplierName: string
  codSustento: string
  idProv: string
  tipoComprobante: string
  establecimiento: string
  puntoEmision: string
  secuencial: string
  fechaEmision: string
  baseImponible: number
  baseImpGrav: number
  montoIva: number
}

export interface AtsSale {
  idCliente: string
  customerName: string
  tipoComprobante: string
  numeroComprobantes: number
  baseImponible: number
  baseImpGrav: number
  montoIva: number
  valorRetIva: number
  valorRetRenta: number
}

export interface AtsSummary {
  period: string
  informante: { IdInformante: string; razonSocial: string; numEstabRuc: string; totalVentas: number }
  compras: AtsPurchase[]
  ventas: AtsSale[]
  anulados: { tipoComprobante: string; establecimiento: string; puntoEmision: string; secuencialInicio: string; autorizacion: string }[]
  totals: Record<string, number>
  warnings: string[]
}

export interface ReconciliationItem {
  concepto: string
  label: string
  cuentas: string[]
  valorDocumentos: number
  valorContable: number
  diferencia: number
  cuadra: boolean
  byEntryType: Record<string, number>
}

export interface Reconciliation {
  period: string
  signConvention: string
  excludedEntryTypes: string[]
  items: ReconciliationItem[]
  cuadra: boolean
  form104: { referencial: boolean; nota: string; casilleros: { casillero: string; label: string; valor: number }[] }
  warnings: string[]
}

class TaxesService extends APIBase {
  private async read<T>(endpoint: string, params: ListParams = {}) {
    return (await this.get<T>(`taxes/${endpoint}`, undefined, { params })).data
  }

  ats = (period: string) => this.read<AtsSummary>('ats', { period })
  reconciliation = (period: string) => this.read<Reconciliation>('reconciliation', { period })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  report = (name: 'purchases-by-tax-support' | 'withholdings' | 'sales-withholdings', params: ListParams) => this.read<any>(`reports/${name}`, params)

  /** El XML como texto: se descarga con un Blob o se copia (el sandbox puede bloquear descargas). */
  async atsXml(period: string) {
    const { data } = await this.get<string>('taxes/ats/xml', undefined, { params: { period }, responseType: 'text', timeout: 60000 })
    return data
  }
}

export const taxesService = new TaxesService()
