import type { ModuleKey, SectionKey } from '@/config/site'
import type { Role } from '@/types'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    guestOnly?: boolean
    /** Módulo de la barra lateral al que pertenece la pantalla. */
    module?: ModuleKey
    /** Submenú: Procesos, Reportes, Mantenimientos… */
    section?: SectionKey
    /** Solo gerencia la abre (Usuarios). */
    adminOnly?: boolean
    /** Si está, solo estos roles (y gerencia) graban; el resto la ve en lectura. */
    writers?: Role[]
    /** No aparece en el menú (detalle de un documento, etc.). */
    hidden?: boolean
  }
}

export {}
