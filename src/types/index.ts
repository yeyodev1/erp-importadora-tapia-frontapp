/** Forma con la que httpBase rechaza cualquier error del API. */
export interface ApiError {
  status: number
  message: string
  data?: unknown
}

/** Todo listado del API: `{ items, total, page, pages }`. */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pages: number
}

export const ROLES = ['admin', 'contabilidad', 'facturacion', 'cartera', 'bodega', 'vendedor', 'auditor'] as const
export type Role = (typeof ROLES)[number]

/** Lo que devuelve el backapp en /auth/login y /auth/me. */
export interface SessionUser {
  id: string
  email: string
  name: string
  phone: string
  role: Role
  warehouseId: string | null
}

/** Opción de los selectores propios (BaseCombobox, pickers). */
export interface ComboOption {
  value: string
  label: string
  hint?: string
  image?: string
}

export * from './catalog'
