import type { RouteMeta } from 'vue-router'
import type { Role } from '@/types'
import type { ModuleKey } from './site'

/**
 * Qué ve y qué graba cada rol. Espeja `requireRoles` del API: si acá se
 * muestra un botón de guardar, el API también lo acepta.
 */
export type Access = 'write' | 'read' | 'none'

const ALL: ModuleKey[] = [
  'inicio',
  'bancos',
  'contabilidad',
  'cxp',
  'facturacion',
  'cxc',
  'impuestos',
  'inventario',
  'nomina',
  'configuracion',
]
const every = (access: Access) => Object.fromEntries(ALL.map((m) => [m, access])) as Record<ModuleKey, Access>

const MATRIX: Record<Role, Partial<Record<ModuleKey, Access>>> = {
  admin: every('write'),
  // Todo menos usuarios (las rutas de usuarios son adminOnly).
  contabilidad: every('write'),
  facturacion: { inicio: 'read', facturacion: 'write', cxc: 'read', inventario: 'read' },
  cartera: { inicio: 'read', cxc: 'write', facturacion: 'read' },
  bodega: { inicio: 'read', inventario: 'write' },
  // shortcut: el vendedor usa la app de pedidos; acá solo ve Inicio hasta definir su alcance.
  vendedor: { inicio: 'read' },
  auditor: every('read'),
}

export function moduleAccess(role: Role | undefined, module: ModuleKey): Access {
  return (role && MATRIX[role]?.[module]) || 'none'
}

/** Puede abrir la pantalla. */
export function canView(role: Role | undefined, meta: RouteMeta): boolean {
  if (!meta.module) return true
  if (meta.adminOnly && role !== 'admin') return false
  return moduleAccess(role, meta.module) !== 'none'
}

/**
 * Puede grabar en la pantalla: escribe en el módulo y, si la ruta dice
 * `writers`, además es uno de esos roles (gerencia pasa siempre).
 */
export function canWrite(role: Role | undefined, meta: RouteMeta): boolean {
  if (!role || !meta.module || !canView(role, meta)) return false
  if (moduleAccess(role, meta.module) !== 'write') return false
  return !meta.writers || role === 'admin' || meta.writers.includes(role)
}
