import type { Level } from '@/components/ui/levels'

/** Copy de la campana, el panel de avisos y la pantalla /notificaciones. */
export const notifications = {
  bell: 'Notificaciones',
  bellCount: (n: number) => (n ? `${n} ${n === 1 ? 'aviso nuevo' : 'avisos nuevos'}` : 'Sin avisos nuevos'),
  title: 'Notificaciones',
  subtitle: 'Lo que necesita atención en tus módulos. Se recalcula solo cada 2 minutos: al resolverlo, el aviso desaparece.',
  markAll: 'Marcar todo como visto',
  markSeen: 'Marcar como visto',
  seen: 'Visto',
  new: 'Nuevo',
  viewAll: 'Ver todas',
  open: 'Abrir',
  refresh: 'Actualizar',
  updated: 'Actualizado',
  emptyTitle: 'Todo al día',
  empty: 'No hay avisos para tu rol. Cuando algo necesite atención (SRI, cobros, stock, cierres) aparece aquí.',
  emptyLevel: 'No hay avisos de este nivel.',
  error: 'No se pudieron cargar los avisos.',
  /** Toast cuando llega un aviso rojo nuevo. */
  urgent: (title: string, more: number) => (more > 0 ? `${title} y ${more} ${more === 1 ? 'aviso urgente más' : 'avisos urgentes más'}` : title),
  all: 'Todos',
  filterLabel: 'Filtrar por nivel',
  levels: {
    danger: 'Urgente',
    warning: 'Atención',
    info: 'Información',
    success: 'Listo',
  } as Record<Level, string>,
  levelHelp: {
    danger: 'Hay que resolverlo hoy: comprobantes rechazados, cheques por depositar, stock negativo, cartera de más de 90 días.',
    warning: 'Conviene revisarlo pronto: sin firma, por vencer, bajo el mínimo, mes sin cerrar.',
    info: 'Para tener en cuenta: pagos aprobados por emitir.',
    success: 'Todo en orden.',
  } as Record<Level, string>,
  /** Banners de pantalla (los pinta el layout). */
  sriTest: {
    title: 'Estás en ambiente de PRUEBAS del SRI',
    message: 'Las facturas, notas y retenciones que se emitan no tienen validez tributaria.',
    action: 'Ir a Empresa',
  },
  lockedDate: {
    title: 'Este mes está cerrado',
    message: (month: string) => `Contabilidad cerró hasta ${month}: no se puede grabar con esta fecha. Elige una fecha de un mes abierto.`,
  },
}
