import APIBase from './httpBase'
import type { Account, BankAccount, Paginated, Party, Product, ProductGroup, Warehouse } from '@/types'

/** Recursos de `/api/catalog/*` y el tipo que devuelve cada uno. */
export interface CatalogResources {
  accounts: Account
  parties: Party
  warehouses: Warehouse
  'product-groups': ProductGroup
  'bank-accounts': BankAccount
  products: Product
}
export type CatalogResource = keyof CatalogResources

/**
 * Parámetros de listado: `q` busca en los campos del catálogo, `active`
 * ('true' | 'false' | 'all'), `page`/`limit` (máx. 500) y filtros propios
 * de cada recurso (`isCustomer`, `kind`, `groupId`…).
 */
export type ListParams = Record<string, string | number | boolean | undefined>

class CatalogService extends APIBase {
  async list<R extends CatalogResource>(resource: R, params: ListParams = {}) {
    const { data } = await this.get<Paginated<CatalogResources[R]>>(`catalog/${resource}`, undefined, { params })
    return data
  }

  /** Trae todas las páginas (catálogos chicos o el árbol del plan de cuentas). */
  async listAll<R extends CatalogResource>(resource: R, params: ListParams = {}) {
    const items: CatalogResources[R][] = []
    for (let page = 1; ; page++) {
      const res = await this.list(resource, { ...params, page, limit: 500 })
      items.push(...res.items)
      if (page >= res.pages) return items
    }
  }

  async getOne<R extends CatalogResource>(resource: R, id: string) {
    const { data } = await this.get<CatalogResources[R]>(`catalog/${resource}/${id}`)
    return data
  }

  async create<R extends CatalogResource>(resource: R, body: Partial<CatalogResources[R]>) {
    const { data } = await this.post<CatalogResources[R]>(`catalog/${resource}`, body)
    return data
  }

  async update<R extends CatalogResource>(resource: R, id: string, body: Partial<CatalogResources[R]>) {
    const { data } = await this.put<CatalogResources[R]>(`catalog/${resource}/${id}`, body)
    return data
  }

  /** Tercero por RUC/cédula exacta; 404 si no existe. */
  async partyByIdentification(identification: string) {
    const { data } = await this.get<Party>(`catalog/parties/by-id/${encodeURIComponent(identification)}`)
    return data
  }
}

export const catalogService = new CatalogService()
