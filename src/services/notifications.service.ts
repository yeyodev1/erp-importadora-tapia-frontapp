import APIBase from './httpBase'
import type { Level } from '@/components/ui/levels'

/** Aviso de la campana (`GET /api/notifications`). El API lo calcula al vuelo según el rol. */
export interface Notice {
  /** Estable por tipo de aviso ("sri-invoices-danger"): con él se recuerda si ya se vio. */
  id: string
  level: Level
  /** Nombre de `icons.ts`; si no existe se usa el del nivel. */
  icon: string
  title: string
  message: string
  count: number
  /** Ruta del front, con su filtro: "/facturacion/facturas?sriStatus=devuelto". */
  link: string
  createdAt: string
}

class NotificationsService extends APIBase {
  async list() {
    return (await this.get<Notice[]>('notifications')).data
  }
}

export const notificationsService = new NotificationsService()
