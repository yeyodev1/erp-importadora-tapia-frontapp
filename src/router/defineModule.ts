import type { RouteComponent, RouteRecordRaw } from 'vue-router'
import type { ModuleKey, SectionKey } from '@/config/site'
import type { Role } from '@/types'

/** Una pantalla de un módulo: su ruta y su entrada en el menú. */
export interface Screen {
  /** Relativo al módulo: 'facturas' → /facturacion/facturas. '' = raíz del módulo. */
  path: string
  name: string
  title: string
  section: SectionKey
  component: () => Promise<RouteComponent>
  props?: Record<string, unknown>
  writers?: Role[]
  adminOnly?: boolean
  hidden?: boolean
}

export interface ModuleDef {
  key: ModuleKey
  screens: Screen[]
  routes: RouteRecordRaw[]
}

/**
 * Arma las rutas de un módulo. El menú lateral sale de estas mismas
 * pantallas, en este mismo orden: agregar una pantalla es agregar una
 * entrada acá, en el archivo de su módulo.
 */
export function defineModule(key: ModuleKey, screens: Screen[]): ModuleDef {
  const base = key === 'inicio' ? '' : key
  const routes: RouteRecordRaw[] = screens.map((s) => ({
    path: [base, s.path].filter(Boolean).join('/'),
    name: s.name,
    component: s.component,
    props: s.props ?? false,
    meta: {
      title: s.title,
      requiresAuth: true,
      module: key,
      section: s.section,
      writers: s.writers,
      adminOnly: s.adminOnly,
      hidden: s.hidden,
    },
  }))
  const first = screens.find((s) => !s.hidden && s.path)
  if (base && first) routes.unshift({ path: base, redirect: { name: first.name } })
  return { key, screens, routes }
}
