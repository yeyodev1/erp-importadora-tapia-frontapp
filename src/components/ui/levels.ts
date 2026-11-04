import type { IconName } from './icons'

/**
 * Niveles de aviso: el mismo color e icono en avisos, banners, chips de
 * tabla y la campana. Color solo con significado: rojo = hay que actuar ya,
 * ámbar = atención, azul = informativo, verde = todo bien.
 */
export type Level = 'danger' | 'warning' | 'info' | 'success'

/** De lo más urgente a lo menos: para ordenar y para elegir "el peor". */
export const LEVELS: Level[] = ['danger', 'warning', 'info', 'success']

export const LEVEL_ICON: Record<Level, IconName> = {
  danger: 'alert-circle',
  warning: 'alert',
  info: 'info',
  success: 'check-circle',
}

/** El nivel más urgente de una lista (o undefined si está vacía). */
export const worstLevel = (levels: Level[]): Level | undefined => LEVELS.find((l) => levels.includes(l))
