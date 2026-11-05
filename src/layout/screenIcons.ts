import type { IconName } from '@/components/ui/icons'
import { site, type ModuleKey, type SectionKey } from '@/config/site'

/**
 * Icono de cada pantalla (menú lateral y encabezado), derivado de su ruta sin
 * tocar los archivos de src/router/modules: primer tramo del path → icono;
 * si no está en la lista, el de su sección (procesos, reportes,
 * mantenimientos) y, al final, el del módulo. Una pantalla nueva ya sale con icono.
 */
const BY_SEGMENT: Record<string, IconName> = {
  notificaciones: 'bell',
  transacciones: 'exchange',
  conciliacion: 'check-double',
  'cheques-pendientes': 'money-check',
  'cheques-posfechados': 'money-check',
  saldos: 'scale',
  'libro-bancos': 'ledger',
  'libro-diario': 'ledger',
  'libro-mayor': 'ledger',
  'bancos-cajas': 'bank',
  empresa: 'building',
  'mapa-contable': 'diagram',
  'cierre-meses': 'calendar-check',
  'cierre-anual': 'lock',
  usuarios: 'users',
  migracion: 'file-import',
  'plan-de-cuentas': 'sitemap',
  'importar-plan': 'file-import',
  'importar-xml': 'file-import',
  terceros: 'users',
  clientes: 'users',
  proveedores: 'truck',
  productos: 'box',
  grupos: 'tags',
  bodegas: 'warehouse',
  comprobantes: 'file-lines',
  'balance-comprobacion': 'scale',
  'balance-general': 'scale',
  'estado-resultados': 'chart-line',
  comparativo: 'report',
  cobros: 'receivables',
  retenciones: 'taxes',
  'retenciones-venta': 'taxes',
  'retenciones-emitidas': 'taxes',
  'codigos-retencion': 'tags',
  'facturas-cobros': 'list',
  'cartera-edades': 'clock',
  'estado-cuenta': 'file-lines',
  comisiones: 'handshake',
  facturas: 'invoice',
  'notas-credito': 'file-minus',
  'notas-debito': 'file-plus',
  proformas: 'file-lines',
  'aprobar-pagos': 'check-circle',
  pagos: 'money',
  anticipos: 'wallet',
  'reporte-anticipos': 'wallet',
  'reporte-compras': 'report',
  'reporte-ventas': 'chart-line',
  'mas-vendidos': 'trophy',
  ats: 'file-contract',
  'compras-sustento': 'list',
  'cuadre-mensual': 'scale',
  'toma-fisica': 'clipboard',
  kardex: 'layers',
  negativos: 'trend-down',
  'bajo-minimo': 'alert',
}

/** El mismo tramo significa otra cosa en otro módulo: las facturas de CxP son de proveedores. */
const OVERRIDES: Partial<Record<ModuleKey, Record<string, IconName>>> = {
  cxp: { facturas: 'payables' },
}

const BY_SECTION: Partial<Record<SectionKey, IconName>> = {
  procesos: 'process',
  reportes: 'report',
  mantenimientos: 'maintenance',
  especiales: 'special',
}

export function moduleIcon(module: ModuleKey | undefined): IconName {
  return site.modules.find((m) => m.key === module)?.icon ?? 'home'
}

/** `path` relativo al módulo ('facturas/nueva') o la ruta completa ('/cxp/facturas/123'). */
export function screenIcon(module: ModuleKey | undefined, path: string, section?: SectionKey): IconName {
  const parts = path.split('/').filter(Boolean)
  const segment = (parts[0] === module ? parts[1] : parts[0]) ?? ''
  if (!segment) return moduleIcon(module)
  return (module && OVERRIDES[module]?.[segment]) ?? BY_SEGMENT[segment] ?? (section && BY_SECTION[section]) ?? moduleIcon(module)
}
